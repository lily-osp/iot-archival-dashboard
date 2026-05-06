import prisma from "./prisma";
import redis from "./redis";

const MAX_DEPTH = 5;

export async function executeActions(actions: any[], depth: number = 0, sourceFeedKey?: string, triggeredIds: string[] = []) {
  if (depth > MAX_DEPTH) {
    console.error("System Archive: Max automation trigger depth exceeded to prevent infinite loops.");
    return;
  }

  // Optional: Global rate limiting per feed key to prevent runaway sensors
  if (sourceFeedKey) {
    const cooldownKey = `cooldown:feed:${sourceFeedKey}`;
    const recentTriggers = await redis.get(cooldownKey);
    if (recentTriggers && parseInt(recentTriggers) > 10) { // Max 10 triggers per window
      console.warn(`System Archive: Rate limit exceeded for feed [${sourceFeedKey}]. Throttling execution.`);
      return;
    }
    await redis.incr(cooldownKey);
    if (parseInt(recentTriggers || "0") === 0) {
      await redis.expire(cooldownKey, 5); // 5 second window
    }
  }

  for (const action of actions) {
    if (action.type === "delay") {
      console.log(`System Archive: Delaying for ${action.delayMs}ms`);
      await new Promise((resolve) => setTimeout(resolve, action.delayMs || 0));
    } else if (action.type === "publish" && action.feedKey) {
      if (action.feedKey !== sourceFeedKey) {
        const { sendFeedData } = await import("./adafruit");
        console.log(`System Archive: Action Execution: ${action.feedKey} -> ${action.value}`);
        await sendFeedData(action.feedKey, action.value!).catch((e) => {
          console.error(`System Archive: Automation Action [${action.feedKey}] Failed:`, e.message);
        });
      }
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
    } else if (action.type === "trigger" && action.value) {
      const targetId = action.value;
      
      if (triggeredIds.includes(targetId)) {
        console.warn(`System Archive: Circular automation trigger detected for ID [${targetId}]. Aborting chain.`);
        continue;
      }

      console.log(`System Archive: Triggering Connected Automation ID [${targetId}] (Depth: ${depth + 1})`);
      try {
        const targetRule = await prisma.automation.findUnique({
          where: { id: targetId },
          include: { actions: { orderBy: { order: "asc" } } },
        });

        if (targetRule && targetRule.isActive) {
          const targetActions = targetRule.actions.filter((a: any) => !a.isElse);
          if (targetActions.length > 0) {
            await executeActions(targetActions, depth + 1, sourceFeedKey, [...triggeredIds, targetId]);
          }
        }
      } catch (e: any) {
        console.error(`System Archive: Trigger Connected Automation Failed:`, e.message);
      }
    }
  }
}
