import { Queue, Worker } from "bullmq";
import prisma from "./prisma";
import redis from "./redis";

// BullMQ uses ioredis instance internally, so we create a new connection to it.
const redisConnection = {
  url: process.env.REDIS_URL || "redis://localhost:6379",
};

// Queue for automations
export const automationQueue = new Queue("automations", {
  connection: redisConnection,
});

// Worker to execute automations
export const automationWorker = new Worker(
  "automations",
  async (job) => {
    const { automationId } = job.data;
    console.log(`System Archive: Time-Based Automation triggered. ID: ${automationId}`);

    try {
      const rule = await prisma.automation.findUnique({
        where: { id: automationId },
        include: { 
          conditions: true,
          actions: { orderBy: { order: "asc" } } 
        },
      });

      if (!rule || !rule.isActive) {
        console.log(`System Archive: Rule [${automationId}] is inactive or deleted. Skipping.`);
        // Note: In real life you might want to remove the repeatable job here if it's inactive,
        // but handling it dynamically on update is generally better.
        return;
      }

      let conditionsMet = 0;
      for (const cond of rule.conditions) {
        const currentValStr = await redis.get(`last:${cond.feedKey}`);
        if (currentValStr === null) continue;
        
        let triggered = false;
        const msgVal = parseFloat(currentValStr);
        const condVal = parseFloat(cond.value);
        
        if (!isNaN(msgVal) && !isNaN(condVal)) {
          switch (cond.operator) {
            case '>': triggered = msgVal > condVal; break;
            case '<': triggered = msgVal < condVal; break;
            case '>=': triggered = msgVal >= condVal; break;
            case '<=': triggered = msgVal <= condVal; break;
            case '==': triggered = msgVal === condVal; break;
            case '!=': triggered = msgVal !== condVal; break;
          }
        } else {
          switch (cond.operator) {
            case '==': triggered = currentValStr === cond.value; break;
            case '!=': triggered = currentValStr !== cond.value; break;
          }
        }
        if (triggered) conditionsMet++;
      }

      const isTriggered = rule.conditions.length === 0 || 
        (rule.conditionMatch === "ANY" 
          ? conditionsMet > 0 
          : conditionsMet === rule.conditions.length);

      const actionsToRun = isTriggered ? rule.actions.filter((a: any) => !a.isElse) : rule.actions.filter((a: any) => a.isElse);

      if (actionsToRun.length > 0) {
        console.log(`System Archive: Rule [${rule.name}] evaluated (${isTriggered ? 'TRUE' : 'FALSE'}). Executing ${actionsToRun.length} actions.`);

        for (const action of actionsToRun) {
          if (action.type === "delay") {
            console.log(`System Archive: Delaying for ${action.delayMs}ms`);
            await new Promise((resolve) => setTimeout(resolve, action.delayMs || 0));
          } else if (action.type === "publish" && action.feedKey) {
            const { sendFeedData } = await import("./adafruit");
            console.log(`System Archive: Action Execution: ${action.feedKey} -> ${action.value}`);
            await sendFeedData(action.feedKey, action.value!).catch((e) => {
              console.error(`System Archive: Automation Action [${action.feedKey}] Failed:`, e.message);
            });
          } else if (action.type === "webhook" && action.targetUrl) {
            try {
              let parsedPayload = action.payload || "";
              const matches = parsedPayload.match(/\{\{([^}]+)\}\}/g);
              if (matches) {
                for (const match of matches) {
                  const key = match.replace(/\{\{|\}\}/g, "");
                  const val = await redis.get(`last:${key}`);
                  parsedPayload = parsedPayload.replace(match, val || "");
                }
              }
              console.log(`System Archive: Triggering Webhook: ${action.targetUrl}`);
              await fetch(action.targetUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: parsedPayload
              });
            } catch (e: any) {
              console.error(`System Archive: Webhook Failed:`, e.message);
            }
          }
        }
      } else {
        console.log(`System Archive: Rule [${rule.name}] scheduled execution skipped due to unmet conditions.`);
      }
    } catch (err) {
      console.error("System Archive: Time-Based Rule Execution Error:", err);
    }
  },
  {
    connection: redisConnection,
  }
);

automationWorker.on("completed", (job) => {
  // console.log(`Job ${job.id} has completed!`);
});

automationWorker.on("failed", (job, err) => {
  console.error(`System Archive: Job ${job?.id} failed with ${err.message}`);
});

// Helper to remove all repeatable jobs for a given automation ID
export async function removeRepeatableJob(automationId: string) {
  const repeatableJobs = await automationQueue.getRepeatableJobs();
  const jobToRemove = repeatableJobs.find((job) => job.name === `automation-${automationId}`);
  if (jobToRemove) {
    await automationQueue.removeRepeatableByKey(jobToRemove.key);
  }
}

// Helper to add or update a repeatable job for a given automation
export async function upsertRepeatableJob(automation: any) {
  await removeRepeatableJob(automation.id);

  if (automation.isActive && automation.type === "TIME" && automation.scheduleCron) {
    await automationQueue.add(
      `automation-${automation.id}`,
      { automationId: automation.id },
      {
        repeat: {
          pattern: automation.scheduleCron,
          tz: automation.timezone || "UTC",
        },
      }
    );
    console.log(`System Archive: Registered schedule for [${automation.name}]: ${automation.scheduleCron} (${automation.timezone || "UTC"})`);
  }
}

// Helper to sync all active time-based rules on startup
export async function syncAllTimeBasedAutomations() {
  console.log("System Archive: Syncing time-based automations with BullMQ...");
  const automations = await prisma.automation.findMany({
    where: { type: "TIME", isActive: true },
  });

  // Clear existing repeatable jobs to avoid duplicates on restart
  const repeatableJobs = await automationQueue.getRepeatableJobs();
  for (const job of repeatableJobs) {
    await automationQueue.removeRepeatableByKey(job.key);
  }

  for (const auto of automations) {
    await upsertRepeatableJob(auto);
  }
}

// Queue for open data fetching
export const openDataQueue = new Queue("openData", {
  connection: redisConnection,
});

// Simple JSON path extractor (e.g. "current.temperature_2m")
function extractValue(obj: any, path: string): any {
  if (!path) return JSON.stringify(obj);
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}

// Worker to fetch open data
export const openDataWorker = new Worker(
  "openData",
  async (job) => {
    const { sourceId } = job.data;
    try {
      const source = await prisma.openDataSource.findUnique({
        where: { id: sourceId }
      });

      if (!source) {
        console.log(`System Archive: OpenDataSource [${sourceId}] not found. Skipping.`);
        return;
      }

      console.log(`System Archive: Fetching Open Data: ${source.name} from ${source.url}`);
      const res = await fetch(source.url);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      
      const data = await res.json();
      let value = extractValue(data, source.jsonPath);
      
      if (typeof value === 'object') {
        value = JSON.stringify(value);
      } else {
        value = String(value);
      }

      if (source.targetFeedKey) {
        const { sendFeedData } = await import("./adafruit");
        console.log(`System Archive: Routing Open Data [${source.name}] -> Adafruit IO [${source.targetFeedKey}]: ${value}`);
        await sendFeedData(source.targetFeedKey, value).catch(e => {
          console.error(`System Archive: Open Data Push Failed:`, e.message);
        });
      } else {
        // Treat as a dedicated virtual feed
        const virtualKey = `open_${source.id}`;
        console.log(`System Archive: Routing Open Data [${source.name}] -> Virtual Feed [${virtualKey}]: ${value}`);
        redis.publish(`feed:${virtualKey}`, value);
        redis.set(`last:${virtualKey}`, value);

        // Evaluate automations manually for this virtual feed
        try {
          const automations = await prisma.automation.findMany({
            where: { 
              isActive: true,
              conditions: { some: { feedKey: virtualKey } }
            },
            include: { 
              conditions: true,
              actions: { orderBy: { order: 'asc' } }
            }
          });
          
          for (const rule of automations) {
            let conditionsMet = 0;
            for (const cond of rule.conditions) {
              const currentValStr = cond.feedKey === virtualKey ? value : await redis.get(`last:${cond.feedKey}`);
              if (currentValStr === null) continue;
              
              let triggered = false;
              const msgVal = parseFloat(currentValStr);
              const condVal = parseFloat(cond.value);
              
              if (!isNaN(msgVal) && !isNaN(condVal)) {
                switch (cond.operator) {
                  case '>': triggered = msgVal > condVal; break;
                  case '<': triggered = msgVal < condVal; break;
                  case '>=': triggered = msgVal >= condVal; break;
                  case '<=': triggered = msgVal <= condVal; break;
                  case '==': triggered = msgVal === condVal; break;
                  case '!=': triggered = msgVal !== condVal; break;
                }
              } else {
                switch (cond.operator) {
                  case '==': triggered = currentValStr === cond.value; break;
                  case '!=': triggered = currentValStr !== cond.value; break;
                }
              }
              if (triggered) conditionsMet++;
            }

            const isTriggered = rule.conditionMatch === "ANY" 
              ? conditionsMet > 0 
              : conditionsMet === rule.conditions.length;

            if (rule.conditions.length > 0) {
              const actionsToRun = isTriggered ? rule.actions.filter((a: any) => !a.isElse) : rule.actions.filter((a: any) => a.isElse);
              
              if (actionsToRun.length > 0) {
                console.log(`System Archive: Rule [${rule.name}] evaluated by Virtual Feed (${isTriggered ? 'TRUE' : 'FALSE'}). Executing ${actionsToRun.length} actions.`);
                
                for (const action of actionsToRun) {
                if (action.type === "delay") {
                  await new Promise(resolve => setTimeout(resolve, action.delayMs || 0));
                } else if (action.type === "publish" && action.feedKey) {
                  const { sendFeedData } = await import("./adafruit");
                  await sendFeedData(action.feedKey, action.value!).catch(e => {
                    console.error(`System Archive: Automation Action [${action.feedKey}] Failed:`, e.message);
                  });
                } else if (action.type === "webhook" && action.targetUrl) {
                  try {
                    let parsedPayload = action.payload || "";
                    const matches = parsedPayload.match(/\{\{([^}]+)\}\}/g);
                    if (matches) {
                      for (const match of matches) {
                        const key = match.replace(/\{\{|\}\}/g, "");
                        const val = await redis.get(`last:${key}`);
                        parsedPayload = parsedPayload.replace(match, val || "");
                      }
                    }
                    await fetch(action.targetUrl, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: parsedPayload
                    });
                  } catch (e: any) {
                    console.error(`System Archive: Webhook Failed:`, e.message);
                  }
                }
              }
            }
          }
        }
      } catch(err) {
        console.error("System Archive: Rule Evaluation Error from Virtual Feed:", err);
      }
    } catch (err: any) {
      console.error(`System Archive: Open Data Fetch Error [${sourceId}]:`, err.message);
    }
  },
  {
    connection: redisConnection,
  }
);

openDataWorker.on("failed", (job, err) => {
  console.error(`System Archive: Open Data Job ${job?.id} failed with ${err.message}`);
});

export async function removeOpenDataJob(sourceId: string) {
  const repeatableJobs = await openDataQueue.getRepeatableJobs();
  const jobToRemove = repeatableJobs.find((job) => job.name === `open-data-${sourceId}`);
  if (jobToRemove) {
    await openDataQueue.removeRepeatableByKey(jobToRemove.key);
  }
}

export async function upsertOpenDataJob(source: any) {
  await removeOpenDataJob(source.id);
  if (source.scheduleCron) {
    await openDataQueue.add(
      `open-data-${source.id}`,
      { sourceId: source.id },
      {
        repeat: {
          pattern: source.scheduleCron,
          tz: "UTC", // Open data generally polls on UTC schedule
        },
      }
    );
    console.log(`System Archive: Registered schedule for Open Data [${source.name}]: ${source.scheduleCron}`);
  }
}

export async function syncOpenDataJobs() {
  console.log("System Archive: Syncing Open Data sources with BullMQ...");
  const sources = await prisma.openDataSource.findMany();

  const repeatableJobs = await openDataQueue.getRepeatableJobs();
  for (const job of repeatableJobs) {
    await openDataQueue.removeRepeatableByKey(job.key);
  }

  for (const source of sources) {
    await upsertOpenDataJob(source);
  }
}

