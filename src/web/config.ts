import { getToolsConfig } from '../settings/store';

export function webConfig() {
  const tools = getToolsConfig();
  // Margen para la cabecera (url/status/truncated) y la nota de paginacion:
  // el resultado tiene que entrar en `maxChars` o se iria a un archivo .txt.
  const maxChars = Math.max(200, tools.maxChars - 240);
  return {
    findChars: maxChars,
    timeoutMs: tools.maxTimeMs,
    maxChars,
  };
}
