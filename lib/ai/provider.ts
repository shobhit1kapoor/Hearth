import type {
  AnalyzeDocumentResult,
  CompareResult,
  DraftQuestionResult,
  TranslationResult,
} from "./schemas";

export type ImageInput = {
  mimeType: "image/jpeg" | "image/png";
  base64: string;
};

export type AnalyzeDocumentInput = {
  sourceDocumentId: string;
  fileName: string;
  mimeType: string;
  extractedText?: string;
  images?: ImageInput[];
  preferredLanguage?: string;
};

export type CompareInput = {
  instructions: Array<{
    sourceLabel: string;
    sourceDate?: string;
    text: string;
  }>;
};

export type TranslationInput = {
  text: string;
  targetLanguage: string;
  protectedTerms: string[];
};

export type DraftQuestionInput = {
  questionType: "medication_conflict" | "missing_instruction" | "appointment" | "other";
  sourceExcerpts: string[];
  context: string;
};

export interface HearthAIProvider {
  analyzeDocument(input: AnalyzeDocumentInput): Promise<AnalyzeDocumentResult>;
  compareInstructions(input: CompareInput): Promise<CompareResult>;
  translateInstruction(input: TranslationInput): Promise<TranslationResult>;
  draftProfessionalQuestion(input: DraftQuestionInput): Promise<DraftQuestionResult>;
}

export class AIProviderUnavailableError extends Error {
  constructor(message = "The AI service is not configured or is temporarily unavailable.") {
    super(message);
    this.name = "AIProviderUnavailableError";
  }
}
