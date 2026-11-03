import { readValue, writeSettings } from '../db/settings';
import { getLlmConfig, getVoiceConfig } from '../settings/store';
import { updateNative, updateSupported } from './native';

export type UpdateInfo = {
  versionCode: number;
  versionName: string;
  url: string;
  sha256: string;
  bytes: number;
  changelog: string;
  obligatoria: boolean;
};

/** Version que el usuario mando a "despues" en este build. */
const SKIP_KEY = 'ui.updateSkip';
/** Ultima comprobacion (ms) para no pegarle al servidor en cada arranque. */
const CHECKED_KEY = 'ui.updateCheckedAt';
/** Cada cuanto se vuelve a preguntar solo. */
const INTERVAL_MS = 6 * 60 * 60 * 1000;

/** Servidor del Studio API (sin barra final). */
export function apiBase(): string {
  const base = getLlmConfig()?.baseUrl || getVoiceConfig().baseUrl || '';
  return base.replace(/\/+$/, '');
}

export function ignoredVersion(): number {
  const value = Number(readValue(SKIP_KEY));
  return Number.isFinite(value) ? value : 0;
}

export function skipVersion(versionCode: number): void {
  writeSettings({ [SKIP_KEY]: versionCode });
}

export function lastCheckedAt(): number {
  const value = Number(readValue(CHECKED_KEY));
  return Number.isFinite(value) ? value : 0;
}

export function markChecked(): void {
  writeSettings({ [CHECKED_KEY]: Date.now() });
}

export function shouldCheck(): boolean {
  if (!updateSupported()) {
    return false;
  }
  return Date.now() - lastCheckedAt() > INTERVAL_MS;
}

/**
 * GET {base}/app/version: devuelve la version publicada solo si es mas nueva
 * que la instalada y el usuario no la salto.
 */
export async function checkUpdate(): Promise<UpdateInfo | null> {
  if (!updateSupported()) {
    return null;
  }
  const base = apiBase();
  if (!base) {
    return null;
  }
  const current = await updateNative().current();
  const response = await fetch(`${base}/app/version`, {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    return null;
  }
  const data = (await response.json()) as Partial<UpdateInfo> & { versionCode?: number };
  const versionCode = Number(data.versionCode) || 0;
  markChecked();
  if (versionCode <= Number(current.versionCode) || versionCode <= ignoredVersion()) {
    return null;
  }
  return {
    versionCode,
    versionName: String(data.versionName ?? ''),
    url: String(data.url ?? `${base}/app/download/${versionCode}`),
    sha256: String(data.sha256 ?? ''),
    bytes: Number(data.bytes) || 0,
    changelog: String(data.changelog ?? ''),
    obligatoria: data.obligatoria === true,
  };
}
