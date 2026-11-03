import { DeviceEventEmitter, NativeModules } from 'react-native';

export type RecordStart = {
  path: string;
};

export type RecordStop = {
  path: string;
  durationMs: number;
  bytes: number;
  mime: string;
};

type RecordNativeModule = {
  hasPermission: () => Promise<boolean>;
  requestPermission: () => Promise<boolean>;
  start: () => Promise<RecordStart>;
  stop: () => Promise<RecordStop>;
  cancel: () => Promise<boolean>;
};

const native = NativeModules.RecordNative as RecordNativeModule | undefined;

function module(): RecordNativeModule {
  if (!native) {
    throw new Error('Modulo de grabacion no disponible (recompila la app).');
  }
  return native;
}

export function hasRecordModule(): boolean {
  return Boolean(native);
}

export function hasMicPermission(): Promise<boolean> {
  return module().hasPermission().catch(() => false);
}

/** Abre el dialogo del sistema. Devuelve true solo si ya estaba concedido. */
export function requestMicPermission(): Promise<boolean> {
  return module().requestPermission().catch(() => false);
}

export function startRecording(): Promise<RecordStart> {
  return module().start();
}

export function stopRecording(): Promise<RecordStop> {
  return module().stop();
}

export function cancelRecording(): Promise<boolean> {
  return module().cancel().catch(() => false);
}

/** Nivel de entrada (0..1) y tiempo grabado, 10 veces por segundo. */
export function subscribeRecordLevel(
  listener: (event: { rms: number; elapsedMs: number }) => void,
): () => void {
  const subscription = DeviceEventEmitter.addListener('RecordLevel', listener);
  return () => subscription.remove();
}

/** "0:07" a partir de milisegundos. */
export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
