import type { ZodType } from "zod";

export const SAFE_COMPLETION_EVIDENCE = "Record the real-world outcome and confirm it with the responsible person before marking this task complete.";

type StructuredOutputNormalizer = (value: unknown) => unknown;

export function parseStructuredOutput<T>(
  content: string,
  schema: ZodType<T>,
  normalize: StructuredOutputNormalizer = (value) => value,
): T {
  const candidates = [
    content.trim(),
    content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim(),
    extractFirstJsonObject(content),
  ].filter(Boolean);

  let lastError: unknown;
  for (const candidate of candidates) {
    try {
      return schema.parse(normalize(JSON.parse(candidate)));
    } catch (error) {
      lastError = error;
    }
  }
  throw new Error(`AI output failed strict schema validation: ${lastError instanceof Error ? lastError.message : "invalid JSON"}`);
}

export function normalizeAnalyzeDocumentOutput(value: unknown) {
  if (!isRecord(value) || !Array.isArray(value.commitments)) return value;
  return {
    ...value,
    commitments: value.commitments.map((commitment) => {
      if (!isRecord(commitment)) return commitment;
      return {
        ...commitment,
        ...(commitment.completionEvidence === null || commitment.completionEvidence === undefined
          ? { completionEvidence: SAFE_COMPLETION_EVIDENCE }
          : {}),
        ...(commitment.requiresHumanReview === null || commitment.requiresHumanReview === undefined
          ? { requiresHumanReview: true }
          : {}),
        ...(commitment.sourcePage === 0 ? { sourcePage: null } : {}),
      };
    }),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function extractFirstJsonObject(value: string) {
  const start = value.indexOf("{");
  const end = value.lastIndexOf("}");
  return start >= 0 && end > start ? value.slice(start, end + 1) : "";
}
