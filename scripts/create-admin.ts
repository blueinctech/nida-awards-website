// Creates (or restores) a Super Admin from the command line, as an alternative to /admin/setup.
// Use it when you are locked out, too.
//   DATABASE_URL=… npm run admin:create -- --email you@example.org --name "Your Name"
// The password is asked for interactively, so it never ends up in shell history.
import './env';
import postgres from 'postgres';
import { randomBytes, scrypt as scryptCb } from 'node:crypto';
import { promisify } from 'node:util';
import { createInterface } from 'node:readline';

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number, opts: object) => Promise<Buffer>;

function arg(name: string) {
  const i = process.argv.indexOf('--' + name);
  return i > -1 ? process.argv[i + 1] : undefined;
}

function ask(question: string, hidden = false): Promise<string> {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) {
      // Do not echo the password
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (rl as any)._writeToOutput = (s: string) => {
        if (s.includes(question)) process.stdout.write(s);
      };
    }
    rl.question(question, (a) => {
      rl.close();
      if (hidden) process.stdout.write('\n');
      resolve(a);
    });
  });
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('Set DATABASE_URL first.');
  const email = (arg('email') || (await ask('Email: '))).trim().toLowerCase();
  const name = (arg('name') || (await ask('Full name: '))).trim();
  const password = process.env.ADMIN_PASSWORD || (await ask('Password (12+ characters): ', true));
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('That email address is not valid.');
  if (!name) throw new Error('A name is required.');
  if (password.length < 12) throw new Error('Use a password of at least 12 characters.');
  const salt = randomBytes(16);
  const key = await scrypt(password.normalize('NFKC'), salt, 64, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  const hash = `scrypt$16384$8$1$${salt.toString('base64')}$${key.toString('base64')}`;
  const sql = postgres(process.env.DATABASE_URL, { max: 1, prepare: false, onnotice: () => {} });
  try {
    await sql`insert into admin_users (email, name, password_hash, role, status) values (${email}, ${name}, ${hash}, 'super_admin', 'active')
              on conflict (email) do update set password_hash = excluded.password_hash, role = 'super_admin', status = 'active', failed_logins = 0, locked_until = null, updated_at = now()`;
    await sql`insert into activity_log (user_name, action, summary) values ('System', 'user.create', ${'Super Admin created from the command line: ' + email})`;
    console.log(`Super Admin ready: ${email}. Sign in at /admin/login.`);
  } finally {
    await sql.end();
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
