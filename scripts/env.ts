// Loads the env file for command-line scripts, the way Next.js does for the app:
// .env.local first, then .env.production, then .env. Values already set win.
import { existsSync } from 'node:fs';

for (const f of ['.env.local', '.env.production', '.env']) {
  if (existsSync(f) && typeof process.loadEnvFile === 'function') process.loadEnvFile(f);
}
