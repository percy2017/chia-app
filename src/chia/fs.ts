import { phoneNative } from '../phone/native';

export const CHIA_ROOT = '/sdcard/Android/data/com.chianative/files/.chia';
export const CHIA_SKILLS_DIR = `${CHIA_ROOT}/skills`;
export const CHIA_MEMORY_DIR = `${CHIA_ROOT}/memory`;

export type PhoneEntry = {
  name: string;
  path: string;
  dir: boolean;
  size: number;
};

function record(raw: string): Record<string, unknown> {
  try {
    const value = JSON.parse(raw) as unknown;
    return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  }
  catch {
    return {};
  }
}

function entry(value: unknown): PhoneEntry | null {
  if (!value || typeof value !== 'object') {
    return null;
  }
  const item = value as Record<string, unknown>;
  const path = typeof item.path === 'string' ? item.path : '';
  if (!path) {
    return null;
  }
  return {
    name: typeof item.name === 'string' ? item.name : path.slice(path.lastIndexOf('/') + 1),
    path,
    dir: item.dir === true,
    size: typeof item.size === 'number' ? item.size : 0,
  };
}

export async function listPhoneDir(path: string): Promise<PhoneEntry[]> {
  try {
    const raw = record(await phoneNative().filesList(path, 500, true));
    const entries = Array.isArray(raw.entries) ? raw.entries : [];
    return entries
      .map(entry)
      .filter((item): item is PhoneEntry => item !== null);
  }
  catch {
    return [];
  }
}

export async function phoneExists(path: string): Promise<boolean> {
  try {
    const info = record(await phoneNative().filesStat(path));
    return typeof info.path === 'string' && info.path.length > 0;
  }
  catch {
    return false;
  }
}

export async function ensurePhoneDir(path: string): Promise<void> {
  try {
    await phoneNative().filesMkdir(path);
  }
  catch {
    // Ya existe o falta el acceso: el write posterior dara el error real.
  }
}

export async function deletePhonePath(path: string): Promise<void> {
  await phoneNative().filesDelete(path, true);
}

export function isMemoryPath(path: string): boolean {
  const at = path.indexOf('/.chia');
  if (at === -1) {
    return false;
  }
  const rest = path.slice(at + '/.chia'.length);
  return rest === '/memory' || rest.startsWith('/memory/');
}

export async function findPhoneFiles(
  root: string,
  maxDepth: number,
  match: (name: string) => boolean,
): Promise<PhoneEntry[]> {
  const found: PhoneEntry[] = [];
  const walk = async (dir: string, depth: number): Promise<void> => {
    const entries = await listPhoneDir(dir);
    for (const item of entries) {
      if (item.dir) {
        if (depth < maxDepth) {
          await walk(item.path, depth + 1);
        }
        continue;
      }
      if (match(item.name)) {
        found.push(item);
      }
    }
  };
  await walk(root, 1);
  return found.sort((a, b) => a.path.localeCompare(b.path));
}
