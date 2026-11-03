import type {
  LlmLimits,
  AssistantTurn,
  ChatMessage,
  ChatStream,
  ChatToolCall,
  LlmConfig,
  StreamCallbacks,
  TokenUsage,
} from './types';

import { docNotice, formatToolResult } from './format';
import {
  editToolDescription,
  phoneToolDescription,
  ragToolDescription,
  readToolDescription,
  shellToolDescription,
  writeToolDescription,
  webFetchToolDescription,
} from './prompt';
import { chatErrorMessage, errorFromBody, streamSse } from './sse';

type OpenAiContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } };

type OpenAiMessage =
  | { role: 'system'; content: string }
  | { role: 'user'; content: string | OpenAiContentPart[] }
  | {
    role: 'assistant';
    content: string | null;
    reasoning_content?: string;
    tool_calls?: {
      id: string;
      type: 'function';
      function: { name: string; arguments: string };
    }[];
  }
  | { role: 'tool'; tool_call_id: string; content: string };

type OpenAiAssistantMessage = Extract<OpenAiMessage, { role: 'assistant' }>;

function dataUrl(mimeType: string, data: string): string {
  return `data:${mimeType};base64,${data}`;
}

function userContent(message: ChatMessage): string | OpenAiContentPart[] {
  const body = [docNotice(message.doc), message.content].filter(Boolean).join('\n\n');
  if (!message.images?.length) {
    return body;
  }
  const parts: OpenAiContentPart[] = [];
  if (body.trim()) {
    parts.push({ type: 'text', text: body });
  }
  else {
    parts.push({ type: 'text', text: 'Analiza la imagen adjunta.' });
  }
  for (const image of message.images) {
    parts.push({
      type: 'image_url',
      image_url: { url: dataUrl(image.mimeType, image.data) },
    });
  }
  return parts;
}

function buildWire(
  config: LlmConfig,
  messages: ChatMessage[],
): { wire: OpenAiMessage[]; owner: number[] } {
  const wire: OpenAiMessage[] = [
    { role: 'system', content: config.systemPrompt },
  ];
  const owner: number[] = [null as unknown as number];
  const push = (message: OpenAiMessage, source: number) => {
    wire.push(message);
    owner.push(source);
  };

  for (let index = 0; index < messages.length; index += 1) {
    const message = messages[index];
    if (message.status === 'error' && !message.content) {
      continue;
    }

    if (message.role === 'user') {
      push({ role: 'user', content: userContent(message) }, index);
      continue;
    }

    if (!message.content && !message.toolCalls?.length) {
      continue;
    }

    if (!message.toolCalls?.length) {
      const assistant: OpenAiAssistantMessage = {
        role: 'assistant',
        content: message.content || null,
      };
      if (message.reasoning) {
        assistant.reasoning_content = message.reasoning;
      }
      push(assistant, index);
      continue;
    }

    const assistantCall: OpenAiAssistantMessage = {
      role: 'assistant',
      content: message.content || null,
      tool_calls: message.toolCalls.map(call => ({
        id: call.id,
        type: 'function',
        function: { name: call.name, arguments: call.arguments },
      })),
    };
    if (message.reasoning) {
      assistantCall.reasoning_content = message.reasoning;
    }
    push(assistantCall, index);

    for (const call of message.toolCalls) {
      const result = message.toolResults?.find(
        item => item.toolCallId === call.id,
      );
      push({
        role: 'tool',
        tool_call_id: call.id,
        content: result
          ? formatToolResult(result)
          : 'exit_code: 1\nis_error: true\nduration_ms: 0\noutput: (vacio)\nnota: la ejecucion se interrumpio antes de terminar.',
      }, index);
    }
  }

  return { wire, owner };
}

function buildMessages(
  config: LlmConfig,
  messages: ChatMessage[],
): OpenAiMessage[] {
  return buildWire(config, messages).wire;
}

function readDefinition() {
  return {
    type: 'function',
    function: {
      name: 'read',
      description: readToolDescription(),
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Ruta del archivo (relativa o absoluta).',
          },
          target: {
            type: 'string',
            enum: ['vps', 'phone'],
            description: 'vps (defecto) = servidor remoto; phone = almacenamiento del telefono.',
          },
          offset: {
            type: 'integer',
            minimum: 1,
            description: 'Linea inicial (1-indexed).',
          },
          limit: {
            type: 'integer',
            minimum: 1,
            description: 'Maximo de lineas.',
          },
        },
        required: ['path'],
      },
    },
  };
}

function toolDefinition() {
  return {
    type: 'function',
    function: {
      name: 'shell_exec',
      description: shellToolDescription(),
      parameters: {
        type: 'object',
        properties: {
          command: {
            type: 'string',
            description: 'Comando POSIX.',
          },
        },
        required: ['command'],
        additionalProperties: false,
      },
    },
  };
}

function writeDefinition() {
  return {
    type: 'function',
    function: {
      name: 'write',
      description: writeToolDescription(),
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Ruta del archivo (relativa o absoluta).',
          },
          content: {
            type: 'string',
            description: 'Contenido completo del archivo (pisa lo que hubiera).',
          },
          target: {
            type: 'string',
            enum: ['vps', 'phone'],
            description: 'vps (defecto) = servidor remoto; phone = almacenamiento del telefono.',
          },
        },
        required: ['path', 'content'],
        additionalProperties: false,
      },
    },
  };
}

function editDefinition() {
  return {
    type: 'function',
    function: {
      name: 'edit',
      description: editToolDescription(),
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string' },
          target: { type: 'string', enum: ['vps', 'phone'] },
          edits: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                oldText: { type: 'string' },
                newText: { type: 'string' },
              },
              required: ['oldText', 'newText'],
            },
          },
        },
        required: ['path', 'edits'],
      },
    },
  };
}

function webFetchDefinition() {
  return {
    type: 'function',
    function: {
      name: 'web_fetch',
      description: webFetchToolDescription(),
      parameters: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'URL http(s) absoluta.',
          },
          mode: {
            type: 'string',
            enum: ['texto', 'raw'],
            description: 'texto (defecto) o raw.',
          },
          offset: {
            type: 'integer',
            minimum: 0,
            description: 'Caracter inicial.',
          },
          find: {
            type: 'string',
            maxLength: 200,
            description: 'Solo pasajes con este texto.',
          },
        },
        required: ['url'],
        additionalProperties: false,
      },
    },
  };
}


function ragDefinition() {
  return {
    type: 'function',
    function: {
      name: 'rag',
      description: ragToolDescription(),
      parameters: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['index', 'search', 'list', 'read', 'forget'],
            description: 'index (indexar archivo o URL), search (buscar), list (documentos), read (leer por partes), forget (borrar).',
          },
          query: {
            type: 'string',
            description: 'Texto a buscar. Obligatorio en search.',
          },
          doc: {
            type: 'string',
            description: 'Documento: nombre, parte del nombre o id. Opcional en search, obligatorio en read/forget.',
          },
          path: {
            type: 'string',
            description: 'Ruta del archivo en el telefono (por ejemplo /sdcard/Download/x.pdf). En index, si no hay url.',
          },
          url: {
            type: 'string',
            description: 'URL http(s) del archivo a indexar (se descarga). En index, si no hay path.',
          },
          name: {
            type: 'string',
            description: 'Nombre con el que guardar el documento (defecto: el del archivo o la URL).',
          },
          from: {
            type: 'integer',
            minimum: 0,
            description: 'Fragmento inicial en read (defecto 0).',
          },
          limit: {
            type: 'integer',
            minimum: 1,
            maximum: 20,
            description: 'Cuantos fragmentos devolver (defecto search 6, read 30).',
          },
        },
        required: ['action'],
      },
    },
  };
}

function phoneDefinition() {
  return {
    type: 'function',
    function: {
      name: 'android_phone',
      description: phoneToolDescription(),
      parameters: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            description: 'Accion (lista arriba).',
          },
          args: {
            type: 'object',
            description: 'Argumentos de la accion.',
          },
        },
        required: ['action'],
        additionalProperties: false,
      },
    },
  };
}

function toolDefinitions() {
  return [
    readDefinition(),
    editDefinition(),
    writeDefinition(),
    toolDefinition(),
    webFetchDefinition(),
    phoneDefinition(),
    ragDefinition(),
  ];
}

function chatUrl(config: LlmConfig): string {
  const base = config.baseUrl
    .trim()
    .replace(/\/+$/, '')
    .replace(/\/v1$/i, '')
    .replace(/\/+$/, '');
  return /\/chat$/i.test(base) ? base : `${base}/chat`;
}

const CHARS_PER_TOKEN = 3.5;
const DEFAULT_INPUT_BUDGET = 32000;
const SAFETY = 0.85;
const TOOLS_TOKENS = 1200;
const IMAGE_TOKENS = 1200;

function textTokens(chars: number): number {
  return Math.ceil(chars / CHARS_PER_TOKEN) + 4;
}

function messageTokens(message: ChatMessage): number {
  let chars = (message.content?.length ?? 0) + (message.reasoning?.length ?? 0);
  for (const call of message.toolCalls ?? []) {
    chars += call.name.length + call.arguments.length;
  }
  for (const result of message.toolResults ?? []) {
    chars += result.command.length + result.output.length;
  }
  return textTokens(chars) + (message.images?.length ?? 0) * IMAGE_TOKENS;
}

export function inputBudget(messages: ChatMessage[]): number {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const limits = messages[index].limits;
    if (limits && limits.contextWindow > 0) {
      const room = limits.contextWindow - Math.max(limits.maxTokens, 0);
      return Math.max(Math.floor(room * SAFETY), 2000);
    }
  }
  return DEFAULT_INPUT_BUDGET;
}

export function trimHistory(
  config: LlmConfig,
  messages: ChatMessage[],
): ChatMessage[] {
  if (messages.length <= 1) {
    return messages;
  }
  const budget = inputBudget(messages);
  let used = TOOLS_TOKENS + textTokens(config.systemPrompt.length);
  const keep: ChatMessage[] = [];
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const cost = messageTokens(messages[index]);
    if (used + cost > budget && keep.length > 0) {
      break;
    }
    used += cost;
    keep.unshift(messages[index]);
  }
  return keep.length === messages.length ? messages : keep;
}

export type StreamOptions = {
  toolChoice?: 'auto' | 'none';
  noTools?: boolean;
};

export function createStudioStream(
  config: LlmConfig,
  messages: ChatMessage[],
  callbacks: StreamCallbacks,
  options: StreamOptions = {},
): ChatStream {
  let content = '';
  let reasoning = '';
  let stopReason: string | undefined;
  let usage: TokenUsage | undefined;
  let limits: LlmLimits | undefined;
  const calls = new Map<
    number,
    { id: string; name: string; arguments: string }
  >();
  let settled = false;
  let resolvePromise: (turn: AssistantTurn) => void = () => {};
  let rejectPromise: (error: Error) => void = () => {};
  let sseAbort: (() => void) | null = null;

  const promise = new Promise<AssistantTurn>((resolve, reject) => {
    resolvePromise = resolve;
    rejectPromise = reject;
  });

  const succeed = () => {
    if (settled) {
      return;
    }
    settled = true;
    const toolCalls: ChatToolCall[] = [...calls.entries()]
      .sort(([a], [b]) => a - b)
      .map(([index, call]) => ({
        id: call.id || `call_${index}_${Date.now().toString(36)}`,
        name: call.name,
        arguments: call.arguments,
      }))
      .filter(call => call.name !== '');
    if (toolCalls.length === 0 && content.includes('DSML')) {
      content = '';
    }
    resolvePromise({
      content,
      reasoning,
      toolCalls,
      stopReason,
      usage,
      limits,
    });
  };

  const fail = (message: string) => {
    if (settled) {
      return;
    }
    settled = true;
    rejectPromise(new Error(message));
  };

  const body: Record<string, unknown> = {
    messages: buildMessages(config, messages),
    stream: true,
    stream_options: { include_usage: true },
  };
  if (!options.noTools) {
    body.tools = toolDefinitions();
    body.tool_choice = options.toolChoice ?? 'auto';
  }

  const url = chatUrl(config);

  const sse = streamSse({
    url,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
      'Authorization': `Bearer ${config.token}`,
    },
    body,
    onEvent: (event) => {
      if (__DEV__) {
        console.log('[sse]', event.data.slice(0, 400));
      }
      if (event.data === '[DONE]') {
        succeed();
        sseAbort?.();
        return;
      }

      let parsed: {
        error?: unknown;
        choices?: {
          delta?: {
            content?: string | null;
            reasoning_content?: string | null;
            reasoning?: string | null;
            tool_calls?: {
              index?: number;
              id?: string;
              function?: { name?: string; arguments?: string };
            }[];
          };
          finish_reason?: string | null;
        }[];
        usage?: {
          prompt_tokens?: number;
          completion_tokens?: number;
          total_tokens?: number;
          prompt_cache_hit_tokens?: number;
          cached_tokens?: number;
          prompt_tokens_details?: {
            cached_tokens?: number;
            cache_write_tokens?: number;
          };
        } | null;
        limits?: {
          proveedor?: string;
          modelo?: string;
          context_window?: number;
          max_tokens?: number;
          tokens_entrada?: number;
          tokens_salida?: number;
          tokens_total?: number;
          tokens_libres?: number;
          estimado?: boolean;
        } | null;
      };

      try {
        parsed = JSON.parse(event.data);
      }
      catch {
        return;
      }

      if (parsed.error !== undefined && parsed.error !== null) {
        const info = errorFromBody({ error: parsed.error });
        const raw = parsed.error as { message?: unknown } | undefined;
        const detail = info.detail
          || (raw && typeof raw.message === 'string' ? raw.message : '');
        if (__DEV__) {
          console.log('[sse] error', info.status, detail);
        }
        fail(chatErrorMessage(info.status, detail));
        sseAbort?.();
        return;
      }

      if (parsed.usage) {
        const rawUsage = parsed.usage;
        const cacheRead = rawUsage.prompt_tokens_details?.cached_tokens
          ?? rawUsage.prompt_cache_hit_tokens
          ?? rawUsage.cached_tokens
          ?? 0;
        const cacheWrite = rawUsage.prompt_tokens_details?.cache_write_tokens ?? 0;
        const promptTokens = rawUsage.prompt_tokens ?? 0;
        usage = {
          input: Math.max(0, promptTokens - cacheRead - cacheWrite),
          output: rawUsage.completion_tokens ?? 0,
          cacheRead,
          cacheWrite,
          total: rawUsage.total_tokens ?? (promptTokens + (rawUsage.completion_tokens ?? 0)),
        };
        callbacks.onUsage?.(usage);
      }

      if (parsed.limits) {
        const raw = parsed.limits;
        limits = {
          proveedor: String(raw.proveedor ?? ''),
          modelo: String(raw.modelo ?? ''),
          contextWindow: raw.context_window ?? 0,
          maxTokens: raw.max_tokens ?? 0,
          tokensInput: raw.tokens_entrada ?? 0,
          tokensOutput: raw.tokens_salida ?? 0,
          tokensTotal: raw.tokens_total ?? 0,
          tokensFree: raw.tokens_libres ?? 0,
          estimado: raw.estimado === true,
        };
        callbacks.onLimits?.(limits);
      }

      const choice = parsed.choices?.[0];
      if (!choice) {
        return;
      }
      if (choice.finish_reason) {
        stopReason = choice.finish_reason;
        if (__DEV__) {
          console.log('[sse] finish_reason', choice.finish_reason);
        }
      }

      const delta = choice.delta;
      if (!delta) {
        return;
      }

      if (delta.content) {
        content += delta.content;
        callbacks.onText(delta.content);
      }

      const reasoningDelta = delta.reasoning_content ?? delta.reasoning;
      if (reasoningDelta) {
        reasoning += reasoningDelta;
        callbacks.onReasoning(reasoningDelta);
      }

      for (const toolCall of delta.tool_calls ?? []) {
        const index = toolCall.index ?? calls.size;
        const current = calls.get(index) ?? {
          id: toolCall.id ?? `call_${index}_${Date.now().toString(36)}`,
          name: toolCall.function?.name ?? '',
          arguments: '',
        };
        if (toolCall.id) {
          current.id = toolCall.id;
        }
        if (toolCall.function?.name) {
          current.name = toolCall.function.name;
        }
        if (toolCall.function?.arguments) {
          current.arguments += toolCall.function.arguments;
        }
        calls.set(index, current);
        callbacks.onToolCall?.({ ...current });
      }
    },
    onError: fail,
    onDone: () => {
      succeed();
    },
  });

  sseAbort = sse.abort;

  return {
    promise,
    abort: () => {
      sse.abort();
      succeed();
    },
  };
}

