import { database } from './index';

export const LLM_PREFIX = 'llm.';
export const SSH_PREFIX = 'ssh.';
export const TOOLS_PREFIX = 'tools.';
export const UI_PREFIX = 'ui.';
export const AUTH_PREFIX = 'auth.';
export const VOICE_PREFIX = 'voice.';

type Row = Record<string, unknown>;

function toText(value: unknown): string {
  return value === null || value === undefined ? '' : String(value);
}

export function readGroup(prefix: string): Record<string, string> {
  const result = database().executeSync(
    'SELECT key, value FROM settings WHERE key LIKE ?',
    [`${prefix}%`],
  );
  const out: Record<string, string> = {};
  for (const row of result.rows as Row[]) {
    const key = toText(row.key);
    if (key.startsWith(prefix)) {
      out[key.slice(prefix.length)] = toText(row.value);
    }
  }
  return out;
}

/** Upsert atomico de varias claves (claves completas, con prefijo). */
export function writeSettings(entries: Record<string, string | number | null | undefined>): void {
  const pairs = Object.entries(entries).filter(([, value]) => value !== undefined);
  if (pairs.length === 0) {
    return;
  }
  const db = database();
  const now = Date.now();
  db.executeSync('BEGIN');
  try {
    for (const [key, value] of pairs) {
      db.executeSync(
        `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
        [key, value === null ? '' : String(value), now],
      );
    }
    db.executeSync('COMMIT');
  }
  catch (error) {
    db.executeSync('ROLLBACK');
    throw error;
  }
}

/** Lee una clave suelta ("" si no existe). */
export function readValue(key: string): string {
  const result = database().executeSync(
    'SELECT value FROM settings WHERE key = ?',
    [key],
  );
  const row = (result.rows as Row[])[0];
  return row ? toText(row.value) : '';
}

/** Borra un grupo completo de ajustes (volver a los valores por defecto). */
export function clearGroup(prefix: string): void {
  database().executeSync('DELETE FROM settings WHERE key LIKE ?', [`${prefix}%`]);
}

/** true si todavia no hay nada guardado (primer arranque). */
export function isEmpty(prefix: string): boolean {
  const result = database().executeSync(
    'SELECT COUNT(*) AS total FROM settings WHERE key LIKE ?',
    [`${prefix}%`],
  );
  const row = (result.rows as Row[])[0];
  return !row || Number(row.total ?? 0) === 0;
}
