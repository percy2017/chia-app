import type { MemoryNote } from '../memory/types';

import { database } from './index';

type Row = {
  name: string;
  description: string;
  path: string;
  content: string;
  synced_at: number;
};

export function readMemory(): MemoryNote[] {
  const { rows } = database().executeSync(
    'SELECT * FROM memory ORDER BY name ASC;',
  );
  return (rows as unknown as Row[]).map(row => ({
    name: row.name,
    description: row.description,
    path: row.path,
    content: row.content,
    syncedAt: row.synced_at,
  }));
}

export function replaceMemory(notes: MemoryNote[]) {
  const db = database();
  db.executeSync('DELETE FROM memory;');
  for (const note of notes) {
    db.executeSync(
      `INSERT INTO memory (name, description, path, content, synced_at)
       VALUES (?, ?, ?, ?, ?);`,
      [
        note.name,
        note.description,
        note.path,
        note.content,
        note.syncedAt,
      ],
    );
  }
}

export function deleteMemory(name: string) {
  database().executeSync('DELETE FROM memory WHERE name = ?;', [name]);
}
