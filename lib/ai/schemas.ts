import { z } from "zod";

export const evidenceKindSchema = z.enum([
  "verified_source_fact",
  "caregiver_report",
  "caregiver_observation",
  "ai_inference",
  "unresolved_conflict",
  "unknown",
]);

export const riskLevelSchema = z.enum(["low", "moderate", "high", "critical"]);

export const careCommitmentCandidateSchema = z.object({
  title: z.string().min(1).max(180),
  plainLanguageDescription: z.string().min(1).max(1200),
  category: z.string().min(1).max(80),
  possibleOwner: z.string().max(120).nullable(),
  dueDate: z.string().date().nullable(),
  timeWindow: z.string().max(120).nullable(),
  sourceDocumentId: z.string().uuid(),
  sourcePage: z.number().int().positive().nullable(),
  sourceExcerpt: z.string().min(1).max(2000),
  sourceDate: z.string().date().nullable(),
  confidence: z.number().min(0).max(1),
  riskLevel: riskLevelSchema,
  requiredEquipment: z.array(z.string().max(160)).max(20),
  requiredSkill: z.array(z.string().max(160)).max(20),
  dependencies: z.array(z.string().max(240)).max(30),
  possibleConflict: z.string().max(1000).nullable(),
  requiresHumanReview: z.boolean(),
  recommendedEscalationTarget: z.string().max(160).nullable(),
  completionEvidence: z.string().min(1).max(500),
  translationStatus: z.enum(["not_requested", "machine_translated", "needs_human_review", "verified"]),
  evidenceKind: evidenceKindSchema,
});

export const analyzeDocumentResultSchema = z.object({
  documentType: z.string().min(1).max(100),
  documentDate: z.string().date().nullable(),
  summary: z.string().min(1).max(1200),
  commitments: z.array(careCommitmentCandidateSchema).max(100),
  conflicts: z.array(z.object({
    title: z.string().min(1).max(180),
    explanation: z.string().min(1).max(1000),
    sourceExcerpts: z.array(z.string().max(1000)).min(2).max(10),
    severity: riskLevelSchema,
    requiresProfessionalReview: z.boolean(),
  })).max(30),
  warnings: z.array(z.string().max(500)).max(30),
});

export const compareResultSchema = z.object({
  sameInstruction: z.boolean(),
  conflicts: z.array(z.object({
    field: z.enum(["medication", "dose", "frequency", "route", "date", "owner", "other"]),
    firstValue: z.string().max(300),
    secondValue: z.string().max(300),
    explanation: z.string().max(800),
    requiresProfessionalReview: z.boolean(),
  })).max(30),
  plainLanguageExplanation: z.string().max(1000),
});

export const translationResultSchema = z.object({
  originalText: z.string().min(1).max(6000),
  translatedText: z.string().min(1).max(6000),
  language: z.string().min(2).max(40),
  confidence: z.number().min(0).max(1),
  requiresHumanVerification: z.boolean(),
  preservedTerms: z.array(z.string().max(120)).max(100),
  warnings: z.array(z.string().max(500)).max(20),
});

export const draftQuestionResultSchema = z.object({
  subject: z.string().min(1).max(180),
  question: z.string().min(1).max(1600),
  sourceReferences: z.array(z.string().max(500)).min(1).max(20),
  requiresCaregiverApproval: z.literal(true),
});

export type AnalyzeDocumentResult = z.infer<typeof analyzeDocumentResultSchema>;
export type CompareResult = z.infer<typeof compareResultSchema>;
export type TranslationResult = z.infer<typeof translationResultSchema>;
export type DraftQuestionResult = z.infer<typeof draftQuestionResultSchema>;
