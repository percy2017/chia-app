import type {
  AssistantTurn,
  ChatAudio,
  ChatDoc,
  ChatImage,
  ChatMessage,
  ChatStream,
  ChatToolResult,
  LlmConfig,
} from '../llm';
import type { SshProfile } from '../ssh/types';

import { startKeepAlive, stopKeepAlive } from './keepAlive';
import { preparePrompt, spillLongOutput } from './prompt';
import {
  clearMessages,
  deleteMessage,
  loadMessages,
  saveMessage,
} from '../db/history';
import { buildSystemPrompt, createChatStream, trimHistory } from '../llm';
import { transcribe } from '../audio/player';
import {
  getActiveSshProfile,
  getLlmConfig,
  settingsFingerprint,
} from '../settings/store';
import { ensureEnvironment } from '../device/environment';
import { interruptSsh } from '../ssh/client';
import { editCommand, parseEditArgs, runEditTool } from '../ssh/edit';
import { isVideoPath, parseReadArgs, readCommand, runReadTool } from '../ssh/read';
import { parseWriteArgs, runWriteTool, writeCommand } from '../ssh/write';
import { invalidateMemory, maybeSyncMemory, syncMemory } from '../memory/store';
import { findSkill, invalidateSkills, maybeSyncSkills, syncSkills } from '../skills/store';
import { formatSkillCommand } from '../skills/parse';
import { ensureSsh, runShellTool } from '../ssh/tool';
import { prepareChia } from '../chia/prepare';
import { runRagTool } from '../rag/tool';
import { runWebFetch } from '../web';
import type { WebFetchArgs } from '../web';
import { parsePhoneArgs } from '../phone/args';
import { phoneCommand, runPhoneTool } from '../phone';

export type QueuedPrompt = {
  id: string;
  text: string;
  followUp: boolean;
};

export type AgentState = {
  messages: ChatMessage[];
  isStreaming: boolean;
  error: string | null;
  queued: QueuedPrompt[];
  /** false hasta que terminó de leer el historial de SQLite. */
  hydrated: boolean;
};

const SAVE_DELAY_MS = 250;

const DELTA_FLUSH_MS = 100;

let state: AgentState = {
  messages: [],
  isStreaming: false,
  error: null,
  queued: [],
  hydrated: false,
};
let activeStream: ChatStream | null = null;
let publishDeltas: (() => void) | null = null;
let runToken = 0;
// null = todavia no se fijo: la primera vez se toma el valor real (la config
// se hidrata despues de importar el modulo) y no se borra nada.
let lastFingerprint: string | null = null;
// Al cambiar modelo/protocolo el historial viejo no se manda al modelo, pero se
// conserva visible y en la base: solo cuenta lo creado despues de este instante.
let contextSince = 0;
let hydrating: Promise<void> | null = null;

const steeringQueue: ChatMessage[] = [];
const followUpQueue: ChatMessage[] = [];
// Texto tal cual lo escribio el usuario, para el chip de la cola: el content
// puede ser el bloque expandido de un /skill.
const queuedLabels = new Map<string, string>();

function syncQueued() {
  setState({
    queued: [
      ...steeringQueue.map(item => ({
        id: item.id,
        text: queuedLabels.get(item.id) ?? item.content,
        followUp: false,
      })),
      ...followUpQueue.map(item => ({
        id: item.id,
        text: queuedLabels.get(item.id) ?? item.content,
        followUp: true,
      })),
    ],
  });
}

/** Encola un prompt para el proximo turno (el usuario escribio mientras corria). */
export async function enqueuePrompt(text: string, followUp = false): Promise<boolean> {
  const typed = text.trim();
  if (!typed) {
    return false;
  }
  // Se expande igual que en send(): al modelo le llega el /skill resuelto.
  const prepared = await preparePrompt(typed);
  const content = prepared.spilled ? prepared.content : expandSkillCommand(prepared.content);
  const message: ChatMessage = {
    id: uid(),
    role: 'user',
    content,
    status: 'done',
    createdAt: Date.now(),
  };
  queuedLabels.set(message.id, typed);
  if (followUp) {
    followUpQueue.push(message);
  }
  else {
    steeringQueue.push(message);
  }
  // Se persiste al encolar: si el proceso muere antes del turno, el texto sigue
  // en el historial en vez de desaparecer.
  saveNow(message);
  syncQueued();
  return true;
}

/** Mueve un prompt en espera entre "en cola" (steering) y "despues" (follow-up). */
export function setQueuedFollowUp(id: string, followUp: boolean): void {
  const from = followUp ? steeringQueue : followUpQueue;
  const to = followUp ? followUpQueue : steeringQueue;
  const index = from.findIndex(item => item.id === id);
  if (index < 0) {
    return;
  }
  const [item] = from.splice(index, 1);
  to.push({ ...item });
  syncQueued();
}

/** Quita un prompt en espera por id. */
export function removeQueued(id: string): void {
  for (const queue of [steeringQueue, followUpQueue]) {
    const index = queue.findIndex(item => item.id === id);
    if (index >= 0) {
      queue.splice(index, 1);
    }
  }
  queuedLabels.delete(id);
  syncQueued();
}

export function clearQueued(): void {
  steeringQueue.length = 0;
  followUpQueue.length = 0;
  queuedLabels.clear();
  syncQueued();
}

const pendingSaves = new Map<string, ChatMessage>();
let saveTimer: ReturnType<typeof setTimeout> | null = null;

function snapshotMessage(message: ChatMessage): ChatMessage {
  return {
    ...message,
    images: message.images?.map(image => ({ ...image })),
    toolCalls: message.toolCalls?.map(call => ({ ...call })),
    toolResults: message.toolResults?.map(result => ({ ...result })),
  };
}

function queueSave(message: ChatMessage) {
  // Se guarda la referencia y se copia al volcar: copiar en cada delta es
  // trabajo O(n) por token para un dato que solo se usa 4 veces por segundo.
  pendingSaves.set(message.id, message);
  if (saveTimer) {
    return;
  }
  saveTimer = setTimeout(() => {
    flushHistory();
  }, SAVE_DELAY_MS);
}

export function flushHistory(): void {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  if (pendingSaves.size === 0) {
    return;
  }
  const messages = [...pendingSaves.values()];
  pendingSaves.clear();
  for (const message of messages) {
    void saveMessage(snapshotMessage(message));
  }
}

function saveNow(message: ChatMessage) {
  pendingSaves.delete(message.id);
  void saveMessage(snapshotMessage(message));
}

function dropPending(id?: string) {
  if (id) {
    pendingSaves.delete(id);
    return;
  }
  pendingSaves.clear();
}

const listeners = new Set<() => void>();

function setState(patch: Partial<AgentState>) {
  state = { ...state, ...patch };
  for (const listener of listeners) {
    listener();
  }
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getSnapshot(): AgentState {
  return state;
}

export function hydrate(): Promise<void> {
  if (!hydrating) {
    hydrating = loadMessages()
      .then((messages) => {
        if (state.messages.length > 0 || state.isStreaming) {
          return;
        }
        if (messages.length > 0) {
          setState({ messages });
        }
      })
      .catch((error: unknown) => {
        console.warn('[history] no se pudo leer:', error instanceof Error ? error.message : String(error));
      })
      .then(() => {
        setState({ hydrated: true });
      });
  }
  return hydrating;
}

/** `/skill:nombre args` -> bloque <skill> expandido, igual que pi dev. */
function expandSkillCommand(text: string): string {
  const match = /^\/skill:([a-z0-9-]+)(?:\s+([\s\S]*))?$/.exec(text);
  if (!match) {
    return text;
  }
  const skill = findSkill(match[1]);
  return skill ? formatSkillCommand(skill, match[2] ?? '') : text;
}

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function parseCommand(argumentsText: string): string | null {
  try {
    const parsed = JSON.parse(argumentsText) as { command?: unknown };
    return typeof parsed.command === 'string' ? parsed.command : null;
  }
  catch {
    return null;
  }
}

function parseWebArgs(argumentsText: string): WebFetchArgs | null {
  try {
    const parsed = JSON.parse(argumentsText) as Record<string, unknown>;
    const url = typeof parsed.url === 'string' ? parsed.url.trim() : '';
    if (!url) {
      return null;
    }
    const mode = typeof parsed.mode === 'string' ? parsed.mode : undefined;
    const offset = Number(parsed.offset);
    const find = typeof parsed.find === 'string' ? parsed.find : undefined;
    return {
      url,
      mode,
      offset: Number.isFinite(offset) ? offset : 0,
      find,
    };
  }
  catch {
    return null;
  }
}

/**
 * Inyecta los prompts en cola (steering) en el historial y en la UI.
 * Se llama al inicio de cada iteracion, nunca en mitad de un stream.
 */
function injectSteering(working: ChatMessage[]): ChatMessage[] {
  if (steeringQueue.length === 0) {
    return working;
  }
  const drained = steeringQueue.splice(0, steeringQueue.length);
  for (const message of drained) {
    queuedLabels.delete(message.id);
    saveNow(message);
  }
  syncQueued();
  setState({ messages: [...state.messages, ...drained] });
  return [...working, ...drained];
}

/** Re-escanea skills y memoria del telefono (tras tocar .chia). */
async function refreshChia(): Promise<void> {
  invalidateSkills();
  invalidateMemory();
  await syncSkills();
  await syncMemory();
}

export type SendResult = { ok: boolean; error?: string };

async function withTranscript(audio: ChatAudio): Promise<ChatAudio> {
  if (audio.transcript?.trim()) {
    return audio;
  }
  const spoken = await transcribe(audio.path);
  if (!spoken.trim()) {
    throw new Error('La transcripcion vino vacia.');
  }
  return { ...audio, transcript: spoken };
}

export async function send(
  text: string,
  images: ChatImage[] = [],
  audio?: ChatAudio,
  doc?: ChatDoc,
): Promise<SendResult> {
  if (state.isStreaming) {
    return { ok: false };
  }
  const config = getLlmConfig();
  if (!config) {
    const error = 'Entra con tu token: el chat, la voz y el rag usan la misma sesion.';
    setState({ error });
    return { ok: false, error };
  }
  const profile = getActiveSshProfile();
  const typed = text.trim();
  if (!typed && images.length === 0 && !audio && !doc) {
    return { ok: false };
  }

  let recorded = audio;
  if (audio) {
    try {
      recorded = await withTranscript(audio);
    }
    catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return { ok: false, error: `Transcripcion: ${message}` };
    }
    if (state.isStreaming) {
      return { ok: false };
    }
  }

  const currentFingerprint = settingsFingerprint();
  if (lastFingerprint === null) {
    lastFingerprint = currentFingerprint;
  }
  else if (currentFingerprint !== lastFingerprint) {
    // Cambio real de modelo o protocolo: el contexto viejo ya no se envia,
    // pero NO se borra (el usuario conserva su historial).
    lastFingerprint = currentFingerprint;
    contextSince = Date.now();
  }

  const token = ++runToken;
  let prompt = '';
  if (typed) {
    try {
      const prepared = await preparePrompt(typed);
      prompt = prepared.spilled ? prepared.content : expandSkillCommand(prepared.content);
    }
    catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return { ok: false, error: message };
    }
  }
  const content = [
    recorded?.transcript?.trim() ?? '',
    prompt,
  ].filter(Boolean).join('\n\n');
  const userMessage: ChatMessage = {
    id: uid(),
    role: 'user',
    content,
    images: images.length ? images : undefined,
    audio: recorded,
    doc,
    status: 'done',
    createdAt: Date.now(),
  };
  const usable = (contextSince > 0
    ? state.messages.filter(message => (message.createdAt ?? 0) >= contextSince)
    : state.messages).filter(message => !message.viewOnly);
  const history = [...usable, userMessage];

  setState({
    messages: history,
    isStreaming: true,
    error: null,
  });
  saveNow(userMessage);
  void runAgent(config, profile, history, token);
  return { ok: true };
}
/**
 * El turno itera herramientas sin tope: hasta que el modelo responde texto (sin
 * tool calls) o el usuario pulsa Detener.
 */
async function runAgent(
  config: LlmConfig,
  profile: SshProfile,
  history: ChatMessage[],
  token: number,
) {
  // Foreground service + wakelock: sin esto Android congela el proceso al
  // cambiar de app o apagar la pantalla y el turno se queda a medias.
  startKeepAlive();
  try {
    await runAgentLoop(config, profile, history, token);
  }
  finally {
    stopKeepAlive();
  }
}

async function runAgentLoop(
  config: LlmConfig,
  profile: SshProfile,
  history: ChatMessage[],
  token: number,
) {
  const alive = () => token === runToken;
  // .chia vive en el telefono: sin SSH tambien hay skills y memoria. Se
  // sincroniza el indice local para que el modelo pueda listarlas y leerlas
  // con sus tools (el prompt solo lleva las 2 reglas del harness).
  await ensureEnvironment();
  await prepareChia();
  await maybeSyncSkills();
  await maybeSyncMemory();
  if (!alive()) {
    return;
  }
  // El shell solo se conecta si hay VPS configurado; si no, las demas tools
  // (telefono, web) siguen funcionando.
  try {
    await ensureSsh(profile);
  }
  catch {
    // sin conexion: el turno sigue y el modelo vera el error si usa tools del VPS
  }
  // El historial se manda completo salvo que no quepa en la ventana del ultimo
  // turno: ahi se recorta local (FIFO), sin pedir nada al servidor.
  let working = trimHistory(config, history);

  const updateMessage = (id: string, patch: Partial<ChatMessage>) => {
    if (!alive()) {
      return;
    }
    const messages = state.messages.map(message =>
      message.id === id ? { ...message, ...patch } : message,
    );
    setState({ messages });
  };

  const removeMessage = (id: string) => {
    if (!alive()) {
      return;
    }
    setState({
      messages: state.messages.filter(message => message.id !== id),
    });
  };

  const finish = () => {
    if (!alive()) {
      return;
    }
    activeStream = null;
    setState({ isStreaming: false });
  };

  for (;;) {
    if (!alive()) {
      return;
    }

    // Cada vuelta agrega mensajes al historial: se recorta solo si ya no cabe
    // en la ventana del ultimo turno.
    working = trimHistory(config, working);

    // Punto correcto de inyeccion: turno anterior cerrado, antes del request.
    working = injectSteering(working);

    const assistant: ChatMessage = {
      id: uid(),
      role: 'assistant',
      content: '',
      reasoning: '',
      status: 'streaming',
      createdAt: Date.now(),
    };

    setState({ messages: [...state.messages, assistant] });

    let deltaTimer: ReturnType<typeof setTimeout> | null = null;
    let deltaDirty = false;

    /** Vuelca el texto acumulado al estado (y lo encola para SQLite). */
    const publish = () => {
      deltaTimer = null;
      if (!deltaDirty) {
        return;
      }
      deltaDirty = false;
      updateMessage(assistant.id, {
        content: assistant.content,
        reasoning: assistant.reasoning ?? '',
      });
      queueSave(assistant);
    };

    const schedulePublish = () => {
      deltaDirty = true;
      if (!deltaTimer) {
        deltaTimer = setTimeout(publish, DELTA_FLUSH_MS);
      }
    };

    const stopPublish = () => {
      if (deltaTimer) {
        clearTimeout(deltaTimer);
        deltaTimer = null;
      }
      deltaDirty = false;
      publishDeltas = null;
    };
    publishDeltas = publish;

    let turn: AssistantTurn;
    // Tiempo de pared del mensaje: request al modelo + las tools que disparo.
    const requestAt = Date.now();
    try {
      const stream = createChatStream(
        {
          ...config,
          systemPrompt: buildSystemPrompt(config.systemPrompt),
        },
        working,
        {
          onText: (delta) => {
            assistant.content += delta;
            schedulePublish();
          },
          onReasoning: (delta) => {
            assistant.reasoning = `${assistant.reasoning ?? ''}${delta}`;
            schedulePublish();
          },
          onUsage: (usage) => {
            publish();
            assistant.usage = usage;
            updateMessage(assistant.id, { usage });
            queueSave(assistant);
          },
          onToolCall: (call) => {
            publish();
            const calls = assistant.toolCalls ?? [];
            const index = calls.findIndex(item => item.id === call.id);
            assistant.toolCalls
              = index >= 0
                ? calls.map((item, position) => (position === index ? call : item))
                : [...calls, call];
            updateMessage(assistant.id, { toolCalls: [...assistant.toolCalls] });
            queueSave(assistant);
          },
        },
      );
      activeStream = stream;
      turn = await stream.promise;
    }
    catch (error) {
      stopPublish();
      if (!alive()) {
        return;
      }
      activeStream = null;
      const message = error instanceof Error ? error.message : String(error);
      if (assistant.content || assistant.reasoning) {
        updateMessage(assistant.id, { status: 'error', error: message });
        assistant.status = 'error';
        assistant.error = message;
        saveNow(assistant);
      }
      else {
        removeMessage(assistant.id);
        dropPending(assistant.id);
        void deleteMessage(assistant.id);
      }
      setState({ isStreaming: false, error: message });
      return;
    }

    if (!alive()) {
      return;
    }
    stopPublish();
    activeStream = null;

    assistant.content = turn.content;
    assistant.reasoning = turn.reasoning;
    assistant.toolCalls = turn.toolCalls;
    assistant.usage = turn.usage ?? assistant.usage;
    assistant.limits = turn.limits ?? assistant.limits;
    assistant.durationMs = Date.now() - requestAt;
    assistant.status = 'done';
    updateMessage(assistant.id, {
      content: assistant.content,
      reasoning: assistant.reasoning,
      toolCalls: assistant.toolCalls,
      usage: assistant.usage,
      limits: assistant.limits,
      durationMs: assistant.durationMs,
      status: 'done',
    });
    saveNow(assistant);

    if (__DEV__) {
      console.log(
        `[chat] finish=${turn.stopReason ?? '-'} chars=${assistant.content.length} tokens=${turn.usage?.total ?? 0} tools=${assistant.toolCalls.map(call => call.name).join(',') || '-'}`,
      );
    }

    // Stream cerrado sin texto y sin herramientas: antes quedaba una burbuja
    // vacia en pantalla (eso era lo que se veia como "colgada").
    if (!assistant.content && !assistant.reasoning && turn.toolCalls.length === 0) {
      const empty = 'El servidor cerro el turno sin respuesta. Intenta de nuevo.';
      assistant.status = 'error';
      assistant.error = empty;
      updateMessage(assistant.id, { status: 'error', error: empty });
      saveNow(assistant);
      finish();
      setState({ error: empty });
      return;
    }

    if (turn.toolCalls.length === 0) {
      working = [...working, assistant];
      // Sin tool calls: solo aqui tiene sentido un follow-up; antes de cerrar,
      // cualquier steering pendiente tambien se atiende.
      if (followUpQueue.length > 0) {
        steeringQueue.push(...followUpQueue.splice(0, followUpQueue.length));
        syncQueued();
        continue;
      }
      if (steeringQueue.length > 0) {
        continue;
      }
      finish();
      return;
    }

    const toolResults: ChatToolResult[] = [];
    /** Imagenes traidas con `read`: se adjuntan al turno para la vision. */
    const pendingImages: Array<{ path: string; image: ChatImage; viewOnly: boolean }> = [];
    for (const call of turn.toolCalls) {
      if (!alive()) {
        return;
      }
      const command = parseCommand(call.arguments);
      const isWeb = call.name === 'web_fetch';
      const isShell = call.name === 'shell_exec';
      const isRead = call.name === 'read';
      const isEdit = call.name === 'edit';
      const isPhone = call.name === 'android_phone';
      const isWrite = call.name === 'write';
      const isRag = call.name === 'rag';
      if (!isWeb && !isShell && !isRead && !isEdit && !isPhone && !isWrite && !isRag) {
        toolResults.push({
          toolCallId: call.id,
          tool: call.name,
          command: call.name,
          output: `Herramienta desconocida: ${call.name}. Disponibles: read, edit, write, shell_exec, web_fetch, android_phone, rag.`,
          exitCode: 2,
          durationMs: 0,
          isError: true,
        });
        assistant.toolResults = [...toolResults];
        updateMessage(assistant.id, { toolResults: [...toolResults] });
        queueSave(assistant);
        continue;
      }
      // Solo shell_exec exige `command`: read/edit/web_fetch/android_phone traen sus
      // propios campos y sin este `!isEdit` la tool edit moria aqui con
      // "falta el campo command" antes de llegar a su rama.
      if (isShell && !command) {
        toolResults.push({
          toolCallId: call.id,
          tool: call.name,
          command: call.arguments,
          output: 'Argumentos inválidos: falta el campo command.',
          exitCode: 2,
          durationMs: 0,
          isError: true,
        });
        assistant.toolResults = [...toolResults];
        updateMessage(assistant.id, { toolResults: [...toolResults] });
        queueSave(assistant);
        continue;
      }

      if (isWeb) {
        const web = parseWebArgs(call.arguments);
        if (!web) {
          toolResults.push({
            toolCallId: call.id,
            tool: 'web_fetch',
            command: call.arguments,
            output: 'Argumentos inválidos: falta el campo url.',
            exitCode: 2,
            durationMs: 0,
            isError: true,
          });
          assistant.toolResults = [...toolResults];
          updateMessage(assistant.id, { toolResults: [...toolResults] });
          queueSave(assistant);
          continue;
        }

        const webPlaceholder: ChatToolResult = {
          toolCallId: call.id,
          tool: 'web_fetch',
          command: `web_fetch ${web.url}`,
          output: 'descargando...',
          exitCode: -1,
          durationMs: 0,
          isError: false,
        };
        toolResults.push(webPlaceholder);
        assistant.toolResults = [...toolResults];
        updateMessage(assistant.id, { toolResults: [...toolResults] });
        queueSave(assistant);

        const webStarted = Date.now();
        const outcome = await runWebFetch(web);
        if (!alive()) {
          return;
        }
        const webResult: ChatToolResult = {
          toolCallId: call.id,
          tool: 'web_fetch',
          command: `web_fetch ${web.url}`,
          output: outcome.output,
          exitCode: outcome.isError ? 1 : 0,
          durationMs: Date.now() - webStarted,
          isError: outcome.isError,
        };
        const webIndex = toolResults.findIndex(item => item.toolCallId === call.id);
        toolResults[webIndex] = webResult;
        assistant.toolResults = [...toolResults];
        updateMessage(assistant.id, { toolResults: [...toolResults] });
        saveNow(assistant);
        continue;
      }

      if (isRag) {
        const ragPlaceholder: ChatToolResult = {
          toolCallId: call.id,
          tool: 'rag',
          command: 'rag',
          output: 'buscando...',
          exitCode: -1,
          durationMs: 0,
          isError: false,
        };
        toolResults.push(ragPlaceholder);
        assistant.toolResults = [...toolResults];
        updateMessage(assistant.id, { toolResults: [...toolResults] });
        queueSave(assistant);

        const outcome = await runRagTool(call.arguments);
        if (!alive()) {
          return;
        }
        const ragResult: ChatToolResult = {
          toolCallId: call.id,
          tool: 'rag',
          command: outcome.command || 'rag',
          output: outcome.output,
          exitCode: outcome.exitCode,
          durationMs: outcome.durationMs,
          isError: outcome.isError,
        };
        const ragIndex = toolResults.findIndex(item => item.toolCallId === call.id);
        toolResults[ragIndex] = ragResult;
        assistant.toolResults = [...toolResults];
        updateMessage(assistant.id, { toolResults: [...toolResults] });
        saveNow(assistant);
        continue;
      }

      if (isRead) {
        const readArgs = parseReadArgs(call.arguments);
        if (!readArgs) {
          toolResults.push({
            toolCallId: call.id,
            tool: 'read',
            command: call.arguments,
            output: 'Argumentos inválidos: falta path o el target no es vps/phone.',
            exitCode: 2,
            durationMs: 0,
            isError: true,
          });
          assistant.toolResults = [...toolResults];
          updateMessage(assistant.id, { toolResults: [...toolResults] });
          queueSave(assistant);
          continue;
        }

        const readPlaceholder: ChatToolResult = {
          toolCallId: call.id,
          tool: 'read',
          command: readCommand(readArgs),
          output: 'leyendo...',
          exitCode: -1,
          durationMs: 0,
          isError: false,
        };
        toolResults.push(readPlaceholder);
        assistant.toolResults = [...toolResults];
        updateMessage(assistant.id, { toolResults: [...toolResults] });
        queueSave(assistant);

        const outcome = await runReadTool(readArgs, profile);
        if (!alive()) {
          return;
        }
        if (readArgs.path.includes('.chia')) {
          await refreshChia();
        }
        if (outcome.image) {
          pendingImages.push({
            path: readArgs.path,
            image: outcome.image,
            // La hoja de un video ya viene descrita en el tool result: se muestra
            // pero no se vuelve a mandar al modelo en cada turno.
            viewOnly: isVideoPath(readArgs.path),
          });
        }
        const readResult: ChatToolResult = {
          toolCallId: call.id,
          tool: 'read',
          command: readCommand(readArgs),
          output: outcome.output,
          exitCode: outcome.exitCode,
          durationMs: outcome.durationMs,
          isError: outcome.isError,
        };
        const readIndex = toolResults.findIndex(item => item.toolCallId === call.id);
        toolResults[readIndex] = readResult;
        assistant.toolResults = [...toolResults];
        updateMessage(assistant.id, { toolResults: [...toolResults] });
        saveNow(assistant);
        continue;
      }

      if (isEdit) {
        const editArgs = parseEditArgs(call.arguments);
        if (!editArgs) {
          toolResults.push({
            toolCallId: call.id,
            tool: 'edit',
            command: call.arguments,
            output: 'Argumentos inválidos: hacen falta path y edits[] con oldText/newText (target: vps o phone).',
            exitCode: 2,
            durationMs: 0,
            isError: true,
          });
          assistant.toolResults = [...toolResults];
          updateMessage(assistant.id, { toolResults: [...toolResults] });
          queueSave(assistant);
          continue;
        }

        const editPlaceholder: ChatToolResult = {
          toolCallId: call.id,
          tool: 'edit',
          command: editCommand(editArgs),
          output: 'editando...',
          exitCode: -1,
          durationMs: 0,
          isError: false,
        };
        toolResults.push(editPlaceholder);
        assistant.toolResults = [...toolResults];
        updateMessage(assistant.id, { toolResults: [...toolResults] });
        queueSave(assistant);

        const outcome = await runEditTool(editArgs, profile);
        if (!alive()) {
          return;
        }
        // Igual que read: tocar .chia refresca skills/memoria al instante.
        if (editArgs.path.includes('.chia')) {
          await refreshChia();
        }
        const editResult: ChatToolResult = {
          toolCallId: call.id,
          tool: 'edit',
          command: editCommand(editArgs),
          output: outcome.output,
          exitCode: outcome.exitCode,
          durationMs: outcome.durationMs,
          isError: outcome.isError,
        };
        const editIndex = toolResults.findIndex(item => item.toolCallId === call.id);
        toolResults[editIndex] = editResult;
        assistant.toolResults = [...toolResults];
        updateMessage(assistant.id, { toolResults: [...toolResults] });
        saveNow(assistant);
        continue;
      }

      if (isWrite) {
        const writeArgs = parseWriteArgs(call.arguments);
        if (!writeArgs) {
          toolResults.push({
            toolCallId: call.id,
            tool: 'write',
            command: call.arguments,
            output: 'Argumentos inválidos: hacen falta path y content (target: vps o phone).',
            exitCode: 2,
            durationMs: 0,
            isError: true,
          });
          assistant.toolResults = [...toolResults];
          updateMessage(assistant.id, { toolResults: [...toolResults] });
          queueSave(assistant);
          continue;
        }

        const writePlaceholder: ChatToolResult = {
          toolCallId: call.id,
          tool: 'write',
          command: writeCommand(writeArgs),
          output: 'escribiendo...',
          exitCode: -1,
          durationMs: 0,
          isError: false,
        };
        toolResults.push(writePlaceholder);
        assistant.toolResults = [...toolResults];
        updateMessage(assistant.id, { toolResults: [...toolResults] });
        queueSave(assistant);

        const outcome = await runWriteTool(writeArgs, profile);
        if (!alive()) {
          return;
        }
        // Tocar .chia obliga a re-escanear skills/memoria (el sidebar se
        // actualiza en este mismo turno).
        if (writeArgs.path.includes('.chia')) {
          await refreshChia();
        }
        const writeResult: ChatToolResult = {
          toolCallId: call.id,
          tool: 'write',
          command: writeCommand(writeArgs),
          output: outcome.output,
          exitCode: outcome.exitCode,
          durationMs: outcome.durationMs,
          isError: outcome.isError,
        };
        const writeIndex = toolResults.findIndex(item => item.toolCallId === call.id);
        toolResults[writeIndex] = writeResult;
        assistant.toolResults = [...toolResults];
        updateMessage(assistant.id, { toolResults: [...toolResults] });
        saveNow(assistant);
        continue;
      }

      if (isPhone) {
        const phoneArgs = parsePhoneArgs(call.arguments);
        if (!phoneArgs) {
          toolResults.push({
            toolCallId: call.id,
            tool: 'android_phone',
            command: 'android_phone',
            output: 'Argumentos inválidos: hace falta action válida (ver descripción) y args según la acción.',
            exitCode: 2,
            durationMs: 0,
            isError: true,
          });
          assistant.toolResults = [...toolResults];
          updateMessage(assistant.id, { toolResults: [...toolResults] });
          queueSave(assistant);
          continue;
        }

        const phonePlaceholder: ChatToolResult = {
          toolCallId: call.id,
          tool: 'android_phone',
          command: phoneCommand(phoneArgs),
          output: 'ejecutando...',
          exitCode: -1,
          durationMs: 0,
          isError: false,
        };
        toolResults.push(phonePlaceholder);
        assistant.toolResults = [...toolResults];
        updateMessage(assistant.id, { toolResults: [...toolResults] });
        queueSave(assistant);

        const outcome = await runPhoneTool(phoneArgs);
        if (!alive()) {
          return;
        }
        const phoneResult: ChatToolResult = {
          toolCallId: call.id,
          tool: 'android_phone',
          command: phoneCommand(phoneArgs),
          output: outcome.output,
          exitCode: outcome.exitCode,
          durationMs: outcome.durationMs,
          isError: outcome.isError,
        };
        const phoneIndex = toolResults.findIndex(item => item.toolCallId === call.id);
        toolResults[phoneIndex] = phoneResult;
        assistant.toolResults = [...toolResults];
        updateMessage(assistant.id, { toolResults: [...toolResults] });
        saveNow(assistant);
        continue;
      }

      const shellCommand = command as string;
      const placeholder: ChatToolResult = {
        toolCallId: call.id,
        tool: 'shell_exec',
        command: shellCommand,
        output: '',
        exitCode: -1,
        durationMs: 0,
        isError: false,
      };
      toolResults.push(placeholder);
      assistant.toolResults = [...toolResults];
      updateMessage(assistant.id, { toolResults: [...toolResults] });
      queueSave(assistant);

      const result = await runShellTool(shellCommand, profile, (chunk) => {
        placeholder.output += chunk;
        assistant.toolResults = [...toolResults];
        updateMessage(assistant.id, { toolResults: [...toolResults] });
        queueSave(assistant);
      });
      if (!alive()) {
        return;
      }
      result.toolCallId = call.id;
      result.tool = 'shell_exec';
      result.command = shellCommand;
      // Si el turno toco .chia, el proximo prompt re-escanea las skills.
      if (shellCommand.includes('.chia')) {
        void refreshChia();
      }
      const index = toolResults.findIndex(item => item.toolCallId === call.id);
      toolResults[index] = result;
      assistant.toolResults = [...toolResults];
      updateMessage(assistant.id, { toolResults: [...toolResults] });
      saveNow(assistant);
    }

    // Nada se recorta: la salida de cualquier tool que pase `maxChars` se guarda
    // completa en `.chia/tmp` y al modelo le llega la ruta para leerla por partes.
    // `read` queda fuera: ya pagina el archivo original, copiarlo seria un bucle.
    for (let index = 0; index < toolResults.length; index += 1) {
      const item = toolResults[index];
      if (item.tool === 'read') {
        continue;
      }
      const output = await spillLongOutput(item.output);
      if (output !== item.output) {
        toolResults[index] = { ...item, output };
        assistant.toolResults = [...toolResults];
        updateMessage(assistant.id, { toolResults: [...toolResults] });
      }
    }

    assistant.toolResults = toolResults;
    assistant.status = 'done';
    assistant.durationMs = Date.now() - requestAt;
    updateMessage(assistant.id, {
      toolResults,
      durationMs: assistant.durationMs,
      status: 'done',
    });
    saveNow(assistant);
    working = [...working, assistant];

    // Las imagenes de `read` viajan como mensaje del usuario: los tool results
    // son texto y la vision del proveedor solo acepta imagenes en ese rol.
    for (const item of pendingImages) {
      const imageMessage: ChatMessage = {
        id: uid(),
        role: 'user',
        content: `[read] ${item.path.split('/').pop() || item.path}`,
        images: [item.image],
        status: 'done',
        createdAt: Date.now(),
        viewOnly: item.viewOnly || undefined,
      };
      saveNow(imageMessage);
      working = [...working, imageMessage];
      setState({ messages: [...state.messages, imageMessage] });
    }
  }
}

export function stop() {
  // Publicar antes de invalidar el turno: si no, se pierde el ultimo trozo.
  publishDeltas?.();
  runToken += 1;
  stopKeepAlive();
  activeStream?.abort();
  activeStream = null;
  void interruptSsh().catch(() => {});
  // La cola se conserva: el usuario escribio esos prompts y siguen pendientes.
  const messages = state.messages;
  const last = messages[messages.length - 1];
  if (last?.role === 'assistant') {
    saveNow({ ...last, status: 'done' });
  }
  flushHistory();
  setState({ isStreaming: false, error: null });
}

/**
 * Reenvia el turno que fallo: borra el mensaje con el error y el prompt que lo
 * origino, y lo vuelve a mandar tal cual (texto, imagenes, audio o documento).
 */
export async function retry(messageId: string): Promise<SendResult> {
  if (state.isStreaming) {
    return { ok: false };
  }
  const index = state.messages.findIndex(message => message.id === messageId);
  const failed = index >= 0 ? state.messages[index] : null;
  if (!failed || failed.role !== 'assistant' || failed.status !== 'error') {
    return { ok: false };
  }
  let userIndex = index - 1;
  while (userIndex >= 0 && state.messages[userIndex].role !== 'user') {
    userIndex -= 1;
  }
  const prompt = userIndex >= 0 ? state.messages[userIndex] : null;
  const drop = new Set([failed.id, prompt?.id ?? '']);
  setState({
    messages: state.messages.filter(message => !drop.has(message.id)),
    error: null,
    isStreaming: false,
  });
  for (const id of drop) {
    dropPending(id);
    void deleteMessage(id);
  }
  return prompt ? send(prompt.content, prompt.images ?? [], prompt.audio, prompt.doc) : { ok: false };
}

export function clear() {
  runToken += 1;
  stopKeepAlive();
  activeStream?.abort();
  activeStream = null;
  void interruptSsh().catch(() => {});
  lastFingerprint = settingsFingerprint();
  contextSince = 0;
  dropPending();
  steeringQueue.length = 0;
  followUpQueue.length = 0;
  queuedLabels.clear();
  setState({ messages: [], isStreaming: false, error: null, queued: [] });
  void clearMessages();
}
