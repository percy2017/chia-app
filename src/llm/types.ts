export type TokenUsage = {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
  total: number;
};

export type LlmLimits = {
  proveedor: string;
  modelo: string;
  contextWindow: number;
  maxTokens: number;
  tokensInput: number;
  tokensOutput: number;
  tokensTotal: number;
  tokensFree: number;
  estimado: boolean;
};

export type ChatImage = {
  mimeType: string;
  data: string;
  width?: number;
  height?: number;
};

export type ChatAudio = {
  path: string;
  durationMs: number;
  bytes: number;
  mime: string;
  transcript?: string;
};

export type ChatDoc = {
  id: string;
  name: string;
  path: string;
  chunks: number;
  pages: number;
};

export type ChatToolCall = {
  id: string;
  name: string;
  arguments: string;
};

export type ChatToolResult = {
  toolCallId: string;
  tool?: string;
  command: string;
  output: string;
  exitCode: number;
  durationMs: number;
  isError: boolean;
  timedOut?: boolean;
};

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  images?: ChatImage[];
  audio?: ChatAudio;
  doc?: ChatDoc;
  reasoning?: string;
  toolCalls?: ChatToolCall[];
  toolResults?: ChatToolResult[];
  status: 'streaming' | 'done' | 'error';
  createdAt?: number;
  error?: string;
  usage?: TokenUsage;
  limits?: LlmLimits;
  durationMs?: number;
  kind?: 'summary';
};

/** Config del unico proveedor: el Studio API del servidor. */
export type LlmConfig = {
  /** Base del servidor (`https://studio.percyalvarez.lat`). */
  baseUrl: string;
  /** Token del usuario: autentica chat, voz y rag. */
  token: string;
  systemPrompt: string;
};

export type AssistantTurn = {
  content: string;
  reasoning: string;
  toolCalls: ChatToolCall[];
  stopReason?: string;
  usage?: TokenUsage;
  limits?: LlmLimits;
};

export type StreamCallbacks = {
  onText: (delta: string) => void;
  onReasoning: (delta: string) => void;
  onToolCall?: (call: ChatToolCall) => void;
  onUsage?: (usage: TokenUsage) => void;
  onLimits?: (limits: LlmLimits) => void;
};

export type StreamHandle = {
  abort: () => void;
};

export type ChatStream = {
  promise: Promise<AssistantTurn>;
  abort: () => void;
};
