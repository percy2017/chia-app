import { NativeModules } from 'react-native';

export type PickedFile = {
  uri: string;
  name: string;
  mimeType: string;
  size: number;
  data?: string;
  width?: number;
  height?: number;
};

type AttachNativeModule = {
  pickImage: () => Promise<PickedFile | null>;
  pickFile: () => Promise<PickedFile | null>;
  readText: (uri: string) => Promise<string>;
};

type ShellNativeUpload = {
  upload: (uri: string, remotePath: string) => Promise<string>;
};

const attach = NativeModules.AttachNative as AttachNativeModule | undefined;
const shell = NativeModules.ShellNative as ShellNativeUpload | undefined;

export function pickImageNative(): Promise<PickedFile | null> {
  if (!attach) {
    return Promise.reject(new Error('Modulo de adjuntos no disponible.'));
  }
  return attach.pickImage();
}

export function pickFileNative(): Promise<PickedFile | null> {
  if (!attach) {
    return Promise.reject(new Error('Modulo de adjuntos no disponible.'));
  }
  return attach.pickFile();
}

/** Lee el archivo elegido como texto UTF-8 (JSON de configuracion). */
export function readTextNative(uri: string): Promise<string> {
  if (!attach?.readText) {
    return Promise.reject(new Error('Lector de archivos no disponible.'));
  }
  return attach.readText(uri);
}

export function uploadNative(uri: string, remotePath: string): Promise<string> {
  if (!shell?.upload) {
    return Promise.reject(new Error('Subida SFTP no disponible.'));
  }
  return shell.upload(uri, remotePath);
}
