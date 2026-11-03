import type { RagDocument } from '../db/rag';

import {
  documents,
  forgetDocument,
  indexFile,
  isRagSupported,
  nameFromUrl,
  readDocument,
  search,
  totalChunks,
} from './index';

export type RagOutcome = {
  command: string;
  output: string;
  exitCode: number;
  durationMs: number;
  isError: boolean;
};

type RagArgs = {
  action: 'search' | 'list' | 'read' | 'forget' | 'index';
  query: string;
  doc: string;
  from: number;
  limit: number;
  path: string;
  url: string;
  name: string;
};

const ACTIONS = ['search', 'list', 'read', 'forget', 'index'];

function field(args: Record<string, unknown>, key: string): string {
  const value = args[key];
  return typeof value === 'string' ? value.trim() : '';
}

function count(args: Record<string, unknown>, key: string, fallback: number): number {
  const value = args[key];
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.max(0, Math.min(500, Math.trunc(value)));
}

export function parseRagArgs(raw: string): RagArgs | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw || '{}');
  }
  catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object') {
    return null;
  }
  const record = parsed as Record<string, unknown>;
  const action = field(record, 'action').toLowerCase();
  if (!ACTIONS.includes(action)) {
    return null;
  }
  const args = {
    action,
    query: field(record, 'query') || field(record, 'texto') || field(record, 'consulta'),
    doc: field(record, 'doc') || field(record, 'document') || field(record, 'documento'),
    from: count(record, 'from', 0),
    limit: count(record, 'limit', action === 'read' ? 30 : 6),
    path: field(record, 'path') || field(record, 'ruta') || field(record, 'file'),
    url: field(record, 'url'),
    name: field(record, 'name') || field(record, 'nombre'),
  };
  if (action === 'search' && !args.query && !args.doc) {
    return null;
  }
  if ((action === 'read' || action === 'forget') && !args.doc) {
    return null;
  }
  if (action === 'index' && !args.path && !args.url) {
    return null;
  }
  return args as RagArgs;
}

export function ragCommand(args: RagArgs): string {
  if (args.action === 'index') {
    return `rag index ${args.url || args.path}`;
  }
  return args.doc ? `rag ${args.action} ${args.doc}` : `rag ${args.action}`;
}

function summary(doc: RagDocument): string {
  const pages = doc.pages > 0 ? `, ${doc.pages} pag` : '';
  const when = new Date(doc.createdAt).toISOString().slice(0, 10);
  return `${doc.name} · ${doc.chunks} fragmentos${pages} · ${when} · id ${doc.id}`;
}

function fragments(
  doc: RagDocument,
  chunks: Array<{ index: number; page: number; text: string }>,
): string {
  return chunks
    .map(chunk => `[${doc.name} · fragmento ${chunk.index} · pag ${chunk.page}]\n${chunk.text}`)
    .join('\n\n');
}

export async function runRagTool(raw: string): Promise<RagOutcome> {
  const started = Date.now();
  const args = parseRagArgs(raw);
  if (!args) {
    return {
      command: 'rag',
      output: 'Argumentos invalidos: action search|list|read|forget; search necesita query o doc; read/forget necesitan doc.',
      exitCode: 2,
      durationMs: 0,
      isError: true,
    };
  }
  try {
    if (args.action === 'index') {
      const source = args.url || args.path;
      const name = args.name || nameFromUrl(source);
      if (!isRagSupported(name)) {
        return {
          command: ragCommand(args),
          output: `Formato no soportado: ${name}. Vale pdf, doc/docx, xls/xlsx, ppt/pptx, odt/ods/odp, rtf, txt/md/csv/html, json/xml e imagenes jpg/png/tiff.`,
          exitCode: 2,
          durationMs: Date.now() - started,
          isError: true,
        };
      }
      const indexed = await indexFile(source, name);
      return {
        command: ragCommand(args),
        output: indexed.reused
          ? `ya estaba indexado: ${indexed.doc.name} (${indexed.doc.chunks} fragmentos). Usa rag search para consultarlo.`
          : `indexado: ${indexed.doc.name} · ${indexed.doc.chunks} fragmentos${indexed.doc.pages > 0 ? `, ${indexed.doc.pages} paginas` : ''}. Usa rag search para consultarlo.`,
        exitCode: 0,
        durationMs: Date.now() - started,
        isError: false,
      };
    }

    if (args.action === 'list') {
      const docs = documents(100);
      const output = docs.length
        ? docs.map(doc => `- ${summary(doc)}`).join('\n')
        : 'No hay documentos indexados todavia.';
      return {
        command: 'rag list',
        output: `${output}\nfragmentos totales: ${totalChunks()}`,
        exitCode: 0,
        durationMs: Date.now() - started,
        isError: false,
      };
    }

    if (args.action === 'search' && !args.query) {
      const { doc, chunks } = readDocument(args.doc, 0, args.limit);
      return {
        command: ragCommand(args),
        output: `${summary(doc)}\n\n${fragments(doc, chunks) || '(vacio)'}`,
        exitCode: 0,
        durationMs: Date.now() - started,
        isError: false,
      };
    }

    if (args.action === 'search') {
      const hits = await search(args.query, args.doc, args.limit);
      const output = hits
        .map(hit => `[${hit.doc} · pag ${hit.page} · ${hit.score.toFixed(2)}]\n${hit.text}`)
        .join('\n\n');
      return {
        command: ragCommand(args),
        output: hits.length ? output : 'Sin coincidencias.',
        exitCode: 0,
        durationMs: Date.now() - started,
        isError: false,
      };
    }

    if (args.action === 'read') {
      const { doc, chunks } = readDocument(args.doc, args.from, args.limit);
      const next = args.from + chunks.length;
      const tail = next < doc.chunks
        ? `\n\nquedan fragmentos: repite con from=${next}`
        : '\n\nfin del documento';
      return {
        command: ragCommand(args),
        output: `${summary(doc)}\n\n${fragments(doc, chunks) || '(vacio)'}${tail}`,
        exitCode: 0,
        durationMs: Date.now() - started,
        isError: false,
      };
    }

    const removed = await forgetDocument(args.doc);
    return {
      command: ragCommand(args),
      output: `borrado del indice: ${removed.name} (${removed.chunks} fragmentos)`,
      exitCode: 0,
      durationMs: Date.now() - started,
      isError: false,
    };
  }
  catch (error: unknown) {
    return {
      command: ragCommand(args),
      output: error instanceof Error ? error.message : String(error),
      exitCode: 1,
      durationMs: Date.now() - started,
      isError: true,
    };
  }
}
