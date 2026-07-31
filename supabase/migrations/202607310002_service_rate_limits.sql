create table if not exists public.service_rate_limits (
  limit_key text primary key,
  window_started_at timestamptz not null,
  request_count integer not null check (request_count >= 0),
  expires_at timestamptz not null
);

alter table public.service_rate_limits enable row level security;

create or replace function public.check_service_rate_limit(
  p_key text,
  p_limit integer,
  p_window_seconds integer
)
returns table (
  success boolean,
  remaining integer,
  reset_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_time timestamptz := clock_timestamp();
  current_count integer;
  current_reset timestamptz;
begin
  if p_key is null or length(p_key) < 1 or p_limit < 1 or p_window_seconds < 1 then
    raise exception 'Invalid rate-limit request';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_key, 0));

  insert into public.service_rate_limits (
    limit_key,
    window_started_at,
    request_count,
    expires_at
  )
  values (
    p_key,
    current_time,
    1,
    current_time + make_interval(secs => p_window_seconds)
  )
  on conflict (limit_key) do update
  set
    window_started_at = case
      when public.service_rate_limits.expires_at <= current_time then current_time
      else public.service_rate_limits.window_started_at
    end,
    request_count = case
      when public.service_rate_limits.expires_at <= current_time then 1
      else public.service_rate_limits.request_count + 1
    end,
    expires_at = case
      when public.service_rate_limits.expires_at <= current_time
        then current_time + make_interval(secs => p_window_seconds)
      else public.service_rate_limits.expires_at
    end
  returning request_count, expires_at
  into current_count, current_reset;

  return query
  select
    current_count <= p_limit,
    greatest(0, p_limit - current_count),
    current_reset;
end;
$$;

revoke all on function public.check_service_rate_limit(text, integer, integer) from public;
revoke all on function public.check_service_rate_limit(text, integer, integer) from anon;
revoke all on function public.check_service_rate_limit(text, integer, integer) from authenticated;
grant execute on function public.check_service_rate_limit(text, integer, integer) to service_role;
