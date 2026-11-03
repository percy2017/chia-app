import { phoneNative } from './native';
import { CHIA_ROOT } from '../chia/fs';

export type PhoneFileRead = {
  path: string;
  bytes: number;
  lines?: number;
  offset?: number;
  binary: boolean;
  truncated: boolean;
  encoding: 'utf8' | 'base64';
  content: string;
  nota?: string;
};

function parse(raw: string): Record<string, unknown> {
  try {
    const value = JSON.parse(raw) as unknown;
    return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  }
  catch {
    return {};
  }
}

function num(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

/** Exige el acceso a almacenamiento; si falta, el mensaje ya lo explica. */
const CHIA_MARKER = '/.chia';

/** Cualquier ruta que apunte a `.chia` cae en la carpeta real del harness. */
function chiaPath(value: string): string {
  const at = value.indexOf(CHIA_MARKER);
  if (at === -1) {
    return value;
  }
  const rest = value.slice(at + CHIA_MARKER.length).split('/').filter(Boolean).join('/');
  return rest ? `${CHIA_ROOT}/${rest}` : CHIA_ROOT;
}

/** Relativa (o ~) => /sdcard: en el VPS la resuelve el shell, aca la app. */
export function phonePath(path: string): string {
  return chiaPath(phonePathRaw(path));
}

function phonePathRaw(path: string): string {
  const value = path.trim();
  if (!value || value === '~' || value === 'home') {
    return '/sdcard';
  }
  if (value.startsWith('~/')) {
    return `/sdcard/${value.slice(2)}`;
  }
  if (value.startsWith('home/')) {
    return `/sdcard/${value.slice(5)}`;
  }
  return value.startsWith('/') ? value : `/sdcard/${value}`;
}

function assertEnabled(raw: Record<string, unknown>): void {
  if (raw.enabled === false) {
    throw new Error(text(raw.hint) || 'falta el acceso a todos los archivos en el telefono');
  }
}

export async function readPhoneFile(
  path: string,
  offset: number,
  limit: number,
  maxBytes: number,
  encoding: 'utf8' | 'base64',
): Promise<PhoneFileRead> {
  const raw = parse(await phoneNative().filesRead(phonePath(path), offset, limit, maxBytes, encoding));
  assertEnabled(raw);
  return {
    path: text(raw.path) || path,
    bytes: num(raw.bytes),
    lines: typeof raw.lines === 'number' ? num(raw.lines) : undefined,
    offset: typeof raw.offset === 'number' ? num(raw.offset) : undefined,
    binary: raw.binary === true,
    truncated: raw.truncated === true,
    encoding: encoding,
    content: text(raw.content),
    nota: text(raw.nota),
  };
}

/** Texto completo del archivo (para `edit`): falla si quedo truncado. */
export async function readPhoneTextFile(path: string, maxBytes: number): Promise<string> {
  const file = await readPhoneFile(path, 1, Number.MAX_SAFE_INTEGER, maxBytes, 'utf8');
  if (file.binary) {
    throw new Error(`${path} parece binario: solo se editan archivos de texto UTF-8.`);
  }
  if (file.truncated) {
    throw new Error(
      `${path} no entra completo (limite ${Math.round(maxBytes / 1024)} KB): usa read con offset para verlo por partes.`,
    );
  }
  return file.content;
}

/** Escribe texto de forma atomica: temporal + move sobre el original. */
export async function writePhoneTextFile(path: string, content: string): Promise<void> {
  const native = phoneNative();
  const target = phonePath(path);
  const temp = `${target}.chia-tmp`;
  const written = parse(await native.filesWrite(temp, content, 'utf8', false));
  assertEnabled(written);
  const moved = parse(await native.filesMove(temp, target, true, false));
  assertEnabled(moved);
}
