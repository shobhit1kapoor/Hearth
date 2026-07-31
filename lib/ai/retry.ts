export async function withRetry<T>(
  operation: (attempt: number, signal: AbortSignal) => Promise<T>,
  options: { timeoutMs?: number; maxRetries?: number } = {},
): Promise<T> {
  const timeoutMs = options.timeoutMs ?? 45_000;
  const maxRetries = Math.min(options.maxRetries ?? 2, 2);
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await operation(attempt, controller.signal);
    } catch (error) {
      lastError = error;
      if (attempt >= maxRetries || !isRetryable(error)) throw error;
      await new Promise((resolve) => setTimeout(resolve, 350 * (2 ** attempt)));
    } finally {
      clearTimeout(timeout);
    }
  }
  throw lastError;
}

function isRetryable(error: unknown) {
  if (error instanceof DOMException && error.name === "AbortError") return true;
  if (error instanceof Error) return /429|timeout|temporarily unavailable|502|503|504/i.test(error.message);
  return false;
}
