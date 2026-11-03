import type {
  ChatAudio,
  ChatDoc,
  ChatImage,
  ChatMessage,
  ChatToolCall,
  ChatToolResult,
  LlmLimits,
  TokenUsage,
} from '../llm/types';

import { database } from './index';

function safeParseArray<T>(value: unknown): T[] | undefined {
  if (typeof value !== 'string' || !value) {
    return undefined;
  }
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : undefined;
  }
  catch {
    return undefined;
  }
}

function safeParseValue(value: unknown): unknown {
  if (typeof value !== 'string' || !value) {
    return undefined;
  }
  try {
    return JSON.parse(value) as unknown;
  }
  catch {
    return undefined;
  }
}

function text(value: unknown): string | undefined {
  return typeof value === 'string' && value ? value : undefined;
}

function json(value: unknown): string | null {
  if (value === undefined || value === null) {
    return null;
  }
  try {
    return JSON.stringify(value);
  }
  catch {
    return null;
  }
}

function toUsage(value: unknown): TokenUsage | undefined {
  const parsed = safeParseValue(value);
  if (!parsed || typeof parsed !== 'object') {
    return undefined;
  }
  const raw = parsed as Record<string, unknown>;
  const num = (key: string) => (typeof raw[key] === 'number' ? (raw[key] as number) : 0);
  const usage: TokenUsage = {
    input: num('input'),
    output: num('output'),
    cacheRead: num('cacheRead'),
    cacheWrite: num('cacheWrite'),
    total: num('total'),
  };
  return usage.total > 0 ? usage : undefined;
}

function toLimits(value: unknown): LlmLimits | undefined {
  const parsed = safeParseValue(value);
  if (!parsed || typeof parsed !== 'object') {
    return undefined;
  }
  const raw = parsed as Record<string, unknown>;
  const str = (key: string) => (typeof raw[key] === 'string' ? (raw[key] as string) : '');
  const num = (key: string) => (typeof raw[key] === 'number' ? (raw[key] as number) : 0);
  const window = num('contextWindow');
  if (window <= 0) {
    return undefined;
  }
  return {
    proveedor: str('proveedor'),
    modelo: str('modelo'),
    contextWindow: window,
    maxTokens: num('maxTokens'),
    tokensInput: num('tokensInput'),
    tokensOutput: num('tokensOutput'),
    tokensTotal: num('tokensTotal'),
    tokensFree: num('tokensFree'),
    estimado: raw.estimado === true,
  };
}

function toMessage(row: Record<string, unknown>): ChatMessage {
  const reasoning = text(row.reasoning);
  const error = text(row.error);
  return {
    id: String(row.id ?? ''),
    role: row.role === 'user' ? 'user' : 'assistant',
    content: typeof row.content === 'string' ? row.content : '',
    reasoning,
    toolCalls: safeParseArray<ChatToolCall>(row.tool_calls),
    toolResults: safeParseArray<ChatToolResult>(row.tool_results),
    images: safeParseArray<ChatImage>(row.images),
    audio: safeParseValue(row.audio) as ChatAudio | undefined,
    doc: safeParseValue(row.doc) as ChatDoc | undefined,
    status: row.status === 'error' && error ? 'error' : 'done',
    createdAt: typeof row.created_at === 'number' ? row.created_at : undefined,
    error,
    usage: toUsage(row.usage),
    limits: toLimits(row.limits),
    durationMs: typeof row.duration_ms === 'number' ? row.duration_ms : undefined,
    kind: row.kind === 'summary' ? 'summary' : undefined,
  };
}

function isEmptyAssistant(message: ChatMessage): boolean {
  return (
    message.role === 'assistant'
    && !message.content
    && !message.reasoning
    && !message.toolCalls?.length
    && !message.toolResults?.length
  );
}

let writeQueue: Promise<void> = Promise.resolve();

function enqueue(task: () => Promise<void>): Promise<void> {
  writeQueue = writeQueue.then(task, task);
  return writeQueue;
}

export async function loadMessages(): Promise<ChatMessage[]> {
  try {
    await writeQueue;
    const result = await database().execute(
      'SELECT * FROM messages ORDER BY created_at ASC, rowid ASC',
    );
    return result.rows
      .map(row => toMessage(row as Record<string, unknown>))
      .filter(message => message.id && !isEmptyAssistant(message));
  }
  catch (error) {
    recordError('load', error);
    return [];
  }
}

export function saveMessage(message: ChatMessage): Promise<void> {
  if (!message.id) {
    return Promise.resolve();
  }
  const snapshot: ChatMessage = {
    ...message,
    images: message.images?.map(image => ({ ...image })),
    toolCalls: message.toolCalls?.map(call => ({ ...call })),
    toolResults: message.toolResults?.map(result => ({ ...result })),
  };
  return enqueue(async () => {
    try {
      await database().execute(
        `INSERT INTO messages (
        id, role, content, reasoning,
        tool_calls, tool_results, images, status, error, usage, kind, created_at, audio,
        duration_ms, doc, limits
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        role = excluded.role,
        content = excluded.content,
        reasoning = excluded.reasoning,
        tool_calls = excluded.tool_calls,
        tool_results = excluded.tool_results,
        images = excluded.images,
        status = excluded.status,
        error = excluded.error,
        usage = excluded.usage,
        kind = excluded.kind,
        audio = excluded.audio,
        duration_ms = excluded.duration_ms,
        doc = excluded.doc,
        limits = excluded.limits`,
        [
          snapshot.id,
          snapshot.role,
          snapshot.content,
          snapshot.reasoning ?? null,
          snapshot.toolCalls?.length ? json(snapshot.toolCalls) : null,
          snapshot.toolResults?.length ? json(snapshot.toolResults) : null,
          snapshot.images?.length ? json(snapshot.images) : null,
          snapshot.status,
          snapshot.error ?? null,
          json(snapshot.usage),
          snapshot.kind ?? null,
          typeof snapshot.createdAt === 'number' ? snapshot.createdAt : Date.now(),
          snapshot.audio ? json(snapshot.audio) : null,
          typeof snapshot.durationMs === 'number' ? snapshot.durationMs : null,
          snapshot.doc ? json(snapshot.doc) : null,
          snapshot.limits ? json(snapshot.limits) : null,
        ],
      );
    }
    catch (error) {
      recordError('save', error);
    }
  });
}

export function deleteMessage(id: string): Promise<void> {
  return enqueue(async () => {
    try {
      await database().execute('DELETE FROM messages WHERE id = ?', [id]);
    }
    catch (error) {
      recordError('delete', error);
    }
  });
}

export function clearMessages(): Promise<void> {
  return enqueue(async () => {
    try {
      await database().execute('DELETE FROM messages');
    }
    catch (error) {
      recordError('clear', error);
    }
  });
}

let lastError: string | null = null;

export function getLastDbError(): string | null {
  return lastError;
}

function recordError(op: string, error: unknown) {
  lastError = `${op}: ${error instanceof Error ? error.message : String(error)}`;
  console.warn(`[db] ${op} failed`, error);
}

// Copia consistente de la base de datos (incluye WAL) a una carpeta legible
// por adb sin root ni build debuggable.
export function exportDatabase(): string {
  const path = database().getDbPath();
  const match = /\/data\/(?:user\/\d+|[^/]+)\/([^/]+)\//.exec(path);
  const pkg = match?.[1] || 'com.chianative';
  const target = `/storage/emulated/0/Android/data/${pkg}/files/chianative-dump-${Date.now()}.sqlite`;
  database().executeSync(`VACUUM INTO '${target.replace(/'/g, "''")}'`);
  return target;
}
