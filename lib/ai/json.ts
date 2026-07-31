import type { ZodType } from "zod";

export function parseStructuredOutput<T>(content: string, schema: ZodType<T>): T {
  const candidates = [
    content.trim(),
    content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim(),
    extractFirstJsonObject(content),
  ].filter(Boolean);

  let lastError: unknown;
  for (const candidate of candidates) {
    try {
      return schema.parse(JSON.parse(candidate));
    } catch (error) {
      lastError = error;
    }
  }
  throw new Error(`AI output failed strict schema validation: ${lastError instanceof Error ? lastError.message : "invalid JSON"}`);
}

function extractFirstJsonObject(value: string) {
  const start = value.indexOf("{");
  const end = value.lastIndexOf("}");
  return start >= 0 && end > start ? value.slice(start, end + 1) : "";
}
