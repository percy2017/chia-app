import { NativeModules } from 'react-native';

import type { RagChunk, RagDocument } from '../db/rag';

import {
  allChunks,
  chunksOf,
  countChunks,
  deleteDocument,
  documentBySha,
  findDocument,
  listDocuments,
  saveDocument,
} from '../db/rag';
import { getVoiceConfig } from '../settings/store';
import { downloadToPhone, removeTempFile } from './download';
import { decodeVector, dot } from './vec';

type RagNativeModule = {
  store: (uri: string, name: string) => Promise<string>;
  remove: (path: string) => Promise<boolean>;
  embed: (baseUrl: string, token: string, path: string) => Promise<string>;
  embedText: (
    baseUrl: string,
    token: string,
    text: string,
    tipo: string,
  ) => Promise<string>;
};

export type IndexResult = { doc: RagDocument; reused: boolean };

/** Tope de texto que acepta `/embed` para una consulta (4000 en el OpenAPI). */
const QUERY_MAX_CHARS = 4000;

export type RagHit = {
  doc: string;
  id: string;
  page: number;
  index: number;
  score: number;
  text: string;
};

export const RAG_EXTENSIONS = [
  'pdf',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'ppt',
  'pptx',
  'odt',
  'ods',
  'odp',
  'rtf',
  'txt',
  'md',
  'csv',
  'html',
  'htm',
  'json',
  'xml',
];

export const RAG_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'tif', 'tiff'];

export function fileExtension(name: string): string {
  return name.split('.').pop()?.toLowerCase() ?? '';
}

export function isRagFile(name: string): boolean {
  return RAG_EXTENSIONS.includes(fileExtension(name));
}

/** Tambien acepta imagenes (el Studio API les hace OCR). */
export function isRagSupported(name: string): boolean {
  return isRagFile(name) || RAG_IMAGE_EXTENSIONS.includes(fileExtension(name));
}

/** Nombre de archivo a partir de una URL (query y hash fuera). */
export function nameFromUrl(url: string): string {
  const clean = url.split('#')[0].split('?')[0];
  const last = clean.split('/').filter(Boolean).pop() ?? 'documento';
  try {
    return decodeURIComponent(last) || 'documento';
  }
  catch {
    return last;
  }
}

function native(): RagNativeModule {
  const module = NativeModules.RagNative as RagNativeModule | undefined;
  if (!module) {
    throw new Error('Modulo RAG no disponible (recompila la app).');
  }
  return module;
}

function studio(): { baseUrl: string; token: string } {
  const { baseUrl, token } = getVoiceConfig();
  if (!baseUrl) {
    throw new Error('Configura el Studio API (URL base) en Configuracion.');
  }
  return { baseUrl, token };
}

type EmbedFileResponse = {
  sha256?: string;
  bytes?: number;
  tipo_documento?: string;
  paginas?: number;
  total_chunks?: number;
  chunks?: Array<{ i?: number; pagina?: number; texto?: string; vec?: string }>;
};

type StoredFile = { path: string; sha256: string; bytes: number };

async function persist(
  stored: StoredFile,
  name: string,
  mime: string,
): Promise<IndexResult> {
  const known = documentBySha(stored.sha256);
  if (known) {
    return { doc: known, reused: true };
  }
  const { baseUrl, token } = studio();
  const parsed = JSON.parse(
    await native().embed(baseUrl, token, stored.path),
  ) as EmbedFileResponse;
  const chunks = (parsed.chunks ?? [])
    .map((chunk, index) => ({
      index: typeof chunk.i === 'number' ? chunk.i : index,
      page: typeof chunk.pagina === 'number' ? chunk.pagina : 0,
      text: typeof chunk.texto === 'string' ? chunk.texto : '',
      vec: typeof chunk.vec === 'string' ? chunk.vec : '',
    }))
    .filter(chunk => chunk.text.trim() && chunk.vec);
  if (!chunks.length) {
    throw new Error('El Studio API no devolvio fragmentos del archivo.');
  }
  const doc: RagDocument = {
    id: `doc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    mime,
    path: stored.path,
    sha256: stored.sha256 || parsed.sha256 || '',
    bytes: stored.bytes || parsed.bytes || 0,
    pages: parsed.paginas ?? 0,
    chunks: chunks.length,
    tipo: parsed.tipo_documento ?? '',
    createdAt: Date.now(),
  };
  await saveDocument(doc, chunks);
  return { doc, reused: false };
}

export async function indexFile(
  uri: string,
  name: string,
  mime = '',
): Promise<IndexResult> {
  const source = uri.trim();
  const remote = /^https?:/i.test(source) && source.indexOf('//') > 6;
  if (!remote) {
    return persist(JSON.parse(await native().store(source, name)) as StoredFile, name, mime);
  }
  try {
    const stored = JSON.parse(await native().store(source, name)) as StoredFile;
    return await persist(stored, name, mime);
  }
  catch (nativeError: unknown) {
    let local = '';
    try {
      local = await downloadToPhone(source, name);
    }
    catch (error: unknown) {
      const first = nativeError instanceof Error ? nativeError.message : String(nativeError);
      const second = error instanceof Error ? error.message : String(error);
      throw new Error(`no se pudo descargar (nativo: ${first} · js: ${second})`);
    }
    try {
      return await persist(
        JSON.parse(await native().store(local, name)) as StoredFile,
        name,
        mime,
      );
    }
    finally {
      await removeTempFile(local);
    }
  }
}

export function documents(limit = 100): RagDocument[] {
  return listDocuments(limit);
}

export function totalChunks(): number {
  return countChunks();
}

export function document(ref: string): RagDocument {
  const found = findDocument(ref);
  if (!found) {
    throw new Error(`No hay ningun documento indexado que coincida con: ${ref}`);
  }
  return found;
}

export function readDocument(
  ref: string,
  from = 0,
  limit = 30,
): { doc: RagDocument; chunks: RagChunk[] } {
  const found = document(ref);
  return { doc: found, chunks: chunksOf(found.id, from, limit) };
}

export async function forgetDocument(ref: string): Promise<RagDocument> {
  const found = document(ref);
  await deleteDocument(found.id);
  try {
    await native().remove(found.path);
  }
  catch {
    // El archivo pudo borrarse a mano: el indice ya no existe.
  }
  return found;
}

export async function search(
  question: string,
  ref = '',
  limit = 6,
): Promise<RagHit[]> {
  const text = question.trim().slice(0, QUERY_MAX_CHARS);
  if (!text) {
    throw new Error('Falta la consulta.');
  }
  const scope = ref.trim() ? document(ref) : null;
  const rows = allChunks(scope ? [scope.id] : undefined);
  if (!rows.length) {
    throw new Error('No hay documentos indexados todavia.');
  }
  const { baseUrl, token } = studio();
  const parsed = JSON.parse(
    await native().embedText(baseUrl, token, text, 'consulta'),
  ) as { vector?: number[] };
  const query = Float32Array.from(parsed.vector ?? []);
  if (!query.length) {
    throw new Error('El Studio API no devolvio el vector de la consulta.');
  }
  const names = new Map(documents(500).map(doc => [doc.id, doc.name]));
  return rows
    .map(row => ({
      doc: names.get(row.docId) ?? row.docId,
      id: row.docId,
      page: row.page,
      index: row.index,
      score: dot(query, decodeVector(row.vec)),
      text: row.text,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(1, Math.min(20, limit)));
}
