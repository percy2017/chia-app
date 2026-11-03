import { readValue, writeSettings } from '../db/settings';
const PREFIX = 'audio.';

const cache = new Map<string, number>();
const listeners = new Set<() => void>();

function clean(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }
  return Math.round(value * 10) / 10;
}

export function audioSeconds(id: string): number {
  if (!id) {
    return 0;
  }
  const hit = cache.get(id);
  if (hit !== undefined) {
    return hit;
  }
  let stored = 0;
  try {
    stored = clean(Number(readValue(`${PREFIX}${id}`)));
  }
  catch {
    stored = 0;
  }
  cache.set(id, stored);
  return stored;
}

/** Guarda lo que duro el audio que se acaba de reproducir. */
export function setAudioSeconds(id: string, seconds: number): void {
  const value = clean(seconds);
  if (!id || value <= 0 || cache.get(id) === value) {
    return;
  }
  cache.set(id, value);
  try {
    writeSettings({ [`${PREFIX}${id}`]: value });
  }
  catch {
    // Sin SQLite queda solo en memoria.
  }
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeAudioSeconds(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Estado del audio en curso, igual para la voz manual (boton Escuchar) y la
 * automatica (al cerrar el turno): un solo audio a la vez. `preparing` es el
 * mensaje cuyo guion se esta generando; `playing` el que ya esta sonando.
 */
let playing = '';
let preparing = '';
const audioListeners = new Set<() => void>();

function notifyAudio() {
  for (const listener of audioListeners) {
    listener();
  }
}

export function playingAudioId(): string {
  return playing;
}

export function preparingAudioId(): string {
  return preparing;
}

export function setPlayingAudio(id: string): void {
  if (playing === id) {
    return;
  }
  playing = id;
  notifyAudio();
}

export function setPreparingAudio(id: string): void {
  if (preparing === id) {
    return;
  }
  preparing = id;
  notifyAudio();
}

export function subscribeAudioState(listener: () => void): () => void {
  audioListeners.add(listener);
  return () => {
    audioListeners.delete(listener);
  };
}
