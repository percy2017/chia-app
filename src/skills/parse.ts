import type { SkillRecord } from './types';

export const MAX_NAME_LENGTH = 64;
export const MAX_DESCRIPTION_LENGTH = 1024;

export type ParsedSkillFile = {
  name: string;
  description: string;
  body: string;
  hidden: boolean;
  warnings: string[];
};

export function parseFrontmatter(raw: string): { data: Record<string, string>; body: string } | null {
  const normalized = raw.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
  if (!normalized.startsWith('---')) {
    return null;
  }
  const end = normalized.indexOf('\n---', 3);
  if (end === -1) {
    return null;
  }
  const header = normalized.slice(3, end).trim();
  const body = normalized.slice(normalized.indexOf('\n', end + 1) + 1);

  const data: Record<string, string> = {};
  const lines = header.split('\n');
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const match = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (!match) {
      continue;
    }
    const key = match[1];
    let value = match[2].trim();

    if (value === '>' || value === '|' || value === '>-' || value === '|-') {
      const chunk: string[] = [];
      while (index + 1 < lines.length && /^\s+\S/.test(lines[index + 1])) {
        index += 1;
        chunk.push(lines[index].trim());
      }
      value = value.startsWith('>') ? chunk.join(' ') : chunk.join('\n');
    }
    else if (
      (value.startsWith('"') && value.endsWith('"') && value.length > 1)
      || (value.startsWith("'") && value.endsWith("'") && value.length > 1)
    ) {
      value = value.slice(1, -1);
    }
    data[key] = value;
  }
  return { data, body };
}

export function validateName(name: string): string[] {
  const errors: string[] = [];
  if (name.length > MAX_NAME_LENGTH) {
    errors.push(`name exceeds ${MAX_NAME_LENGTH} characters`);
  }
  if (!/^[a-z0-9-]+$/.test(name)) {
    errors.push('name contains invalid characters (a-z, 0-9, hyphens)');
  }
  if (name.startsWith('-') || name.endsWith('-')) {
    errors.push('name must not start or end with a hyphen');
  }
  if (name.includes('--')) {
    errors.push('name must not contain consecutive hyphens');
  }
  return errors;
}

export function validateDescription(description: string): string[] {
  if (!description.trim()) {
    return ['description is required'];
  }
  if (description.length > MAX_DESCRIPTION_LENGTH) {
    return [`description exceeds ${MAX_DESCRIPTION_LENGTH} characters`];
  }
  return [];
}


export function parseSkillFile(raw: string): ParsedSkillFile | null {
  const parsed = parseFrontmatter(raw);
  if (!parsed) {
    return null;
  }
  const description = (parsed.data.description ?? '').trim();
  const name = (parsed.data.name ?? '').trim();
  if (!description) {
    return null;
  }
  const warnings = [
    ...(name ? validateName(name) : ['name missing in frontmatter']),
    ...validateDescription(description),
  ];
  const hidden = `${parsed.data['disable-model-invocation'] ?? ''}`.toLowerCase() === 'true';
  return { name, description, body: parsed.body.trim(), hidden, warnings };
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}


function clip(value: string, max: number): string {
  return value.length <= max ? value : `${value.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}


export function formatSkillsForPrompt(
  skills: SkillRecord[],
  budget = Number.POSITIVE_INFINITY,
): string {
  const visible = skills.filter(skill => !skill.hidden);
  if (visible.length === 0) {
    return '';
  }
  const header = 'Skills (carga con read cuando la tarea coincida con la description):';
  const build = (list: SkillRecord[], descCap: number) => {
    const lines = [header, '<available_skills>'];
    for (const skill of list) {
      lines.push('  <skill>');
      lines.push(`    <name>${escapeXml(skill.name)}</name>`);
      lines.push(`    <description>${escapeXml(clip(skill.description, descCap))}</description>`);
      lines.push(`    <location>${escapeXml(skill.path)}</location>`);
      lines.push('  </skill>');
    }
    if (list.length < visible.length) {
      lines.push(`  <omitted count="${visible.length - list.length}"/>`);
    }
    lines.push('</available_skills>');
    return lines.join('\n');
  };
  for (const cap of [260, 180, 120, 64]) {
    const text = build(visible, cap);
    if (text.length <= budget) {
      return text;
    }
  }
  let count = visible.length;
  while (count > 0 && build(visible.slice(0, count), 64).length > budget) {
    count -= 1;
  }
  return count === 0 ? '' : build(visible.slice(0, count), 64);
}

export function formatSkillCommand(skill: SkillRecord, args: string): string {
  const parsed = parseSkillFile(skill.content);
  const body = parsed ? parsed.body : skill.content;
  const block = `<skill name="${skill.name}" location="${skill.path}">\nReferences are relative to ${skill.baseDir}.\n\n${body}\n</skill>`;
  return args.trim() ? `${block}\n\n${args.trim()}` : block;
}

export function parseMemoryFile(
  raw: string,
  fileName: string,
): { name: string; description: string; body: string } {
  const name = fileName.replace(/.md$/i, '').trim();
  const parsed = parseFrontmatter(raw);
  if (!parsed) {
    return { name, description: '', body: raw.trim() };
  }
  return {
    name,
    description: (parsed.data.description ?? '').trim(),
    body: parsed.body.trim(),
  };
}
