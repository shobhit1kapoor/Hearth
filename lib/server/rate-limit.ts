import "server-only";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { getServerEnvironment } from "@/lib/config/env";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

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
  const duration = parseWindow(policy.window);
  const databaseResult = await limitWithDatabase(kind, identifier, policy.requests, duration);
  if (databaseResult) return databaseResult;

  if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
    try {
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
      return await limiter.limit(identifier);
    } catch {
      // The database and in-process limiter keep essential actions available.
    }
  }

  const now = Date.now();
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

async function limitWithDatabase(
  kind: RateLimitKind,
  identifier: string,
  requestLimit: number,
  duration: number,
) {
  const database = createSupabaseAdminClient();
  if (!database) return null;
  const limitKey = `${kind}:${identifier}`;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const now = Date.now();
    const { data: current, error: readError } = await database
      .from("service_rate_limits")
      .select("window_started_at, request_count, expires_at")
      .eq("limit_key", limitKey)
      .maybeSingle();
    if (readError) return null;

    if (!current) {
      const reset = now + duration;
      const { error } = await database.from("service_rate_limits").insert({
        limit_key: limitKey,
        window_started_at: new Date(now).toISOString(),
        request_count: 1,
        expires_at: new Date(reset).toISOString(),
      });
      if (!error) return rateLimitResult(true, requestLimit, requestLimit - 1, reset);
      if (error.code === "23505") continue;
      return null;
    }

    if (new Date(current.expires_at).getTime() <= now) {
      const reset = now + duration;
      const { data: resetWindow, error } = await database
        .from("service_rate_limits")
        .update({
          window_started_at: new Date(now).toISOString(),
          request_count: 1,
          expires_at: new Date(reset).toISOString(),
        })
        .eq("limit_key", limitKey)
        .eq("window_started_at", current.window_started_at)
        .eq("request_count", current.request_count)
        .select("request_count")
        .maybeSingle();
      if (error) return null;
      if (resetWindow) return rateLimitResult(true, requestLimit, requestLimit - 1, reset);
      continue;
    }

    const nextCount = Number(current.request_count) + 1;
    const { data: updated, error } = await database
      .from("service_rate_limits")
      .update({ request_count: nextCount })
      .eq("limit_key", limitKey)
      .eq("window_started_at", current.window_started_at)
      .eq("request_count", current.request_count)
      .select("request_count")
      .maybeSingle();
    if (error) return null;
    if (updated) {
      return rateLimitResult(
        nextCount <= requestLimit,
        requestLimit,
        Math.max(0, requestLimit - nextCount),
        new Date(current.expires_at).getTime(),
      );
    }
  }

  return null;
}

function rateLimitResult(success: boolean, limit: number, remaining: number, reset: number) {
  return { success, limit, remaining, reset, pending: Promise.resolve() };
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
