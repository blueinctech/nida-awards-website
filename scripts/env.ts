// Loads .env.local (if present) for command-line scripts, the way `next dev` does for the app.
// Variables already set in the environment win.
import { existsSync } from 'node:fs';

if (existsSync('.env.local') && typeof process.loadEnvFile === 'function') process.loadEnvFile('.env.local');
