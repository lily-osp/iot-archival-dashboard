import prisma from "./prisma";

async function getAioCredentials(accountId?: string, feedKey?: string) {
  if (accountId) {
    const account = await prisma.aioAccount.findUnique({ where: { id: accountId } });
    if (account) return { username: account.username, key: account.key, accountId: account.id };
  }
  
  if (feedKey) {
    const feed = await prisma.feedConfig.findUnique({
      where: { key: feedKey },
      include: { account: true }
    });
    if (feed?.account) {
      return { username: feed.account.username, key: feed.account.key, accountId: feed.account.id };
    }
  }

  const fallback = await prisma.aioAccount.findFirst();
  if (fallback) return { username: fallback.username, key: fallback.key, accountId: fallback.id };

  return { username: process.env.ADAFRUIT_IO_USERNAME, key: process.env.ADAFRUIT_IO_KEY, accountId: null };
}

export interface AioFeed {
  id: number;
  name: string;
  key: string;
  description: string;
  last_value: string;
  updated_at: string;
  accountId?: string;
}

export interface AioData {
  id: string;
  value: string;
  created_at: string;
}

export async function fetchFeeds(accountId?: string): Promise<AioFeed[]> {
  const { username, key, accountId: fetchedAccountId } = await getAioCredentials(accountId);
  if (!username || !key) return [];
  
  const BASE_URL = `https://io.adafruit.com/api/v2/${username}`;

  const response = await fetch(`${BASE_URL}/feeds`, {
    headers: {
      "X-AIO-Key": key,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch feeds: ${response.statusText}`);
  }

  const feeds: AioFeed[] = await response.json();
  return feeds.map(f => ({ ...f, accountId: fetchedAccountId || undefined }));
}

export async function fetchFeedData(feedKey: string): Promise<AioData[]> {
  const { username, key } = await getAioCredentials(undefined, feedKey);
  const BASE_URL = `https://io.adafruit.com/api/v2/${username}`;

  const response = await fetch(`${BASE_URL}/feeds/${feedKey}/data`, {
    headers: {
      "X-AIO-Key": key!,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch feed data: ${response.statusText}`);
  }

  return response.json();
}

export async function createFeed(name: string, key_name?: string, accountId?: string): Promise<AioFeed> {
  const { username, key } = await getAioCredentials(accountId);
  const BASE_URL = `https://io.adafruit.com/api/v2/${username}`;

  const response = await fetch(`${BASE_URL}/feeds`, {
    method: "POST",
    headers: {
      "X-AIO-Key": key!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      feed: {
        name,
        key: key_name || name.toLowerCase().replace(/\s+/g, "-"),
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`System Archive: Adafruit IO Feed Creation failed [${response.status}]:`, errorText);
    throw new Error(`Failed to create feed: ${response.statusText} (${errorText})`);
  }

  const feed: AioFeed = await response.json();
  return { ...feed, accountId };
}

export async function ensureFeed(feedKey: string, name?: string, accountId?: string): Promise<AioFeed> {
  const { username, key } = await getAioCredentials(accountId, feedKey);
  const BASE_URL = `https://io.adafruit.com/api/v2/${username}`;

  // Try to fetch existing feed
  const response = await fetch(`${BASE_URL}/feeds/${feedKey}`, {
    headers: {
      "X-AIO-Key": key!,
    },
  });

  if (response.ok) {
    const feed: AioFeed = await response.json();
    return { ...feed, accountId };
  }

  // If 404, create it
  if (response.status === 404) {
    console.log(`System Archive: Feed ${feedKey} not found. Provisioning...`);
    return createFeed(name || feedKey, feedKey, accountId);
  }

  throw new Error(`Failed to ensure feed: ${response.statusText}`);
}

export async function sendFeedData(feedKey: string, value: string): Promise<AioData> {
  const { username, key, accountId } = await getAioCredentials(undefined, feedKey);
  
  if (!username || !key) {
    throw new Error("ADAFRUIT_IO_CREDENTIALS_MISSING");
  }

  const BASE_URL = `https://io.adafruit.com/api/v2/${username}`;
  const url = `${BASE_URL}/feeds/${feedKey}/data`;

  console.log(`System Archive: Attempting to send data to ${feedKey} for user ${username}`);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "X-AIO-Key": key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ value }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    
    if (response.status === 404) {
      console.log(`System Archive: Feed ${feedKey} not found during send. Auto-provisioning...`);
      await ensureFeed(feedKey, feedKey, accountId || undefined);
      
      // Retry send
      const retryResponse = await fetch(url, {
        method: "POST",
        headers: {
          "X-AIO-Key": key,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ value }),
      });

      if (!retryResponse.ok) {
        const retryErrorText = await retryResponse.text();
        console.error(`System Archive: Adafruit IO POST retry failed [${retryResponse.status}]:`, retryErrorText);
        throw new Error(`Failed to send feed data after provisioning: ${retryResponse.statusText} (${retryErrorText})`);
      }
      
      return retryResponse.json();
    }

    console.error(`System Archive: Adafruit IO POST failed [${response.status}]:`, errorText);
    throw new Error(`Failed to send feed data: ${response.statusText} (${errorText})`);
  }

  return response.json();
}
