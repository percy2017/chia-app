import { DeviceEventEmitter, NativeModules } from 'react-native';

import { getVoiceConfig } from '../settings/store';
import { setAudioSeconds, setPlayingAudio } from './meta';

type AudioNativeModule = {
  playFile: (path: string) => Promise<number>;
  speak: (baseUrl: string, token: string, gender: string, idioma: string, text: string) => Promise<number>;
  transcribe: (baseUrl: string, token: string, path: string, idioma: string) => Promise<string>;
  stop: () => Promise<boolean>;
};

const native = NativeModules.AudioNative as AudioNativeModule | undefined;
DeviceEventEmitter.addListener('AudioDone', () => setPlayingAudio(''));

export function playFile(path: string): Promise<number> {
  if (!native?.playFile) {
    return Promise.reject(new Error('Reproductor no disponible (recompila la app).'));
  }
  return native.playFile(path);
}

export async function speak(text: string): Promise<number> {
  if (!native?.speak) {
    throw new Error('Reproductor no disponible (recompila la app).');
  }
  const clean = text.trim();
  if (!clean) {
    throw new Error('No hay texto para leer.');
  }
  const { baseUrl, token, gender, idioma } = getVoiceConfig();
  if (!baseUrl) {
    throw new Error('Configura el servidor de voz (URL base) en Configuracion.');
  }
  return native.speak(baseUrl, token, gender, idioma, clean);
}

export async function speakMessage(messageId: string, text: string): Promise<number> {
  const seconds = await speak(text);
  setAudioSeconds(messageId, seconds);
  setPlayingAudio(messageId);
  return seconds;
}

/** Audio a texto: sube la grabacion a `/stt` y devuelve el texto plano. */
export async function transcribe(path: string): Promise<string> {
  if (!native?.transcribe) {
    throw new Error('Transcripcion no disponible (recompila la app).');
  }
  const { baseUrl, token, idioma } = getVoiceConfig();
  if (!baseUrl) {
    throw new Error('Configura el servidor de voz (URL base) en Configuracion.');
  }
  const raw = await native.transcribe(baseUrl, token, path, idioma);
  return parseTranscript(raw);
}

/** El servidor puede responder `{texto}` o `{text}`: se aceptan ambos. */
function parseTranscript(raw: string): string {
  const body = (raw ?? '').trim();
  if (!body) {
    return '';
  }
  try {
    const parsed: unknown = JSON.parse(body);
    if (typeof parsed === 'string') {
      return parsed.trim();
    }
    if (parsed && typeof parsed === 'object') {
      const record = parsed as Record<string, unknown>;
      for (const key of ['texto', 'text', 'transcript', 'transcripcion']) {
        const value = record[key];
        if (typeof value === 'string' && value.trim()) {
          return value.trim();
        }
      }
    }
  }
  catch {
    // Respuesta en texto plano: se usa tal cual.
  }
  return body;
}

export function stopAudio(): void {
  setPlayingAudio('');
  void native?.stop?.().catch(() => {});
}
