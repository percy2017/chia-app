import type { MemoryNote } from './types';

import { readMemory, replaceMemory, deleteMemory } from '../db/memory';
import { parseMemoryFile } from '../skills/parse';
import { CHIA_MEMORY_DIR, ensurePhoneDir, listPhoneDir } from '../chia/fs';
import { readPhoneTextFile } from '../phone/files';
import { getToolsConfig } from '../settings/store';

const SYNC_TTL_MS = 5 * 60 * 1000;

let notes: MemoryNote[] = [];
let hydrated = false;
let lastSync = 0;
let syncing: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeMemory(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getMemorySnapshot(): MemoryNote[] {
  if (!hydrated) {
    hydrated = true;
    try {
      notes = readMemory();
    }
    catch {
      notes = [];
    }
  }
  return notes;
}

/** Lee las notas de la raiz de `/sdcard/.../.chia/memory` y refresca la cache. */
export async function syncMemory(): Promise<void> {
  if (syncing) {
    return syncing;
  }
  syncing = (async () => {
    try {
      await ensurePhoneDir(CHIA_MEMORY_DIR);
      const files = await listPhoneDir(CHIA_MEMORY_DIR);
      const now = Date.now();
      const maxBytes = getToolsConfig().maxBytes;
      const maxChars = getToolsConfig().maxChars;
      const next: MemoryNote[] = [];
      for (const file of files) {
        if (file.dir || !file.name.toLowerCase().endsWith('.md')) {
          continue;
        }
        let raw = '';
        try {
          raw = await readPhoneTextFile(file.path, maxBytes);
        }
        catch {
          continue;
        }
        const parsed = parseMemoryFile(raw, file.name);
        if (!parsed.body && !parsed.description) {
          continue;
        }
        if (next.some(note => note.name === parsed.name)) {
          continue;
        }
        next.push({
          name: parsed.name,
          description: parsed.description,
          path: file.path,
          content: raw.length > maxChars ? raw.slice(0, maxChars) : raw,
          syncedAt: now,
        });
      }
      next.sort((a, b) => a.name.localeCompare(b.name));
      replaceMemory(next);
      notes = next;
      hydrated = true;
      lastSync = now;
      emit();
    }
    catch {
      // Sin acceso al almacenamiento: se mantiene la cache anterior.
    }
    finally {
      syncing = null;
    }
  })();
  return syncing;
}

export async function maybeSyncMemory(): Promise<void> {
  if (Date.now() - lastSync < SYNC_TTL_MS) {
    return;
  }
  await syncMemory();
}

export function invalidateMemory() {
  lastSync = 0;
}

/** Quita una nota de la cache local tras borrarla del telefono. */
export function forgetMemory(name: string) {
  deleteMemory(name);
  notes = notes.filter(item => item.name !== name);
  hydrated = true;
  emit();
}
