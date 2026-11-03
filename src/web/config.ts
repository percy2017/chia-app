import { getToolsConfig } from '../settings/store';

export function webConfig() {
  const tools = getToolsConfig();
  return {
    findChars: tools.maxChars,
    timeoutMs: tools.maxTimeMs,
    maxChars: tools.maxChars,
  };
}
