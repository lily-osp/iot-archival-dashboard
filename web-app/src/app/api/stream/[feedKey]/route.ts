import { NextRequest } from "next/server";
import Redis from "ioredis";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ feedKey: string }> }
) {
  const { feedKey } = await params;
  const stream = new ReadableStream({
    async start(controller) {
      const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
      
      controller.enqueue(`data: Connected to ${feedKey}\n\n`);

    // If it's a demo feed, start a simulation interval
    let interval: NodeJS.Timeout | null = null;
    if (feedKey.startsWith("demo_")) {
      interval = setInterval(() => {
        let value = "";
        if (feedKey === "demo_temperature") {
          value = (20 + Math.random() * 10).toFixed(1);
        } else if (feedKey === "demo_humidity") {
          value = (40 + Math.random() * 20).toFixed(1);
        } else if (feedKey === "demo_power") {
          value = Math.floor(100 + Math.random() * 100).toString();
        }
        controller.enqueue(`data: ${value}\n\n`);
      }, 3000);
    } else if (feedKey.startsWith("open_")) {
      // Virtual feeds fetch their initial state from Redis, but wait for PubSub for new events
      redis.get(`last:${feedKey}`).then((val) => {
        if (val) controller.enqueue(`data: ${val}\n\n`);
      }).catch(() => {});
    }

      redis.subscribe(`feed:${feedKey}`);

      redis.on("message", (channel, message) => {
        controller.enqueue(`data: ${message}\n\n`);
      });

      request.signal.onabort = () => {
        if (interval) clearInterval(interval);
        redis.quit();
        controller.close();
      };
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
