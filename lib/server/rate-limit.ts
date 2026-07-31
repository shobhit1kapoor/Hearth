import "server-only";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { getServerEnvironment } from "@/lib/config/env";

export type RateLimitKind = "login" | "upload" | "ai" | "translation" | "demo_reset" | "email" | "export" | "deletion";

const policies: Record<RateLimitKind, { requests: number; window: `${number} ${"s" | "m" | "h"}` }> = {
  login: { requests: 8, window: "15 m" },
  upload: { requests: 20, window: "1 h" },
  ai: { requests: 12, window: "10 m" },
  translation: { requests: 20, window: "10 m" },
  demo_reset: { requests: 15, window: "10 m" },
  email: { requests: 20, window: "1 h" },
  export: { requests: 6, window: "1 h" },
  deletion: { requests: 3, window: "24 h" },
};

const configuredLimiters = new Map<RateLimitKind, Ratelimit>();
const memoryWindows = new Map<string, { count: number; resetAt: number }>();

export async function limitRequest(kind: RateLimitKind, identifier: string) {
  const env = getServerEnvironment();
  const policy = policies[kind];
  if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
    let limiter = configuredLimiters.get(kind);
    if (!limiter) {
      const redis = new Redis({
        url: env.UPSTASH_REDIS_REST_URL,
        token: env.UPSTASH_REDIS_REST_TOKEN,
      });
      limiter = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(policy.requests, policy.window),
        analytics: false,
        prefix: `hearth:${kind}`,
        timeout: 1_500,
      });
      configuredLimiters.set(kind, limiter);
    }
    return limiter.limit(identifier);
  }

  const now = Date.now();
  const duration = parseWindow(policy.window);
  const key = `${kind}:${identifier}`;
  const current = memoryWindows.get(key);
  if (!current || current.resetAt <= now) {
    const resetAt = now + duration;
    memoryWindows.set(key, { count: 1, resetAt });
    return { success: true, limit: policy.requests, remaining: policy.requests - 1, reset: resetAt, pending: Promise.resolve() };
  }
  current.count += 1;
  return {
    success: current.count <= policy.requests,
    limit: policy.requests,
    remaining: Math.max(0, policy.requests - current.count),
    reset: current.resetAt,
    pending: Promise.resolve(),
  };
}

function parseWindow(window: string) {
  const [amount, unit] = window.split(" ");
  const multiplier = unit === "s" ? 1_000 : unit === "m" ? 60_000 : 3_600_000;
  return Number(amount) * multiplier;
}

export function requestIdentifier(request: Request, userId?: string) {
  if (userId) return `user:${userId}`;
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? request.headers.get("x-real-ip")
    ?? "unknown";
  return `ip:${ip}`;
}
