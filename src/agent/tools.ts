export type ToolInfo = {
  name: string;
  label: string;
};

export const TOOL_REGISTRY: ToolInfo[] = [
  { name: 'read', label: 'leer archivo' },
  { name: 'edit', label: 'editar archivo' },
  { name: 'write', label: 'escribir archivo' },
  { name: 'shell_exec', label: 'shell remota' },
  { name: 'web_fetch', label: 'web fetch' },
  { name: 'android_phone', label: 'telefono' },
  { name: 'rag', label: 'memoria rag' },
];

export function isKnownTool(name: string): boolean {
  return TOOL_REGISTRY.some(tool => tool.name === name);
}

const TOOL_ALIASES: Record<string, string> = {
  phone: 'android_phone',
};

export function canonicalToolName(name: string): string | null {
  const key = (name ?? '').trim().toLowerCase();
  if (!key) {
    return null;
  }
  const mapped = TOOL_ALIASES[key] ?? key;
  return isKnownTool(mapped) ? mapped : null;
}
