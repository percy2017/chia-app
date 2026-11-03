import type { SshExecResult, SshProfile } from './types';

import { DeviceEventEmitter, NativeModules } from 'react-native';

import { getSshConnectTimeoutMs, getToolsConfig } from '../settings/store';

type NativeExecResult = {
  exitCode: number;
  output: string;
  timedOut: boolean;
};

type NativeSftpFile = {
  local: string;
  remote: string;
  bytes: number;
};

type NativeFileResult = {
  data: string;
  size: number;
  truncated: boolean;
};

type ShellNativeModule = {
  readFile: (path: string, maxBytes: number) => Promise<NativeFileResult>;
  writeFile: (path: string, content: string) => Promise<string>;
  connect: (
    host: string,
    port: number,
    username: string,
    password: string,
    timeoutSec: number,
  ) => Promise<boolean>;
  exec: (command: string, timeoutMs: number) => Promise<NativeExecResult>;
  disconnect: () => Promise<boolean>;
  sftpGet: (remotePath: string, localPath: string, maxBytes: number) => Promise<NativeSftpFile>;
  sftpPut: (localPath: string, remotePath: string) => Promise<NativeSftpFile>;
  sftpList: (path: string) => Promise<unknown>;
};

const native = NativeModules.ShellNative as ShellNativeModule | undefined;

function module(): ShellNativeModule {
  if (!native) {
    throw new Error('Modulo SSH nativo no disponible.');
  }
  return native;
}

type ChunkListener = (chunk: string) => void;

let subscriber: ChunkListener | null = null;
let attached = false;

function ensureListener() {
  if (attached) {
    return;
  }
  attached = true;
  DeviceEventEmitter.addListener('ShellChunk', (event: { chunk?: string }) => {
    if (event?.chunk) {
      subscriber?.(event.chunk);
    }
  });
}

let connected = false;

export function isConnected(): boolean {
  return connected;
}

export async function connect(profile: SshProfile): Promise<void> {
  ensureListener();
  const auth = profile.authType === 'key' ? profile.privateKey : profile.password;
  await module().connect(
    profile.host,
    profile.port,
    profile.username,
    profile.password || auth,
    getSshConnectTimeoutMs() / 1000,
  );
  connected = true;
}

export async function disconnect(): Promise<void> {
  connected = false;
  subscriber = null;
  try {
    await module().disconnect();
  }
  catch {
    // sesion ya cerrada
  }
}

/** Lee un archivo remoto (base64) por SFTP. Solo lectura. */
export async function readRemoteFile(path: string, maxBytes: number): Promise<NativeFileResult> {
  try {
    return await module().readFile(path, maxBytes);
  }
  catch (error) {
    throw error instanceof Error ? error : new Error(String(error));
  }
}

/** Escribe texto en el VPS (SFTP), creando el directorio padre. */
export async function writeRemoteFile(path: string, content: string): Promise<void> {
  try {
    await module().writeFile(path, content);
  }
  catch (error) {
    throw error instanceof Error ? error : new Error(String(error));
  }
}

export async function exec(
  command: string,
  options: { timeoutMs?: number; onData?: (chunk: string) => void } = {},
): Promise<SshExecResult> {
  ensureListener();
  const startedAt = Date.now();
  subscriber = options.onData ?? null;

  let result: NativeExecResult;
  try {
    result = await module().exec(command, options.timeoutMs ?? getToolsConfig().maxTimeMs);
  }
  catch (error) {
    connected = false;
    throw error instanceof Error ? error : new Error(String(error));
  }
  finally {
    subscriber = null;
  }

  return {
    output: result.output,
    exitCode: result.exitCode,
    durationMs: Date.now() - startedAt,
    timedOut: result.timedOut,
    closed: false,
  };
}

/** Baja un archivo del VPS al telefono (SFTP). */
export async function sftpGet(
  remotePath: string,
  localPath: string,
  maxBytes: number,
): Promise<NativeSftpFile> {
  return module().sftpGet(remotePath, localPath, maxBytes);
}

/** Sube un archivo del telefono al VPS (SFTP). */
export async function sftpPut(localPath: string, remotePath: string): Promise<NativeSftpFile> {
  return module().sftpPut(localPath, remotePath);
}

/** Lista un directorio remoto; devuelve JSON ya serializado. */
export async function sftpList(path: string): Promise<string> {
  const raw = await module().sftpList(path);
  return typeof raw === 'string' ? raw : JSON.stringify(raw);
}
