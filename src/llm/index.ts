import type {
  AssistantTurn,
  ChatMessage,
  ChatStream,
  LlmConfig,
  StreamCallbacks,
} from './types';

import { createStudioStream } from './studio';
import type { StreamOptions } from './studio';

export * from './format';
export * from './prompt';
export * from './studio';
export * from './types';

export function createChatStream(
  config: LlmConfig,
  messages: ChatMessage[],
  callbacks: StreamCallbacks,
  options: StreamOptions = {},
): ChatStream {
  return createStudioStream(config, messages, callbacks, options);
}

export type { AssistantTurn };
