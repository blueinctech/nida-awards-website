import 'server-only';
import { db } from './db';
import { sha256 } from './auth';

// Fixed-window limiter stored in Postgres, so it works across serverless instances.
// Returns true when the request is allowed.
export async function rateLimit(bucket: string, who: string, limit: number, windowSeconds: number) {
  const key = bucket + ':' + sha256(who || 'unknown').slice(0, 32);
  const [row] = await db()`
    insert into rate_limits (key, window_start, count) values (${key}, now(), 1)
    on conflict (key) do update set
      count = case when rate_limits.window_start < now() - ${windowSeconds + ' seconds'}::interval then 1 else rate_limits.count + 1 end,
      window_start = case when rate_limits.window_start < now() - ${windowSeconds + ' seconds'}::interval then now() else rate_limits.window_start end
    returning count`;
  if (Math.random() < 0.02) await db()`delete from rate_limits where window_start < now() - interval '1 day'`;
  return row.count <= limit;
}

export const ipHash = (ip: string) => sha256('ip:' + (process.env.IP_HASH_SALT || 'nida') + ':' + ip).slice(0, 40);
