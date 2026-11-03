import type { SshProfile } from './types';

import { getToolsConfig } from '../settings/store';
import { base64DecodeUtf8 } from './base64';
import { execSsh } from './client';
import { readRemoteFile, writeRemoteFile } from './native';
import { readPhoneTextFile, writePhoneTextFile } from '../phone/files';
import { isMemoryPath } from '../chia/fs';
import { parseTarget } from './read';
import type { ReadTarget } from './read';
import { ensureSsh } from './tool';

export type ReplaceEdit = {
  oldText: string;
  newText: string;
};

export type EditArgs = {
  path: string;
  edits: ReplaceEdit[];
  target?: ReadTarget;
};

export type EditOutcome = {
  output: string;
  exitCode: number;
  durationMs: number;
  isError: boolean;
};

const DIFF_CONTEXT = 3;

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

function isReplace(value: unknown): value is ReplaceEdit {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const record = value as Record<string, unknown>;
  return typeof record.oldText === 'string' && typeof record.newText === 'string';
}

export function parseEditArgs(raw: string): EditArgs | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw || '{}');
  }
  catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return null;
  }
  const record = parsed as Record<string, unknown>;
  const path = typeof record.path === 'string' ? record.path.trim() : '';
  if (!path) {
    return null;
  }

  let source: unknown = record.edits;
  if (typeof source === 'string') {
    try {
      source = JSON.parse(source);
    }
    catch {
      source = undefined;
    }
  }
  if (isReplace(source)) {
    source = [source];
  }
  const edits: ReplaceEdit[] = [];
  if (Array.isArray(source)) {
    for (const item of source) {
      if (isReplace(item)) {
        edits.push({ oldText: item.oldText, newText: item.newText });
      }
    }
  }
  if (edits.length === 0 && isReplace(record)) {
    edits.push({ oldText: record.oldText, newText: record.newText });
  }
  if (edits.length === 0) {
    return null;
  }
  const target = parseTarget(record);
  return target ? { path, edits, target } : null;
}

/** Etiqueta corta para la UI ("edit /ruta"). */
export function editCommand(args: EditArgs): string {
  return args.target === 'phone' ? `edit ${args.path} (telefono)` : `edit ${args.path}`;
}

function splitBom(value: string): { bom: string; text: string } {
  return value.startsWith('\uFEFF')
    ? { bom: '\uFEFF', text: value.slice(1) }
    : { bom: '', text: value };
}

function detectLineEnding(content: string): string {
  const crlf = content.indexOf('\r\n');
  const lf = content.indexOf('\n');
  if (lf === -1 || crlf === -1) {
    return '\n';
  }
  return crlf < lf ? '\r\n' : '\n';
}

function normalizeToLF(text: string): string {
  return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

function restoreLineEndings(text: string, ending: string): string {
  return ending === '\r\n' ? text.replace(/\n/g, '\r\n') : text;
}

function normalizeForFuzzyMatch(text: string): string {
  return text
    .normalize('NFKC')
    .split('\n')
    .map(line => line.trimEnd())
    .join('\n')
    .replace(/[\u2018\u2019\u201A\u201B]/g, '\'')
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015\u2212]/g, '-')
    .replace(/[\u00A0\u2002-\u200A\u202F\u205F\u3000]/g, ' ');
}

type Match = {
  index: number;
  length: number;
};

function findMatch(content: string, oldText: string): Match | null {
  const exact = content.indexOf(oldText);
  if (exact !== -1) {
    return { index: exact, length: oldText.length };
  }
  const haystack = normalizeForFuzzyMatch(content);
  const needle = normalizeForFuzzyMatch(oldText);
  const at = needle ? haystack.indexOf(needle) : -1;
  return at === -1 ? null : { index: at, length: needle.length };
}

/** Repeticiones del bloque en la vista difusa (lo que vera el matcher). */
function countOccurrences(content: string, oldText: string): number {
  const haystack = normalizeForFuzzyMatch(content);
  const needle = normalizeForFuzzyMatch(oldText);
  if (!needle) {
    return 0;
  }
  return haystack.split(needle).length - 1;
}

function applyReplacements(content: string, matches: Array<Match & { newText: string }>): string {
  let result = content;
  for (let index = matches.length - 1; index >= 0; index -= 1) {
    const match = matches[index];
    result = result.slice(0, match.index)
      + match.newText
      + result.slice(match.index + match.length);
  }
  return result;
}

function splitLinesWithEndings(content: string): string[] {
  return content.match(/[^\n]*\n|[^\n]+/g) ?? [];
}

/**
 * Aplica los cambios hechos sobre la vista difusa al contenido original: solo
 * se reescriben las lineas afectadas, el resto conserva sus bytes.
 */
function overlayOnOriginal(original: string, fuzzyBase: string, fuzzyNew: string): string {
  const originalLines = splitLinesWithEndings(original);
  const baseLines = splitLinesWithEndings(fuzzyBase);
  const newLines = splitLinesWithEndings(fuzzyNew);
  if (originalLines.length !== baseLines.length) {
    return fuzzyNew;
  }
  let prefix = 0;
  while (
    prefix < baseLines.length
    && prefix < newLines.length
    && baseLines[prefix] === newLines[prefix]
  ) {
    prefix += 1;
  }
  let suffix = 0;
  while (
    suffix < baseLines.length - prefix
    && suffix < newLines.length - prefix
    && baseLines[baseLines.length - 1 - suffix] === newLines[newLines.length - 1 - suffix]
  ) {
    suffix += 1;
  }
  return originalLines.slice(0, prefix).join('')
    + newLines.slice(prefix, newLines.length - suffix).join('')
    + originalLines.slice(originalLines.length - suffix).join('');
}

type AppliedEdits = {
  baseContent: string;
  newContent: string;
};

function fail(message: string): never {
  throw new Error(message);
}

function applyEdits(raw: string, edits: ReplaceEdit[], path: string): AppliedEdits {
  const normalized = edits.map(edit => ({
    oldText: normalizeToLF(edit.oldText),
    newText: normalizeToLF(edit.newText),
  }));
  const baseContent = normalizeToLF(raw);
  const total = normalized.length;

  normalized.forEach((edit, index) => {
    if (!edit.oldText) {
      fail(total === 1
        ? `oldText no puede estar vacio (${path}).`
        : `edits[${index}].oldText no puede estar vacio (${path}).`);
    }
  });

  // Si algun edit necesita match difuso, todo se resuelve en la vista difusa.
  const needsFuzzy = normalized.some(edit => !baseContent.includes(edit.oldText));
  const working = needsFuzzy ? normalizeForFuzzyMatch(baseContent) : baseContent;

  const matches = normalized.map((edit, index) => {
    const found = findMatch(working, edit.oldText);
    if (!found) {
      fail(total === 1
        ? `No se encontro el texto exacto en ${path}. oldText debe coincidir tal cual (espacios y saltos incluidos). Usa read y copia el fragmento literal.`
        : `No se encontro edits[${index}] en ${path}. oldText debe coincidir tal cual (espacios y saltos incluidos). Usa read y copia el fragmento literal.`);
    }
    const occurrences = countOccurrences(working, edit.oldText);
    if (occurrences > 1) {
      fail(total === 1
        ? `Hay ${occurrences} coincidencias del texto en ${path}. oldText debe ser unico: agrega mas contexto.`
        : `Hay ${occurrences} coincidencias de edits[${index}] en ${path}. Cada oldText debe ser unico: agrega mas contexto.`);
    }
    return { ...found, newText: edit.newText, editIndex: index };
  });

  matches.sort((a, b) => a.index - b.index);
  for (let index = 1; index < matches.length; index += 1) {
    const previous = matches[index - 1];
    const current = matches[index];
    if (previous.index + previous.length > current.index) {
      fail(`edits[${previous.editIndex}] y edits[${current.editIndex}] se solapan en ${path}. Unelos en un solo edit.`);
    }
  }

  const worked = applyReplacements(working, matches);
  const newContent = needsFuzzy ? overlayOnOriginal(baseContent, working, worked) : worked;

  if (newContent === baseContent) {
    fail(total === 1
      ? `Sin cambios en ${path}: el reemplazo produce el mismo contenido (revisa caracteres especiales).`
      : `Sin cambios en ${path}: los reemplazos producen el mismo contenido.`);
  }
  return { baseContent, newContent };
}

type Hunk = {
  text: string;
  added: number;
  removed: number;
};

/**
 * Diff minimo (prefijo/sufijo comun) en vez de un LCS completo: los cambios son
 * puntuales y el archivo puede ser grande.
 */
function buildHunk(oldContent: string, newContent: string): Hunk {
  const oldLines = oldContent.split('\n');
  const newLines = newContent.split('\n');
  let prefix = 0;
  while (
    prefix < oldLines.length
    && prefix < newLines.length
    && oldLines[prefix] === newLines[prefix]
  ) {
    prefix += 1;
  }
  let suffix = 0;
  while (
    suffix < oldLines.length - prefix
    && suffix < newLines.length - prefix
    && oldLines[oldLines.length - 1 - suffix] === newLines[newLines.length - 1 - suffix]
  ) {
    suffix += 1;
  }
  const removedEnd = oldLines.length - suffix;
  const addedEnd = newLines.length - suffix;
  const from = Math.max(0, prefix - DIFF_CONTEXT);
  const to = Math.min(oldLines.length, removedEnd + DIFF_CONTEXT);

  const lines: string[] = [];
  for (let index = from; index < prefix; index += 1) {
    lines.push(` ${index + 1}| ${oldLines[index]}`);
  }
  for (let index = prefix; index < removedEnd; index += 1) {
    lines.push(`-${index + 1}| ${oldLines[index]}`);
  }
  for (let index = prefix; index < addedEnd; index += 1) {
    lines.push(`+${index + 1}| ${newLines[index]}`);
  }
  for (let index = removedEnd; index < to; index += 1) {
    // La ultima linea vacia (fin de archivo) solo anade ruido al diff.
    if (index === oldLines.length - 1 && oldLines[index] === '') {
      continue;
    }
    lines.push(` ${index + 1}| ${oldLines[index]}`);
  }
  return {
    text: lines.join('\n'),
    added: addedEnd - prefix,
    removed: removedEnd - prefix,
  };
}

function limitText(text: string, maxChars: number): string {
  if (text.length <= maxChars) {
    return text;
  }
  const head = text.slice(0, Math.max(200, Math.floor(maxChars * 0.7)));
  const tail = text.slice(-Math.max(100, Math.floor(maxChars * 0.2)));
  return `${head}\n...[diff truncado]...\n${tail}`;
}

export async function writeAtomic(
  path: string,
  content: string,
  timeoutMs: number,
): Promise<void> {
  const temp = `${path}.chia-edit-${Date.now().toString(36)}`;
  await writeRemoteFile(temp, content);
  const quotedPath = shellQuote(path);
  const quotedTemp = shellQuote(temp);
  const command = `t=$(readlink -f ${quotedPath} 2>/dev/null || echo ${quotedPath}); m=$(stat -c %a "$t" 2>/dev/null || stat -f %Lp "$t" 2>/dev/null); if [ -n "$m" ]; then chmod "$m" ${quotedTemp}; fi; mv -f ${quotedTemp} "$t"`;
  try {
    const result = await execSsh(command, { timeoutMs });
    if (result.exitCode !== 0) {
      throw new Error(result.output.trim() || `exit ${result.exitCode}`);
    }
  }
  catch {
    await writeRemoteFile(path, content);
    try {
      await execSsh(`rm -f ${quotedTemp}`, { timeoutMs });
    }
    catch {
      // el temporal sobrante no debe tapar el resultado del edit
    }
  }
}


const NEWLINE = String.fromCharCode(10);

function lineCount(value: string): number {
  let total = 1;
  for (const char of value) {
    if (char === NEWLINE) {
      total += 1;
    }
  }
  return total;
}

function createContent(args: EditArgs): string | null {
  if (args.edits.length !== 1) {
    return null;
  }
  return args.edits[0].oldText === '' ? args.edits[0].newText : null;
}

/** Rama telefono: mismo motor de reemplazo, IO por `phone files.*`. */
async function runPhoneEdit(args: EditArgs, started: number): Promise<EditOutcome> {
  const config = getToolsConfig();

  let raw: string;
  try {
    raw = await readPhoneTextFile(args.path, config.maxBytes);
  }
  catch (error) {
    const created = createContent(args);
    if (created !== null) {
      if (isMemoryPath(args.path) && created.length > config.maxChars) {
        return {
          output: `${args.path}: cada nota de memoria admite ${config.maxChars} chars y el contenido tiene ${created.length}. Resumila o usa una nota por hecho.`,
          exitCode: 1,
          durationMs: Date.now() - started,
          isError: true,
        };
      }
      try {
        await writePhoneTextFile(args.path, created);
        return {
          output: `ok: creado ${args.path} (${lineCount(created)} lineas) [telefono].`,
          exitCode: 0,
          durationMs: Date.now() - started,
          isError: false,
        };
      }
      catch (writeError) {
        const detail = writeError instanceof Error ? writeError.message : String(writeError);
        return {
          output: `No se pudo crear ${args.path} en el telefono: ${detail}`,
          exitCode: 1,
          durationMs: Date.now() - started,
          isError: true,
        };
      }
    }
    const message = error instanceof Error ? error.message : String(error);
    return {
      output: `No se pudo leer ${args.path} del telefono: ${message}
Para crearlo: una sola edicion con oldText vacio y newText con el contenido.`,
      exitCode: 1,
      durationMs: Date.now() - started,
      isError: true,
    };
  }

  if (raw.includes('\u0000')) {
    return {
      output: `${args.path} parece binario: edit solo trabaja con texto UTF-8.`,
      exitCode: 1,
      durationMs: Date.now() - started,
      isError: true,
    };
  }

  const { bom, text } = splitBom(raw);
  const ending = detectLineEnding(text);

  let applied: AppliedEdits;
  try {
    applied = applyEdits(text, args.edits, args.path);
  }
  catch (error) {
    return {
      output: error instanceof Error ? error.message : String(error),
      exitCode: 1,
      durationMs: Date.now() - started,
      isError: true,
    };
  }

  const finalContent = bom + restoreLineEndings(applied.newContent, ending);
  if (isMemoryPath(args.path) && finalContent.length > config.maxChars) {
    return {
      output: `${args.path}: cada nota de memoria admite ${config.maxChars} chars y quedaria con ${finalContent.length}. Resumila o usa una nota por hecho.`,
      exitCode: 1,
      durationMs: Date.now() - started,
      isError: true,
    };
  }

  try {
    await writePhoneTextFile(args.path, finalContent);
  }
  catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      output: `No se pudo escribir ${args.path} en el telefono: ${message}`,
      exitCode: 1,
      durationMs: Date.now() - started,
      isError: true,
    };
  }

  const hunk = buildHunk(applied.baseContent, applied.newContent);
  const summary = `ok: ${args.edits.length} bloque(s) reemplazado(s) en ${args.path} `
    + `(+${hunk.added} -${hunk.removed} lineas) [telefono].`;
  return {
    output: `${summary}
${limitText(hunk.text, config.maxChars)}`,
    exitCode: 0,
    durationMs: Date.now() - started,
    isError: false,
  };
}

export async function runEditTool(args: EditArgs, profile: SshProfile): Promise<EditOutcome> {
  const started = Date.now();
  const config = getToolsConfig();

  if (args.target === 'phone') {
    return runPhoneEdit(args, started);
  }

  try {
    await ensureSsh(profile);
  }
  catch (error) {
    return {
      output: `No se pudo conectar al shell: ${error instanceof Error ? error.message : String(error)}`,
      exitCode: 255,
      durationMs: Date.now() - started,
      isError: true,
    };
  }

  let raw: string;
  try {
    const file = await readRemoteFile(args.path, config.maxBytes);
    raw = base64DecodeUtf8(file.data);
  }
  catch (error) {
    const created = createContent(args);
    if (created !== null) {
      try {
        await writeRemoteFile(args.path, created);
        return {
          output: `ok: creado ${args.path} (${lineCount(created)} lineas) [vps].`,
          exitCode: 0,
          durationMs: Date.now() - started,
          isError: false,
        };
      }
      catch (writeError) {
        const detail = writeError instanceof Error ? writeError.message : String(writeError);
        return {
          output: `No se pudo crear ${args.path}: ${detail}`,
          exitCode: 1,
          durationMs: Date.now() - started,
          isError: true,
        };
      }
    }
    const message = error instanceof Error ? error.message : String(error);
    return {
      output: `No se pudo leer ${args.path}: ${message}\nSi el archivo no existe, crealo con shell_exec (printf/cat > ...). Si es demasiado grande (limite ${Math.round(config.maxBytes / 1024)} KB), edit\u00e1lo con shell_exec (sed -i, head/tail) o sube tools.maxBytesKb.`,
      exitCode: 1,
      durationMs: Date.now() - started,
      isError: true,
    };
  }

  if (raw.includes('\u0000')) {
    return {
      output: `${args.path} parece binario: edit solo trabaja con texto UTF-8.`,
      exitCode: 1,
      durationMs: Date.now() - started,
      isError: true,
    };
  }

  const { bom, text } = splitBom(raw);
  const ending = detectLineEnding(text);

  let applied: AppliedEdits;
  try {
    applied = applyEdits(text, args.edits, args.path);
  }
  catch (error) {
    return {
      output: error instanceof Error ? error.message : String(error),
      exitCode: 1,
      durationMs: Date.now() - started,
      isError: true,
    };
  }

  try {
    await writeAtomic(args.path, bom + restoreLineEndings(applied.newContent, ending), config.maxTimeMs);
  }
  catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      output: `No se pudo escribir ${args.path}: ${message}`,
      exitCode: 1,
      durationMs: Date.now() - started,
      isError: true,
    };
  }

  const hunk = buildHunk(applied.baseContent, applied.newContent);
  const summary = `ok: ${args.edits.length} bloque(s) reemplazado(s) en ${args.path} (+${hunk.added} -${hunk.removed} lineas).`;
  return {
    output: `${summary}\n${limitText(hunk.text, config.maxChars)}`,
    exitCode: 0,
    durationMs: Date.now() - started,
    isError: false,
  };
}
