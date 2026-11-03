import type { ChatToolResult } from '../llm/types';
import type { SshProfile } from './types';

import { connectSsh, disconnectSsh, execSsh, isSshConnected } from './client';
import { prepareChia } from '../chia/prepare';
import { profileKey } from './types';
import { getToolsConfig } from '../settings/store';

const CONNECTION_ERRORS = [
  'session is down',
  'channel is not opened',
  'socket is not established',
  'ssh no conectado',
  'transport is not connected',
  'connection reset',
  'broken pipe',
  'end of io stream',
  'auth fail',
];

let activeKey = '';

export function truncateOutput(value: string): string {
  const { maxChars, headChars, tailChars } = getToolsConfig();
  if (value.length <= maxChars) {
    return value;
  }
  return `${value.slice(0, headChars)}\n\n...[salida truncada: ${value.length - headChars - tailChars} caracteres]...\n\n${value.slice(-tailChars)}`;
}

export async function ensureSsh(profile: SshProfile): Promise<void> {
  if (!profile.host.trim() || !profile.username.trim()) {
    throw new Error(
      'falta configuracion del VPS: no hay host ni usuario SSH. Pedile al usuario que los cargue '
      + 'en Configuracion > Hosting Web (host, puerto, usuario y password o clave). Mientras tanto '
      + 'usa las tools que no dependen del VPS: android_phone, read/edit/write con target:"phone", '
      + 'web_fetch.',
    );
  }
  if (profile.authType === 'key' ? !profile.privateKey.trim() : !profile.password.trim()) {
    throw new Error(
      profile.authType === 'key'
        ? 'falta configuracion del VPS: el usuario eligio autenticacion por clave pero no hay clave privada cargada. Pedile al usuario que la pegue en Configuracion > Hosting Web.'
        : 'falta configuracion del VPS: hay host y usuario pero no hay password SSH. Pedile al usuario que lo cargue en Configuracion > Hosting Web.',
    );
  }
  const key = profileKey(profile);
  if (key === activeKey && isSshConnected()) {
    return;
  }
  await connectSsh(profile);
  activeKey = key;
  void prepareChia();
}

function isConnectionError(message: string): boolean {
  const lower = message.toLowerCase();
  return CONNECTION_ERRORS.some(item => lower.includes(item));
}

type Attempt = {
  output: string;
  exitCode: number;
  timedOut: boolean;
  connectionDown: boolean;
};

async function attempt(
  command: string,
  profile: SshProfile,
  onData?: (chunk: string) => void,
): Promise<Attempt> {
  try {
    await ensureSsh(profile);
    const result = await execSsh(command, { timeoutMs: getToolsConfig().maxTimeMs, onData });
    const connectionDown
      = result.exitCode === 255
        && !result.timedOut
        && isConnectionError(result.output)
        && result.durationMs < 5000;
    return {
      output: result.output,
      exitCode: result.exitCode,
      timedOut: result.timedOut,
      connectionDown,
    };
  }
  catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      output: `Error al ejecutar el comando: ${message}`,
      exitCode: 255,
      timedOut: false,
      connectionDown: isConnectionError(message),
    };
  }
}

async function resetSsh(): Promise<void> {
  activeKey = '';
  try {
    await disconnectSsh();
  }
  catch {
    // la sesión ya estaba muerta
  }
}

export async function runShellTool(
  command: string,
  profile: SshProfile,
  onData?: (chunk: string) => void,
): Promise<ChatToolResult> {
  const startedAt = Date.now();
  let result = await attempt(command, profile, onData);

  // Sin tope: mientras el canal muera se reconecta y reintenta, para que el
  // modelo no vea un fallo fantasma. Corta cuando la reconexion falla de raiz.
  while (result.connectionDown) {
    await resetSsh();
    const retried = await attempt(command, profile, onData);
    if (retried.connectionDown && retried.output === result.output) {
      result = retried;
      break;
    }
    result = retried;
  }

  if (result.connectionDown) {
    result.output = `No se pudo restablecer la conexion con el shell: ${result.output}`;
  }

  return {
    toolCallId: '',
    command,
    output: truncateOutput(result.output),
    exitCode: result.exitCode,
    durationMs: Date.now() - startedAt,
    isError: result.exitCode !== 0 || result.timedOut,
    timedOut: result.timedOut,
  };
}
