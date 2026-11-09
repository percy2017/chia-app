import { open, type DB } from '@op-engineering/op-sqlite';

const DB_NAME = 'chianative.sqlite';

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  reasoning TEXT,
  tool_calls TEXT,
  tool_results TEXT,
  images TEXT,
  status TEXT NOT NULL DEFAULT 'done',
  error TEXT,
  usage TEXT,
  kind TEXT,
  created_at INTEGER NOT NULL
);`,
  'CREATE INDEX IF NOT EXISTS messages_created_at ON messages (created_at);',
  `CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL DEFAULT '',
  updated_at INTEGER NOT NULL
);`,
  `CREATE TABLE IF NOT EXISTS memory (
  name TEXT PRIMARY KEY NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  path TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  synced_at INTEGER NOT NULL
);`,
  `CREATE TABLE IF NOT EXISTS skills (
  name TEXT PRIMARY KEY NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  path TEXT NOT NULL,
  base_dir TEXT NOT NULL,
  hidden INTEGER NOT NULL DEFAULT 0,
  content TEXT NOT NULL DEFAULT '',
  synced_at INTEGER NOT NULL
);`,
  `CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  mime TEXT NOT NULL DEFAULT '',
  path TEXT NOT NULL,
  sha256 TEXT NOT NULL,
  bytes INTEGER NOT NULL DEFAULT 0,
  pages INTEGER NOT NULL DEFAULT 0,
  chunks INTEGER NOT NULL DEFAULT 0,
  tipo TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL
);`,
  'CREATE UNIQUE INDEX IF NOT EXISTS documents_sha256 ON documents (sha256);',
  `CREATE TABLE IF NOT EXISTS chunks (
  doc_id TEXT NOT NULL,
  i INTEGER NOT NULL,
  page INTEGER NOT NULL DEFAULT 0,
  texto TEXT NOT NULL,
  vec TEXT NOT NULL,
  PRIMARY KEY (doc_id, i)
);`,
  'CREATE INDEX IF NOT EXISTS chunks_doc ON chunks (doc_id, i);',
];

// Columnas agregadas despues de la primera version: se añaden a bases ya creadas.
const COLUMNS: Array<{ table: string; column: string; type: string }> = [
  { table: 'messages', column: 'usage', type: 'TEXT' },
  { table: 'messages', column: 'kind', type: 'TEXT' },
  { table: 'messages', column: 'audio', type: 'TEXT' },
  { table: 'messages', column: 'doc', type: 'TEXT' },
  { table: 'messages', column: 'duration_ms', type: 'INTEGER' },
  { table: 'messages', column: 'limits', type: 'TEXT' },
  { table: 'messages', column: 'view_only', type: 'INTEGER' },
];

function migrate(handle: DB) {
  for (const { table, column, type } of COLUMNS) {
    try {
      handle.executeSync(`ALTER TABLE ${table} ADD COLUMN ${column} ${type};`);
    }
    catch {
      // La columna ya existe.
    }
  }
}

let db: DB | null = null;

export function database(): DB {
  if (!db) {
    db = open({ name: DB_NAME });
    db.executeSync('PRAGMA journal_mode = WAL;');
    for (const statement of SCHEMA) {
      db.executeSync(statement);
    }
    migrate(db);
  }
  return db;
}
