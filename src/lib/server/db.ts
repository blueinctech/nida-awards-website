import 'server-only';
import postgres from 'postgres';

// One shared connection pool per server instance. DATABASE_URL comes from the hosting
// environment (on Vercel, the Neon integration sets it). It is never sent to the browser.
const globalForDb = globalThis as unknown as { nidaSql?: postgres.Sql };

export const hasDatabase = () => Boolean(process.env.DATABASE_URL);

export function db(): postgres.Sql {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set. See README → Admin CMS setup.');
  if (!globalForDb.nidaSql) {
    globalForDb.nidaSql = postgres(process.env.DATABASE_URL, {
      max: Number(process.env.DATABASE_POOL_MAX || 5),
      idle_timeout: 20,
      // Poolers in transaction mode (Neon "-pooler" hosts, PgBouncer) cannot keep prepared statements
      prepare: !/-pooler\.|pgbouncer=true/.test(process.env.DATABASE_URL),
      onnotice: () => {},
    });
  }
  return globalForDb.nidaSql;
}
