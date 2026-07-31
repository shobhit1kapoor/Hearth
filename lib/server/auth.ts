import "server-only";

import type { User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export class AuthenticationRequiredError extends Error {
  constructor() {
    super("Please sign in to continue.");
    this.name = "AuthenticationRequiredError";
  }
}

export class AuthorizationDeniedError extends Error {
  constructor() {
    super("You do not have access to this care space.");
    this.name = "AuthorizationDeniedError";
  }
}

export class ServiceConfigurationError extends Error {
  constructor() {
    super("Real caregiver mode is not configured yet. Try the sample case.");
    this.name = "ServiceConfigurationError";
  }
}

export async function requireUser(): Promise<{ user: User; supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>> }> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new ServiceConfigurationError();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new AuthenticationRequiredError();
  return { user: data.user, supabase };
}

export async function requireCareSpaceMember(careSpaceId: string) {
  const context = await requireUser();
  const { data, error } = await context.supabase
    .from("care_space_members")
    .select("id, role, status, expires_at")
    .eq("care_space_id", careSpaceId)
    .eq("user_id", context.user.id)
    .eq("status", "active")
    .maybeSingle();
  const expired = data?.expires_at && new Date(data.expires_at).getTime() <= Date.now();
  if (error || !data || expired) throw new AuthorizationDeniedError();
  return { ...context, membership: data };
}
