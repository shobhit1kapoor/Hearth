import "server-only";

import { AuthorizationDeniedError } from "./auth";

export function requireSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  const requestOrigin = new URL(request.url).origin;
  if (origin && origin !== requestOrigin) throw new AuthorizationDeniedError();
  if (fetchSite && !["same-origin", "same-site", "none"].includes(fetchSite)) {
    throw new AuthorizationDeniedError();
  }
}
