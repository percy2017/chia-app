import { CHIA_PROMPTS_DIR, deletePhonePath, listPhoneDir } from '../chia/fs';
import { writePhoneTextFile } from '../phone/files';
import { getToolsConfig } from '../settings/store';

export type PromptLimits = { maxChars: number; maxBytes: number };

export type PromptOverflow = {
  chars: number;
  bytes: number;
  limits: PromptLimits;
  tooBig: boolean;
};

export type SpilledPrompt = {
  name: string;
  path: string;
  bytes: number;
  chars: number;
};

export type PreparedPrompt = { content: string; spilled?: SpilledPrompt };

/** Cuantos .txt de prompts y salidas largas se guardan en `.chia/tmp`. */
const KEEP_PROMPTS = 20;

/** Tope del composer y de las tools: sale de Configuracion > Agente, no del codigo. */
export function promptLimits(): PromptLimits {
  const { maxChars, maxBytes } = getToolsConfig();
  return { maxChars, maxBytes };
}

/** Bytes UTF-8 reales (Hermes no trae TextEncoder). */
export function promptBytes(text: string): number {
  let total = 0;
  for (const char of text) {
    const code = char.codePointAt(0) ?? 0;
    total += code < 0x80 ? 1 : code < 0x800 ? 2 : code < 0x10000 ? 3 : 4;
  }
  return total;
}

/** null si el texto entra tal cual en el mensaje. */
export function promptOverflow(
  text: string,
  limits: PromptLimits = promptLimits(),
): PromptOverflow | null {
  const chars = text.length;
  if (chars <= limits.maxChars) {
    return null;
  }
  const bytes = promptBytes(text);
  return { chars, bytes, limits, tooBig: bytes > limits.maxBytes };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function stamp(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  const date = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  return `${date}-${time}-${Math.random().toString(36).slice(2, 6)}`;
}

async function prunePrompts(): Promise<void> {
  const entries = await listPhoneDir(CHIA_PROMPTS_DIR).catch(() => []);
  const files = entries
    .filter(item => !item.dir && /\.txt$/.test(item.name))
    .sort((a, b) => b.name.localeCompare(a.name));
  for (const file of files.slice(KEEP_PROMPTS)) {
    await deletePhonePath(file.path).catch(() => undefined);
  }
}

/** Guarda el texto como `.txt` en `.chia/tmp` (la crea el propio write). */
async function spillText(text: string, prefix: string): Promise<SpilledPrompt> {
  const name = `${prefix}-${stamp()}.txt`;
  const path = `${CHIA_PROMPTS_DIR}/${name}`;
  await writePhoneTextFile(path, text);
  await prunePrompts();
  return { name, path, bytes: promptBytes(text), chars: text.length };
}

/**
 * Texto que devuelve una tool: si pasa `maxChars` no se recorta, se guarda
 * completo en `.chia/tmp` y al modelo le llega la ruta para leerlo por partes.
 */
export async function spillLongOutput(text: string): Promise<string> {
  const limits = promptLimits();
  if (text.length <= limits.maxChars) {
    return text;
  }
  try {
    const spilled = await spillText(text, 'salida');
    return `[salida larga] ${spilled.chars} chars pasan el tope de ${limits.maxChars} por respuesta. `
      + `No se recorto nada: esta completa en ${spilled.path} (${formatBytes(spilled.bytes)}). `
      + 'Leela con read y target "phone", pagina con offset/limit.';
  }
  catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return `${text}\n\n[aviso] no se pudo guardar la salida en ${CHIA_PROMPTS_DIR}: ${message}`;
  }
}

/** Lo que ve el modelo y la burbuja cuando el texto se fue a un archivo. */
function promptNotice(spilled: SpilledPrompt, limits: PromptLimits): string {
  return [
    `[texto largo] ${spilled.chars} chars pasan el tope de ${limits.maxChars} por mensaje.`,
    `El texto completo quedo en ${spilled.path} (${formatBytes(spilled.bytes)}):`,
    'leelo con read y target "phone" por partes y contestalo como si fuera el mensaje.',
  ].join(' ');
}

/**
 * Texto del composer listo para el modelo: tal cual si entra, o el aviso con la
 * ruta del `.txt`. Lanza si el archivo pasaria el tope de bytes.
 */
export async function preparePrompt(text: string): Promise<PreparedPrompt> {
  const overflow = promptOverflow(text);
  if (!overflow) {
    return { content: text };
  }
  if (overflow.tooBig) {
    throw new Error(
      `El texto no entra: ${overflow.chars} chars (${formatBytes(overflow.bytes)}) y el tope es `
      + `${overflow.limits.maxChars} chars / ${formatBytes(overflow.limits.maxBytes)}. `
      + 'Partilo en varios mensajes.',
    );
  }
  const spilled = await spillText(text, 'prompt');
  return { content: promptNotice(spilled, overflow.limits), spilled };
}
