import type { SshProfile } from './types';

import { getToolsConfig } from '../settings/store';
import { writePhoneTextFile } from '../phone/files';
import { isMemoryPath } from '../chia/fs';
import { writeAtomic } from './edit';
import { parseTarget } from './read';
import type { ReadTarget } from './read';

export type WriteArgs = {
  path: string;
  content: string;
  target?: ReadTarget;
};

export type WriteOutcome = {
  output: string;
  exitCode: number;
  durationMs: number;
  isError: boolean;
};

export function parseWriteArgs(raw: string): WriteArgs | null {
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
  if (!path || typeof record.content !== 'string') {
    return null;
  }
  const target = parseTarget(record);
  if (!target) {
    return null;
  }
  return {
    path,
    content: record.content,
    target,
  };
}

/** Etiqueta corta para la UI ("write /ruta"). */
export function writeCommand(args: WriteArgs): string {
  return args.target === 'phone' ? `write ${args.path} (telefono)` : `write ${args.path}`;
}

function human(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${bytes} B`;
}

/** Lineas sin partir en un array gigante (content puede ser grande). */
function countLines(value: string): number {
  if (!value) {
    return 0;
  }
  let total = 1;
  for (let index = 0; index < value.length; index += 1) {
    if (value.charCodeAt(index) === 10) {
      total += 1;
    }
  }
  return value.endsWith('\n') ? total - 1 : total;
}

export async function runWriteTool(
  args: WriteArgs,
  profile: SshProfile,
): Promise<WriteOutcome> {
  const started = Date.now();
  const config = getToolsConfig();
  const bytes = args.content.length;
  const label = args.target === 'phone' ? 'telefono' : 'vps';

  if (args.content.includes('\u0000')) {
    return {
      output: `${args.path}: el contenido tiene bytes NUL (binario). write es solo texto UTF-8; usa shell.`,
      exitCode: 1,
      durationMs: Date.now() - started,
      isError: true,
    };
  }

  if (bytes > config.maxBytes) {
    return {
      output: `${args.path}: el contenido pesa ${human(bytes)} y el tope es ${Math.round(
        config.maxBytes / 1024,
      )} KB. Partilo en varios write o usa shell (base64).`,
      exitCode: 1,
      durationMs: Date.now() - started,
      isError: true,
    };
  }

  if (args.target === 'phone' && isMemoryPath(args.path) && bytes > config.maxChars) {
    return {
      output: `${args.path}: cada nota de memoria admite ${config.maxChars} chars y el contenido tiene ${bytes}. Resumila o usa una nota por hecho.`,
      exitCode: 1,
      durationMs: Date.now() - started,
      isError: true,
    };
  }

  try {
    if (args.target === 'phone') {
      await writePhoneTextFile(args.path, args.content);
    }
    else {
      await writeAtomic(args.path, args.content, config.maxTimeMs);
    }
  }
  catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      output: `No se pudo escribir ${args.path} (${label}): ${message}`,
      exitCode: 1,
      durationMs: Date.now() - started,
      isError: true,
    };
  }

  return {
    output: `ok: ${countLines(args.content)} lineas, ${human(bytes)} escritos en ${args.path} [${label}].`,
    exitCode: 0,
    durationMs: Date.now() - started,
    isError: false,
  };
}
