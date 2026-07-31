import "server-only";

import { Resend } from "resend";
import { getServerEnvironment } from "@/lib/config/env";

export async function sendHearthEmail(input: {
  to: string;
  subject: string;
  text: string;
  idempotencyKey: string;
}) {
  const env = getServerEnvironment();
  if (!env.ENABLE_EXTERNAL_EMAIL || !env.RESEND_API_KEY) {
    return { sent: false as const, reason: "email_not_configured" };
  }
  const resend = new Resend(env.RESEND_API_KEY);
  const { data, error } = await resend.emails.send({
    from: env.EMAIL_FROM,
    to: input.to,
    subject: input.subject,
    text: input.text,
    headers: { "X-HEARTH-Message-Type": "care-coordination" },
  }, { idempotencyKey: input.idempotencyKey });
  if (error) return { sent: false as const, reason: "email_delivery_failed" };
  return { sent: true as const, id: data?.id };
}
