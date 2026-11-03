
async function runPhoneRead(
  args: ReadArgs,
  mime: string | undefined,
  started: number,
  config: ReturnType<typeof getToolsConfig>,
): Promise<ReadOutcome> {
  if (mime) {
    try {
      const file = await readPhoneFile(args.path, 1, 1, config.maxBytes, 'base64');
      return {
        output: `Read image file [${mime}] (${formatSize(file.bytes)}) [telefono]`,
        exitCode: 0,
        durationMs: Date.now() - started,
        isError: false,
        image: { mimeType: mime, data: file.content },
      };
    }
    catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        output: `No se pudo leer la imagen ${args.path} del telefono: ${message}`,
        exitCode: 1,
        durationMs: Date.now() - started,
        isError: true,
      };
    }
  }

  const start = args.offset && args.offset > 1 ? args.offset : 1;
  const span = args.limit && args.limit > 0 ? Math.floor(args.limit) : DEFAULT_LINES;
  try {
    const file = await readPhoneFile(args.path, start, span, config.maxBytes, 'utf8');
    if (file.binary) {
      return {
        output: `${args.path} parece binario: usa phone files.list/stat o shell para moverlo; read/edit son para texto.`,
        exitCode: 1,
        durationMs: Date.now() - started,
        isError: true,
      };
    }
    const body = file.content;
    if (!body.trim()) {
      return {
        output: start > 1 && (file.lines ?? 0) > 0
          ? `Offset ${start} is beyond end of file (${file.lines} lines total).`
          : '(archivo vacío)',
        exitCode: 0,
        durationMs: Date.now() - started,
        isError: false,
      };
    }
    const shown = countLines(body);
    const endLine = start + shown - 1;
    const total = file.lines ?? endLine;
    if (file.truncated || endLine < total) {
      return {
        output: `${body}

[Showing lines ${start}-${endLine} of ${total} [telefono]. Use offset=${endLine + 1} to continue.]`,
        exitCode: 0,
        durationMs: Date.now() - started,
        isError: false,
      };
    }
    return {
      output: body,
      exitCode: 0,
      durationMs: Date.now() - started,
      isError: false,
    };
  }
  catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      output: `No se pudo leer ${args.path} del telefono: ${message}`,
      exitCode: 1,
      durationMs: Date.now() - started,
      isError: true,
    };
  }
}

import type { ChatImage } from '../llm/types';
import type { SshProfile } from './types';

import { getToolsConfig } from '../settings/store';

/** Lineas que devuelve read cuando el modelo no pasa `limit`. */
const DEFAULT_LINES = 2000;
import { execSsh } from './client';
import { readRemoteFile } from './native';
import { readPhoneFile } from '../phone/files';
import { ensureSsh } from './tool';

const IMAGE_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  bmp: 'image/bmp',
};

const MARK = '@@chia-read@@';

export type ReadTarget = 'vps' | 'phone';

const PHONE_TARGETS = ['phone', 'android', 'telefono', 'movil', 'mobile', 'device'];
const VPS_TARGETS = ['vps', 'ssh', 'server', 'servidor', 'remote', 'remoto'];

export type ReadArgs = {
  path: string;
  offset?: number;
  limit?: number;
  target?: ReadTarget;
};

export type ReadOutcome = {
  output: string;
  exitCode: number;
  durationMs: number;
  isError: boolean;
  image?: ChatImage;
};

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

function extension(path: string): string {
  const base = path.slice(path.lastIndexOf('/') + 1);
  const dot = base.lastIndexOf('.');
  return dot === -1 ? '' : base.slice(dot + 1).toLowerCase();
}

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  }
  if (bytes >= 1024) {
    return `${Math.round(bytes / 1024)}KB`;
  }
  return `${bytes}B`;
}

/** UTF-8 real, para que el tope de bytes sea exacto y no corte caracteres. */
function truncateBytes(text: string, maxBytes: number): { text: string; truncated: boolean } {
  let used = 0;
  for (let index = 0; index < text.length; index += 1) {
    const code = text.codePointAt(index) ?? 0;
    const size = code < 0x80 ? 1 : code < 0x800 ? 2 : code < 0x10000 ? 3 : 4;
    if (used + size > maxBytes) {
      return { text: text.slice(0, index), truncated: true };
    }
    used += size;
    if (size === 4) {
      index += 1;
    }
  }
  return { text, truncated: false };
}

function countLines(text: string): number {
  if (!text) {
    return 0;
  }
  const breaks = text.split('\n').length - 1;
  return text.endsWith('\n') ? breaks : breaks + 1;
}

export function parseTarget(record: Record<string, unknown>): ReadTarget | null {
  const raw = [record.target, record.device, record.host, record.source]
    .find(value => typeof value === 'string');
  if (typeof raw !== 'string') {
    return 'vps';
  }
  const value = raw.trim().toLowerCase();
  if (!value || VPS_TARGETS.includes(value)) {
    return 'vps';
  }
  return PHONE_TARGETS.includes(value) ? 'phone' : null;
}

export function parseReadArgs(raw: string): ReadArgs | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw || '{}');
  }
  catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return null;
  }
  const record = parsed as Record<string, unknown>;
  const path = typeof record.path === 'string' ? record.path.trim() : '';
  if (!path) {
    return null;
  }
  const offset = typeof record.offset === 'number' && record.offset > 0
    ? Math.floor(record.offset)
    : undefined;
  const limit = typeof record.limit === 'number' && record.limit > 0
    ? Math.floor(record.limit)
    : undefined;
  const target = parseTarget(record);
  if (!target) {
    return null;
  }
  return { path, offset, limit, target };
}

/** Etiqueta corta para la UI ("read /ruta"). */
export function readCommand(args: ReadArgs): string {
  return args.target === 'phone' ? `read ${args.path} (telefono)` : `read ${args.path}`;
}


export async function runReadTool(
  args: ReadArgs,
  profile: SshProfile,
): Promise<ReadOutcome> {
  const started = Date.now();
  const config = getToolsConfig();
  const mime = IMAGE_MIME[extension(args.path)];

  if (args.target === 'phone') {
    return runPhoneRead(args, mime, started, config);
  }

  try {
    await ensureSsh(profile);
  }
  catch (error) {
    return {
      output: `No se pudo conectar al shell: ${error instanceof Error ? error.message : String(error)}`,
      exitCode: 255,
      durationMs: Date.now() - started,
      isError: true,
    };
  }

  if (mime) {
    try {
      const file = await readRemoteFile(args.path, config.maxBytes);
      return {
        output: `Read image file [${mime}] (${formatSize(file.size)})`,
        exitCode: 0,
        durationMs: Date.now() - started,
        isError: false,
        image: { mimeType: mime, data: file.data },
      };
    }
    catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        output: `No se pudo leer la imagen ${args.path}: ${message}`,
        exitCode: 1,
        durationMs: Date.now() - started,
        isError: true,
      };
    }
  }

  const start = args.offset && args.offset > 1 ? args.offset : 1;
  const span = args.limit && args.limit > 0 ? Math.floor(args.limit) : DEFAULT_LINES;
  const end = start + span - 1;
  const target = shellQuote(args.path);
  // Un solo viaje: total de lineas + el bloque pedido.
  const command = `wc -l < ${target}; printf '\\n${MARK}\\n'; sed -n '${start},${end}p' ${target}`;

  let output: string;
  let exitCode: number;
  try {
    const result = await execSsh(command, { timeoutMs: config.maxTimeMs });
    output = result.output;
    exitCode = result.exitCode;
  }
  catch (error) {
    return {
      output: `No se pudo leer ${args.path}: ${error instanceof Error ? error.message : String(error)}`,
      exitCode: 1,
      durationMs: Date.now() - started,
      isError: true,
    };
  }

  if (exitCode !== 0) {
    return {
      output: `No se pudo leer ${args.path} (exit ${exitCode}):\n${output.trim()}`,
      exitCode,
      durationMs: Date.now() - started,
      isError: true,
    };
  }

  const marker = `\n${MARK}\n`;
  const at = output.indexOf(marker);
  const totalRaw = (at === -1 ? output : output.slice(0, at)).trim();
  const total = Number.parseInt(totalRaw, 10);
  const totalLines = Number.isFinite(total) ? total : 0;
  let body = at === -1 ? output : output.slice(at + marker.length);
  if (body.endsWith('\n')) {
    body = body.slice(0, -1);
  }

  if (!body.trim()) {
    return {
      output: start > 1 && totalLines > 0
        ? `Offset ${start} is beyond end of file (${totalLines} lines total).`
        : '(archivo vacío)',
      exitCode: 0,
      durationMs: Date.now() - started,
      isError: false,
    };
  }

  const cut = truncateBytes(body, config.maxBytes);
  body = cut.text;

  const shownLines = countLines(body);
  const endLine = start + shownLines - 1;
  const remaining = totalLines > 0 && endLine < totalLines;

  if (!cut.truncated && !remaining) {
    return {
      output: body,
      exitCode: 0,
      durationMs: Date.now() - started,
      isError: false,
    };
  }

  const limitNote = cut.truncated
    ? ` (${formatSize(config.maxBytes)} limit)`
    : '';
  return {
    output: `${body}\n\n[Showing lines ${start}-${endLine} of ${totalLines}${limitNote}. Use offset=${
      endLine + 1
    } to continue.]`,
    exitCode: 0,
    durationMs: Date.now() - started,
    isError: false,
  };
}
