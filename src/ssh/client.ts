import type { SshExecResult, SshProfile } from './types';

import { connect, disconnect, exec, isConnected } from './native';
import { profileKey } from './types';

type SshEvent = { type: 'closed' };

const listeners = new Set<(event: SshEvent) => void>();

function log(...args: unknown[]) {
  if (__DEV__) {
    console.log('[ssh]', ...args);
  }
}

let currentKey = '';
let connecting: Promise<void> | null = null;

export function subscribeSsh(listener: (event: SshEvent) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function emit(event: SshEvent) {
  for (const listener of listeners) {
    listener(event);
  }
}

export async function connectSsh(profile: SshProfile): Promise<void> {
  const key = profileKey(profile);
  if (isConnected() && currentKey === key) {
    return;
  }
  if (connecting) {
    await connecting;
    if (isConnected() && currentKey === key) {
      return;
    }
  }

  connecting = (async () => {
    await disconnect();
    await connect(profile);
    currentKey = key;
    log('connected', profile.host);
  })();

  try {
    await connecting;
  }
  catch (error) {
    currentKey = '';
    await disconnect();
    emit({ type: 'closed' });
    throw error instanceof Error ? error : new Error(String(error));
  }
  finally {
    connecting = null;
  }
}

export async function disconnectSsh(): Promise<void> {
  currentKey = '';
  await disconnect();
}

export function isSshConnected(): boolean {
  return isConnected();
}

export async function execSsh(
  command: string,
  options: { timeoutMs?: number; onData?: (chunk: string) => void } = {},
): Promise<SshExecResult> {
  return exec(command, options);
}

export async function interruptSsh(): Promise<void> {
  await disconnectSsh();
}

export async function testSsh(profile: SshProfile): Promise<string> {
  await connectSsh(profile);
  const result = await execSsh('printf "ok:%s\\n" "$(id -un 2>/dev/null)"');
  return result.output.trim();
}
