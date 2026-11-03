import { DeviceEventEmitter, NativeModules } from 'react-native';

export type UpdateCurrent = {
  versionCode: number;
  versionName: string;
  package: string;
};

export type UpdateDownload = {
  path: string;
  bytes: number;
  sha256: string;
};

type UpdateNativeModule = {
  current: () => Promise<UpdateCurrent>;
  canInstall: () => Promise<boolean>;
  openInstallSettings: () => Promise<boolean>;
  download: (url: string, sha256: string) => Promise<UpdateDownload>;
  install: (path: string) => Promise<boolean>;
  clear: () => Promise<boolean>;
};

const native = NativeModules.Update as UpdateNativeModule | undefined;

/** true si el APK trae el modulo de actualizaciones. */
export function updateSupported(): boolean {
  return native !== undefined;
}

export function updateNative(): UpdateNativeModule {
  if (!native) {
    throw new Error('El actualizador no esta en este APK (instala la version nueva a mano una vez).');
  }
  return native;
}

/** Progreso de la descarga del APK (bytes bajados / total, 0 si no lo dice). */
export function onDownloadProgress(
  callback: (bytes: number, total: number) => void,
): () => void {
  const subscription = DeviceEventEmitter.addListener(
    'UpdateProgress',
    (event: { bytes?: number; total?: number }) => {
      callback(event?.bytes ?? 0, event?.total ?? 0);
    },
  );
  return () => subscription.remove();
}
