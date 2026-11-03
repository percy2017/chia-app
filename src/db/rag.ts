import { database } from './index';

export type RagDocument = {
  id: string;
  name: string;
  mime: string;
  path: string;
  sha256: string;
  bytes: number;
  pages: number;
  chunks: number;
  tipo: string;
  createdAt: number;
};

export type RagChunk = {
  docId: string;
  index: number;
  page: number;
  text: string;
  vec: string;
};

export type RagChunkInput = {
  index: number;
  page: number;
  text: string;
  vec: string;
};

function str(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function num(value: unknown): number {
  return typeof value === 'number' ? value : 0;
}

function toDocument(row: Record<string, unknown>): RagDocument {
  return {
    id: str(row.id),
    name: str(row.name),
    mime: str(row.mime),
    path: str(row.path),
    sha256: str(row.sha256),
    bytes: num(row.bytes),
    pages: num(row.pages),
    chunks: num(row.chunks),
    tipo: str(row.tipo),
    createdAt: num(row.created_at),
  };
}

function toChunk(row: Record<string, unknown>): RagChunk {
  return {
    docId: str(row.doc_id),
    index: num(row.i),
    page: num(row.page),
    text: str(row.texto),
    vec: str(row.vec),
  };
}

export async function saveDocument(
  doc: RagDocument,
  chunks: RagChunkInput[],
): Promise<void> {
  await database().transaction(async tx => {
    await tx.execute('DELETE FROM chunks WHERE doc_id = ?', [doc.id]);
    await tx.execute('DELETE FROM documents WHERE id = ?', [doc.id]);
    await tx.execute(
      `INSERT INTO documents (
        id, name, mime, path, sha256, bytes, pages, chunks, tipo, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        doc.id,
        doc.name,
        doc.mime,
        doc.path,
        doc.sha256,
        doc.bytes,
        doc.pages,
        doc.chunks,
        doc.tipo,
        doc.createdAt,
      ],
    );
    for (const chunk of chunks) {
      await tx.execute(
        'INSERT INTO chunks (doc_id, i, page, texto, vec) VALUES (?, ?, ?, ?, ?)',
        [doc.id, chunk.index, chunk.page, chunk.text, chunk.vec],
      );
    }
  });
}

export function listDocuments(limit = 200): RagDocument[] {
  const { rows } = database().executeSync(
    'SELECT * FROM documents ORDER BY created_at DESC LIMIT ?',
    [Math.max(1, Math.min(500, limit))],
  );
  return rows.map(row => toDocument(row as Record<string, unknown>));
}

export function documentById(id: string): RagDocument | null {
  const { rows } = database().executeSync('SELECT * FROM documents WHERE id = ?', [id]);
  return rows.length ? toDocument(rows[0] as Record<string, unknown>) : null;
}

export function documentBySha(sha: string): RagDocument | null {
  if (!sha) {
    return null;
  }
  const { rows } = database().executeSync('SELECT * FROM documents WHERE sha256 = ?', [sha]);
  return rows.length ? toDocument(rows[0] as Record<string, unknown>) : null;
}

export function findDocument(ref: string): RagDocument | null {
  const value = ref.trim();
  if (!value) {
    return null;
  }
  const byId = documentById(value);
  if (byId) {
    return byId;
  }
  const docs = listDocuments(500);
  const lower = value.toLowerCase();
  return docs.find(doc => doc.name.toLowerCase() === lower)
    ?? docs.find(doc => doc.name.toLowerCase().includes(lower))
    ?? null;
}

export function chunksOf(docId: string, from = 0, limit = 40): RagChunk[] {
  const { rows } = database().executeSync(
    'SELECT * FROM chunks WHERE doc_id = ? AND i >= ? ORDER BY i LIMIT ?',
    [docId, Math.max(0, from), Math.max(1, Math.min(500, limit))],
  );
  return rows.map(row => toChunk(row as Record<string, unknown>));
}

export function allChunks(docIds?: string[]): RagChunk[] {
  if (docIds && docIds.length === 0) {
    return [];
  }
  if (docIds) {
    const list: RagChunk[] = [];
    for (const id of docIds) {
      list.push(...chunksOf(id, 0, 5000));
    }
    return list;
  }
  const { rows } = database().executeSync('SELECT * FROM chunks ORDER BY doc_id, i');
  return rows.map(row => toChunk(row as Record<string, unknown>));
}

export function countChunks(): number {
  const { rows } = database().executeSync('SELECT COUNT(*) AS total FROM chunks');
  return rows.length ? num((rows[0] as Record<string, unknown>).total) : 0;
}

export async function deleteDocument(id: string): Promise<void> {
  await database().transaction(async tx => {
    await tx.execute('DELETE FROM chunks WHERE doc_id = ?', [id]);
    await tx.execute('DELETE FROM documents WHERE id = ?', [id]);
  });
}
