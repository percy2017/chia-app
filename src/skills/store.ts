import type { SkillRecord } from './types';

import { readSkills, replaceSkills, deleteSkill } from '../db/skills';
import { parseSkillFile, formatSkillsForPrompt } from './parse';
import { CHIA_SKILLS_DIR, ensurePhoneDir, findPhoneFiles } from '../chia/fs';
import { readPhoneTextFile } from '../phone/files';
import { getToolsConfig } from '../settings/store';

/** Carpetas que se bajan del telefono buscando SKILL.md. */
const MAX_DEPTH = 4;

const SYNC_TTL_MS = 5 * 60 * 1000;

let skills: SkillRecord[] = [];
let hydrated = false;
let lastSync = 0;
let syncing: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeSkills(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getSkillsSnapshot(): SkillRecord[] {
  if (!hydrated) {
    hydrated = true;
    try {
      skills = readSkills();
    }
    catch {
      skills = [];
    }
  }
  return skills;
}

export function findSkill(name: string): SkillRecord | undefined {
  return getSkillsSnapshot().find(skill => skill.name === name);
}

/** Seccion del system prompt (vacia si no hay skills). */
export function skillsSection(budget?: number): string {
  return formatSkillsForPrompt(getSkillsSnapshot(), budget);
}

/**
 * Lee los `SKILL.md` del telefono y reemplaza la cache. Sin SSH: la fuente de
 * verdad es `/sdcard/ChiaNative/.chia/skills`.
 */
export async function syncSkills(): Promise<void> {
  if (syncing) {
    return syncing;
  }
  syncing = (async () => {
    try {
      await ensurePhoneDir(CHIA_SKILLS_DIR);
      const files = await findPhoneFiles(
        CHIA_SKILLS_DIR,
        MAX_DEPTH,
        name => name === 'SKILL.md',
      );
      const now = Date.now();
      const maxBytes = getToolsConfig().maxBytes;
      const records: SkillRecord[] = [];
      for (const file of files) {
        let raw = '';
        try {
          raw = await readPhoneTextFile(file.path, maxBytes);
        }
        catch {
          continue;
        }
        const parsed = parseSkillFile(raw);
        if (!parsed) {
          continue;
        }
        const baseDir = file.path.slice(0, file.path.lastIndexOf('/'));
        const name = parsed.name || baseDir.slice(baseDir.lastIndexOf('/') + 1);
        if (records.some(item => item.name === name)) {
          continue;
        }
        records.push({
          name,
          description: parsed.description,
          path: file.path,
          baseDir,
          hidden: parsed.hidden,
          content: raw,
          syncedAt: now,
        });
      }
      records.sort((a, b) => a.name.localeCompare(b.name));
      replaceSkills(records);
      skills = records;
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

/** Re-escanea solo si la cache esta vieja (o vacia). */
export async function maybeSyncSkills(): Promise<void> {
  if (Date.now() - lastSync < SYNC_TTL_MS) {
    return;
  }
  await syncSkills();
}

/** Refleja un cambio hecho por el propio agente sin esperar al TTL. */
export function invalidateSkills() {
  lastSync = 0;
}

/** Quita una skill de la cache local tras borrarla del telefono. */
export function forgetSkill(name: string) {
  deleteSkill(name);
  skills = skills.filter(item => item.name !== name);
  hydrated = true;
  emit();
}
