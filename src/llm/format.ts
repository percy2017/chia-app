import type { ChatDoc, ChatToolResult } from './types';

import { getToolsConfig } from '../settings/store';

export function docNotice(doc?: ChatDoc): string {
  if (!doc) {
    return '';
  }
  const pages = doc.pages > 0 ? `, ${doc.pages} paginas` : '';
  return `[${doc.name} registrado en la memoria rag: ${doc.chunks} fragmentos${pages}. `
    + 'Usa la tool rag (action search) para consultarlo.]';
}

export function formatToolResult(result: ChatToolResult): string {
  const lines = [
    ...(result.tool ? [`tool: ${result.tool}`] : []),
    `exit_code: ${result.exitCode}`,
    `is_error: ${result.isError ? 'true' : 'false'}`,
    `duration_ms: ${result.durationMs}`,
  ];
  if (result.timedOut) {
    lines.push('timed_out: true (el comando se corto por timeout del sistema; las tools no tienen tope de tiempo)');
  }
  if (!result.output.trim()) {
    lines.push('output: (vacio)');
    if (result.isError) {
      lines.push('nota: el comando termino con error y no escribio nada.');
    }
  }
  else {
    lines.push('output:');
    lines.push(result.output);
  }
  return lines.join('\n');
}
