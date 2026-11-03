import type { TokenUsage } from '../llm/types';

/** Tokens que el servidor reporto en el `usage` del ultimo evento. */
export function usageTokens(usage: TokenUsage): number {
  return usage.total > 0
    ? usage.total
    : usage.input + usage.output + usage.cacheRead + usage.cacheWrite;
}

/** Formato corto para la UI: 1234 -> 1.2k, 1050000 -> 1.1M. */
export function formatTokens(value: number): string {
  if (!Number.isFinite(value) || value <= 0) {
    return '0';
  }
  if (value < 1000) {
    return String(Math.round(value));
  }
  if (value < 1_000_000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  return `${(value / 1_000_000).toFixed(2)}M`;
}
