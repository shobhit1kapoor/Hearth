import { z } from "zod";

export const onboardingSchema = z.object({
  careSpaceName: z.string().trim().min(1).max(120),
  recipientName: z.string().trim().min(1).max(120),
  relationship: z.string().trim().min(1).max(80),
  preferredLanguage: z.enum(["en", "es"]),
  notificationsEnabled: z.boolean(),
  consentAcknowledged: z.literal(true),
});

export const commitmentUpdateSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("correct"),
    baseVersion: z.number().int().positive(),
    title: z.string().trim().min(1).max(180),
    description: z.string().trim().min(1).max(1200),
    reason: z.string().trim().min(1).max(500),
  }),
  z.object({ action: z.literal("reject"), reason: z.string().trim().min(1).max(500) }),
  z.object({ action: z.literal("confirm"), completionEvidence: z.string().trim().max(1000).optional() }),
  z.object({ action: z.literal("assign"), memberId: z.string().uuid() }),
  z.object({ action: z.literal("accept") }),
  z.object({ action: z.literal("start") }),
  z.object({ action: z.literal("complete"), completionEvidence: z.string().trim().min(1).max(1000) }),
  z.object({ action: z.literal("verify"), completionEvidence: z.string().trim().min(1).max(1000) }),
]);

export const notificationPreferencesSchema = z.object({
  masterEnabled: z.boolean(),
  emailEnabled: z.boolean(),
  inAppEnabled: z.boolean(),
  dailySummary: z.boolean(),
  categories: z.record(z.string(), z.boolean()),
  quietHours: z.object({
    enabled: z.boolean(),
    start: z.string().regex(/^\d{2}:\d{2}$/),
    end: z.string().regex(/^\d{2}:\d{2}$/),
    days: z.array(z.number().int().min(0).max(6)).min(1).max(7),
    timezone: z.string().min(1).max(80),
  }),
});

export const translationRequestSchema = z.object({
  careSpaceId: z.string().uuid(),
  commitmentId: z.string().uuid().optional(),
  text: z.string().trim().min(1).max(6000),
  targetLanguage: z.enum(["English", "Spanish"]),
  protectedTerms: z.array(z.string().min(1).max(120)).max(100),
});
