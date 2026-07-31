import { z } from "zod";

const booleanWithDefault = (defaultValue: boolean) => z
  .enum(["true", "false"])
  .optional()
  .transform((value) => value === undefined ? defaultValue : value === "true");

const optionalText = (minimumLength = 1) => z.preprocess(
  (value) => typeof value === "string" && value.trim() === "" ? undefined : value,
  z.string().min(minimumLength).optional(),
);

const optionalUrl = z.preprocess(
  (value) => typeof value === "string" && value.trim() === "" ? undefined : value,
  z.string().url().optional(),
);

const textWithDefault = (defaultValue: string, minimumLength = 1) => z.preprocess(
  (value) => typeof value === "string" && value.trim() === "" ? undefined : value,
  z.string().min(minimumLength).default(defaultValue),
);

const serverEnvironmentSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  PUBLIC_DEMO_MODE: booleanWithDefault(true),
  ALLOW_REAL_PATIENT_DATA: booleanWithDefault(false),
  ENABLE_EXTERNAL_EMAIL: booleanWithDefault(false),
  ENABLE_REAL_AI: booleanWithDefault(false),
  NVIDIA_API_KEY: optionalText(),
  NVIDIA_BASE_URL: z.string().url().default("https://integrate.api.nvidia.com/v1"),
  NVIDIA_MODEL: z.string().min(1).default("moonshotai/kimi-k2.6"),
  NEXT_PUBLIC_SUPABASE_URL: optionalUrl,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: optionalText(),
  SUPABASE_SERVICE_ROLE_KEY: optionalText(),
  UPSTASH_REDIS_REST_URL: optionalUrl,
  UPSTASH_REDIS_REST_TOKEN: optionalText(),
  RESEND_API_KEY: optionalText(),
  EMAIL_FROM: textWithDefault("HEARTH <notifications@example.com>", 3),
  NEXT_PUBLIC_SENTRY_DSN: optionalUrl,
  SENTRY_AUTH_TOKEN: optionalText(),
  DATA_ENCRYPTION_SECRET: optionalText(32),
  CRON_SECRET: optionalText(24),
});

export type ServerEnvironment = z.infer<typeof serverEnvironmentSchema>;

let cachedEnvironment: ServerEnvironment | undefined;

export function getServerEnvironment(): ServerEnvironment {
  if (cachedEnvironment) return cachedEnvironment;
  const result = serverEnvironmentSchema.safeParse(process.env);
  if (!result.success) {
    throw new Error(`Invalid HEARTH environment: ${result.error.issues.map((issue) => issue.path.join(".")).join(", ")}`);
  }
  cachedEnvironment = result.data;
  return cachedEnvironment;
}

export function getServiceReadiness() {
  const env = getServerEnvironment();
  return {
    supabase: Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY && env.SUPABASE_SERVICE_ROLE_KEY),
    ai: Boolean(env.ENABLE_REAL_AI && env.NVIDIA_API_KEY),
    rateLimiting: Boolean(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN),
    email: Boolean(env.ENABLE_EXTERNAL_EMAIL && env.RESEND_API_KEY),
    monitoring: Boolean(env.NEXT_PUBLIC_SENTRY_DSN),
    realPatientDataAllowed: env.ALLOW_REAL_PATIENT_DATA,
    publicDemo: env.PUBLIC_DEMO_MODE,
  };
}
