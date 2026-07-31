import { getServerEnvironment } from "@/lib/config/env";
import { parseStructuredOutput } from "./json";
import type {
  AnalyzeDocumentInput,
  CompareInput,
  DraftQuestionInput,
  HearthAIProvider,
  TranslationInput,
} from "./provider";
import { AIProviderUnavailableError } from "./provider";
import {
  analyzeDocumentResultSchema,
  compareResultSchema,
  draftQuestionResultSchema,
  jsonSchemaInstruction,
  translationResultSchema,
} from "./schemas";
import {
  analyzeDocumentPrompt,
  comparePrompt,
  draftQuestionPrompt,
  HEARTH_SYSTEM_PROMPT,
  PROMPT_VERSION,
  translationPrompt,
} from "./prompts";
import { withRetry } from "./retry";

type NvidiaResponse = {
  choices?: Array<{ message?: { content?: string } }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
};

export class NvidiaNimProvider implements HearthAIProvider {
  async analyzeDocument(input: AnalyzeDocumentInput) {
    const userContent: Array<Record<string, unknown>> = [{
      type: "text",
      text: analyzeDocumentPrompt(input),
    }];
    for (const image of input.images ?? []) {
      userContent.push({
        type: "image_url",
        image_url: { url: `data:${image.mimeType};base64,${image.base64}` },
      });
    }
    const content = await this.complete(
      userContent,
      jsonSchemaInstruction("document analysis", analyzeDocumentResultSchema),
    );
    return parseStructuredOutput(content, analyzeDocumentResultSchema);
  }

  async compareInstructions(input: CompareInput) {
    const content = await this.complete(
      comparePrompt(input),
      jsonSchemaInstruction("instruction comparison", compareResultSchema),
    );
    return parseStructuredOutput(content, compareResultSchema);
  }

  async translateInstruction(input: TranslationInput) {
    const content = await this.complete(
      translationPrompt(input),
      jsonSchemaInstruction("translation", translationResultSchema),
    );
    const result = parseStructuredOutput(content, translationResultSchema);
    const missing = input.protectedTerms.filter((term) => !result.translatedText.includes(term));
    if (missing.length > 0) {
      return {
        ...result,
        requiresHumanVerification: true,
        confidence: Math.min(result.confidence, 0.5),
        warnings: [...result.warnings, `Protected terms changed or missing: ${missing.join(", ")}`],
      };
    }
    return result;
  }

  async draftProfessionalQuestion(input: DraftQuestionInput) {
    const content = await this.complete(
      draftQuestionPrompt(input),
      jsonSchemaInstruction("professional question draft", draftQuestionResultSchema),
    );
    return parseStructuredOutput(content, draftQuestionResultSchema);
  }

  private async complete(userContent: string | Array<Record<string, unknown>>, responseContract: string) {
    const env = getServerEnvironment();
    if (!env.ENABLE_REAL_AI || !env.NVIDIA_API_KEY) {
      throw new AIProviderUnavailableError();
    }

    const response = await withRetry(async (_attempt, signal) => {
      const startedAt = Date.now();
      const result = await fetch(`${env.NVIDIA_BASE_URL.replace(/\/$/, "")}/chat/completions`, {
        method: "POST",
        signal,
        headers: {
          Authorization: `Bearer ${env.NVIDIA_API_KEY}`,
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-HEARTH-Prompt-Version": PROMPT_VERSION,
        },
        body: JSON.stringify({
          model: env.NVIDIA_MODEL,
          messages: [
            { role: "system", content: `${HEARTH_SYSTEM_PROMPT}\n\n${responseContract}` },
            { role: "user", content: userContent },
          ],
          max_tokens: 12_000,
          temperature: 0.2,
          top_p: 0.9,
          seed: 0,
          stream: false,
        }),
      });
      if (!result.ok) {
        throw new Error(`NVIDIA request failed with status ${result.status}`);
      }
      const payload = await result.json() as NvidiaResponse;
      return { payload, latencyMs: Date.now() - startedAt };
    });

    const content = response.payload.choices?.[0]?.message?.content;
    if (!content) throw new Error("NVIDIA returned no structured response.");
    return content;
  }
}

export function getAIProvider(): HearthAIProvider {
  return new NvidiaNimProvider();
}
