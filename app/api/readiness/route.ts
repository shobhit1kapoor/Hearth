import { getServiceReadiness } from "@/lib/config/env";

export const runtime = "nodejs";

export async function GET() {
  return Response.json({
    services: getServiceReadiness(),
    message: "Service readiness reports configuration only. It does not expose secret values.",
  }, {
    headers: { "Cache-Control": "no-store" },
  });
}
