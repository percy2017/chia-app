import {
  CHIA_MEMORY_DIR,
  CHIA_ROOT,
  CHIA_SKILLS_DIR,
  deletePhonePath,
  ensurePhoneDir,
  findPhoneFiles,
  phoneExists,
} from './fs';
import { ensureDefaultSkills } from '../skills/defaults';
import { syncSkills } from '../skills/store';
import { syncMemory } from '../memory/store';
import { readPhoneTextFile, writePhoneTextFile } from '../phone/files';
import { getToolsConfig } from '../settings/store';

const LEGACY_ROOTS = [
  '/sdcard/Documents/.chia',
  '/sdcard/ChiaNative/.chia',
  '/sdcard/.chia',
  '/sdcard/Download/.chia',
];

let prepared: Promise<void> | null = null;

const SKILLS_RENOMBRADAS: [string, string][] = [
  ['gowa', 'whatsapp-gowa'],
  ['rea', 'rea-ingeniera-inversa'],
];

/** Copia a mano al dia: mueve `.chia` de rutas viejas a la carpeta de la app. */
async function migrateLegacy(): Promise<void> {
  const maxBytes = getToolsConfig().maxBytes;
  for (const legacy of LEGACY_ROOTS) {
    const files = await findPhoneFiles(legacy, 4, () => true);
    for (const file of files) {
      const relative = file.path.slice(legacy.length).split('/').filter(Boolean).join('/');
      if (!relative) {
        continue;
      }
      const target = `${CHIA_ROOT}/${relative}`;
      if (await phoneExists(target)) {
        continue;
      }
      try {
        await writePhoneTextFile(target, await readPhoneTextFile(file.path, maxBytes));
      }
      catch {
        // binario o sin acceso: se ignora
      }
    }
  }
}


export async function prepareChia(): Promise<void> {
  if (prepared) {
    return prepared;
  }
  prepared = (async () => {
    try {
      await ensurePhoneDir(`${CHIA_ROOT}/skills`);
      await ensurePhoneDir(`${CHIA_ROOT}/memory`);
      await migrateLegacy();
      await ensureDefaultSkills();
      const viejaGuia = `${CHIA_MEMORY_DIR}/memory-creator.md`;
      try {
        if (await phoneExists(viejaGuia)) {
          await deletePhonePath(viejaGuia);
        }
      }
      catch {
        // sin acceso: se queda como estaba y no bloquea el turno
      }
      for (const [viejo, nuevo] of SKILLS_RENOMBRADAS) {
        try {
          if (
            (await phoneExists(`${CHIA_SKILLS_DIR}/${viejo}`))
            && (await phoneExists(`${CHIA_SKILLS_DIR}/${nuevo}/SKILL.md`))
          ) {
            await deletePhonePath(`${CHIA_SKILLS_DIR}/${viejo}`);
          }
        }
        catch {
        }
      }
      await syncSkills();
      await syncMemory();
    }
    catch {
      prepared = null;
    }
  })();
  return prepared;
}
