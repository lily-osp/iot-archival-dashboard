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

      if (isTriggered) {
        console.log(`System Archive: Rule [${rule.name}] triggered. Executing ${rule.actions.length} actions.`);

        for (const action of rule.actions) {
          if (action.type === "delay") {
            console.log(`System Archive: Delaying for ${action.delayMs}ms`);
            await new Promise((resolve) => setTimeout(resolve, action.delayMs || 0));
          } else if (action.type === "publish" && action.feedKey) {
            const { sendFeedData } = await import("./adafruit");
            console.log(`System Archive: Action Execution: ${action.feedKey} -> ${action.value}`);
            await sendFeedData(action.feedKey, action.value!).catch((e) => {
              console.error(`System Archive: Automation Action [${action.feedKey}] Failed:`, e.message);
            });
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
