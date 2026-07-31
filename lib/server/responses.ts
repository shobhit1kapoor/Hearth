import {
  AuthenticationRequiredError,
  AuthorizationDeniedError,
  ServiceConfigurationError,
} from "./auth";
import { recordServerError } from "./observability";
import { ZodError } from "zod";

export function apiError(error: unknown, operation: string) {
  if (error instanceof AuthenticationRequiredError) {
    return Response.json({ error: error.message, code: "AUTH_REQUIRED" }, { status: 401 });
  }
  if (error instanceof AuthorizationDeniedError) {
    return Response.json({ error: error.message, code: "ACCESS_DENIED" }, { status: 403 });
  }
  if (error instanceof ServiceConfigurationError) {
    return Response.json({ error: error.message, code: "SERVICE_NOT_CONFIGURED" }, { status: 503 });
  }
  if (error instanceof ZodError) {
    return Response.json({
      error: "Check the highlighted information and try again.",
      code: "INVALID_REQUEST",
    }, { status: 400 });
  }
  recordServerError(error, { operation });
  return Response.json({
    error: "HEARTH could not complete that request. Nothing unsafe was activated.",
    code: "REQUEST_FAILED",
  }, { status: 500 });
}
