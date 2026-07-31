import "server-only";

import * as Sentry from "@sentry/nextjs";
import { redactLog } from "@/lib/hearth";

export function recordServerError(error: unknown, context: {
  operation: string;
  route?: string;
  status?: number;
}) {
  const safeMessage = redactLog(error instanceof Error ? error.message : "Unknown server error");
  console.error("HEARTH server error", {
    operation: context.operation,
    route: context.route ?? "unknown",
    status: context.status ?? 500,
    message: safeMessage,
  });
  Sentry.captureException(new Error(safeMessage), {
    tags: {
      operation: context.operation,
      route: context.route ?? "unknown",
      status: String(context.status ?? 500),
    },
  });
}
