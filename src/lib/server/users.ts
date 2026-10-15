import 'server-only';
import { randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import type { PublicUser } from '@/types/content';
import { supabaseRequest, withSupabase } from './supabase';

const scrypt = promisify(scryptCallback) as (password: string, salt: Buffer, keylen: number) => Promise<Buffer>;
const KEY_LENGTH = 64;

interface StoredUser extends PublicUser {
  passwordHash: string; // `salt:hash`, both hex
}

/**
 * Seeded demo account. Documented in the README so reviewers can sign in with
 * the form; the "Continue with demo account" button signs in server-side
 * without the password ever reaching the browser.
 */
export const DEMO_USER = {
  id: 'user-demo',
  name: 'Demo Reader',
  email: 'demo@signal.app',
  password: 'signal-demo-2026',
} as const;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, KEY_LENGTH);
  return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(':');
  if (!saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, 'hex');
  const actual = await scrypt(password, Buffer.from(saltHex, 'hex'), expected.length);
  return timingSafeEqual(expected, actual);
}

function toPublic(user: StoredUser): PublicUser {
  return { id: user.id, name: user.name, email: user.email };
}

// ─── Storage backends ────────────────────────────────────────────────────────

/** In-memory fallback (no Supabase configured, or its tables not created yet). */
const globalStore = globalThis as typeof globalThis & { __signalUsers?: Map<string, StoredUser> };
function memory(): Map<string, StoredUser> {
  globalStore.__signalUsers ??= new Map();
  return globalStore.__signalUsers;
}

interface UserRow {
  id: string;
  email: string;
  name: string;
  password_hash: string;
}
const fromRow = (row: UserRow): StoredUser => ({ id: row.id, email: row.email, name: row.name, passwordHash: row.password_hash });

async function findByEmail(email: string): Promise<StoredUser | null> {
  return withSupabase(
    async () => {
      const rows = await supabaseRequest<UserRow[]>('app_users', {
        query: { select: 'id,email,name,password_hash', email: `eq.${email}`, limit: '1' },
      });
      return rows[0] ? fromRow(rows[0]) : null;
    },
    () => memory().get(email) ?? null,
  );
}

/** Inserts a user; returns null when the email is already taken. */
async function insertUser(user: StoredUser): Promise<StoredUser | null> {
  return withSupabase(
    async () => {
      const rows = await supabaseRequest<UserRow[]>('app_users', {
        method: 'POST',
        query: { on_conflict: 'email' },
        // ignore-duplicates: a conflicting email yields an empty result instead of an error.
        prefer: 'return=representation,resolution=ignore-duplicates',
        body: { id: user.id, email: user.email, name: user.name, password_hash: user.passwordHash },
      });
      return rows[0] ? fromRow(rows[0]) : null;
    },
    () => {
      if (memory().has(user.email)) return null;
      memory().set(user.email, user);
      return user;
    },
  );
}

// ─── Demo seed ───────────────────────────────────────────────────────────────

let seeding: Promise<void> | undefined;
async function ensureDemoUser(): Promise<void> {
  seeding ??= (async () => {
    if (await findByEmail(DEMO_USER.email)) return;
    await insertUser({ id: DEMO_USER.id, name: DEMO_USER.name, email: DEMO_USER.email, passwordHash: await hashPassword(DEMO_USER.password) });
  })().catch((error) => {
    seeding = undefined; // retry next time
    throw error;
  });
  return seeding;
}

// ─── Public API ──────────────────────────────────────────────────────────────

// Compared against when the email is unknown, so both failure paths do the
// same scrypt work and timing does not reveal which accounts exist.
let dummyHash: Promise<string> | undefined;

export async function authenticate(email: string, password: string): Promise<PublicUser | null> {
  await ensureDemoUser();
  const user = await findByEmail(email);
  if (!user) {
    dummyHash ??= hashPassword('dummy-password-for-timing');
    await verifyPassword(password, await dummyHash);
    return null;
  }
  return (await verifyPassword(password, user.passwordHash)) ? toPublic(user) : null;
}

export async function createUser(name: string, email: string, password: string): Promise<PublicUser | null> {
  await ensureDemoUser();
  const created = await insertUser({ id: `user-${randomUUID()}`, name, email, passwordHash: await hashPassword(password) });
  return created ? toPublic(created) : null;
}

export async function getDemoUser(): Promise<PublicUser> {
  await ensureDemoUser();
  const user = await findByEmail(DEMO_USER.email);
  return user ? toPublic(user) : { id: DEMO_USER.id, name: DEMO_USER.name, email: DEMO_USER.email };
}

/** Test helper: reset the in-memory store (and re-seed on next use). */
export function resetUserStore(): void {
  globalStore.__signalUsers = new Map();
  seeding = undefined;
}
