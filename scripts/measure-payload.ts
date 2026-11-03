// @ts-nocheck
/**
 * Mide lo que se envia al proveedor con un chat vacio y el mensaje "hola".
 * Uso: node scripts/measure-payload.ts
 */
import fs from 'node:fs';

const seed = fs.readFileSync('src/settings/seed.ts', 'utf8');
const promptSrc = fs.readFileSync('src/llm/prompt.ts', 'utf8');
const openaiSrc = fs.readFileSync('src/llm/openai.ts', 'utf8');
const anthropicSrc = fs.readFileSync('src/llm/anthropic.ts', 'utf8');
const skillsDefaults = fs.readFileSync('src/skills/defaults.ts', 'utf8');
const memoryDefaults = fs.readFileSync('src/memory/defaults.ts', 'utf8');

function seedNum(key: string): number {
  const m = new RegExp(`'${key}':\\s*([\\d.]+)`).exec(seed);
  return m ? Number(m[1]) : 0;
}
function seedStr(key: string): string {
  const m = new RegExp(`'${key}':\\s*'([^']*)'`).exec(seed);
  return m ? m[1] : '';
}

const tools = {
  maxChars: seedNum('tools.maxChars'),
  maxTimeSec: seedNum('tools.maxTimeSec'),
  maxBytesMb: seedNum('tools.maxBytesMb'),
  maxTimeMs: seedNum('tools.maxTimeSec') * 1000,
  readMaxLines: seedNum('tools.readMaxLines'),
  readMaxKb: seedNum('tools.readMaxKb'),
  readImageMaxMb: seedNum('tools.readImageMaxMb'),
};
const basePrompt = seedStr('llm.systemPrompt');

function extractFn(src: string, name: string): string {
  const start = src.indexOf(`function ${name}(`);
  const open = src.indexOf('{', start);
  let depth = 0;
  for (let i = open; i < src.length; i += 1) {
    if (src[i] === '{') depth += 1;
    else if (src[i] === '}') {
      depth -= 1;
      if (depth === 0) {
        return src.slice(start, i + 1);
      }
    }
  }
  throw new Error(`no fn ${name}`);
}

function evalDesc(src: string, name: string): string {
  const body = extractFn(src, name).replace(/\)\s*:\s*string\s*\{/, ') {');
  const fn = new Function(
    'getToolsConfig',
    'readToolDescription',
    'shellToolDescription',
    'webFetchToolDescription',
    `${body}; return ${name}();`,
  );
  return fn(() => tools, descStub.read, descStub.shell, descStub.web);
}

const descStub: Record<string, string> = { read: '', shell: '', web: '' };
descStub.read = evalDesc(promptSrc, 'readToolDescription');
descStub.shell = evalDesc(promptSrc, 'shellToolDescription');
descStub.web = evalDesc(promptSrc, 'webFetchToolDescription');

// --- skills / memoria reales (mismo contenido que se instala en el VPS) ---
const { parseSkillFile, formatSkillsForPrompt, formatMemoryForPrompt } = await import(
  '../src/skills/parse.ts'
);
const { harnessRules, fitHarness, composeSystemPrompt } = await import('../src/llm/harness.ts');

const skillSd = /const SKILL_CREATOR = `([\s\S]*?)`;\n/.exec(skillsDefaults);
const skillRaw = eval('`' + skillSd![1] + '`');
const parsedSkill = parseSkillFile(skillRaw)!;
const skillRecord = {
  name: parsedSkill.name,
  description: parsedSkill.description,
  path: '/var/customers/webs/percyalvarez/.chia/skills/skill-creator/SKILL.md',
  baseDir: '/var/customers/webs/percyalvarez/.chia/skills/skill-creator',
  hidden: false,
  content: skillRaw,
  syncedAt: 0,
};

const memSd = /const MEMORY = `([\s\S]*?)`;\n/.exec(memoryDefaults);
const memRaw = eval('`' + memSd![1] + '`');
const memoryNote = {
  name: 'MEMORY',
  description: '',
  path: '/var/customers/webs/percyalvarez/.chia/memory/MEMORY.md',
  content: memRaw,
  core: true,
  syncedAt: 0,
};

const skillsBlock = formatSkillsForPrompt([skillRecord]);
const memoryBlock = formatMemoryForPrompt([memoryNote]);

// --- system prompt: 2 secciones (usuario + harness) ---
const rules = harnessRules('VPS', '');
const harness = fitHarness([rules, memoryBlock, skillsBlock]);
const fullPrompt = composeSystemPrompt(basePrompt, harness);
const injected = harness;
const literalsOnly = rules;

// --- tool schemas reales (mismas funciones de los providers) ---
function evalTools(src: string, protocol: 'openai' | 'anthropic') {
  const stubs = `const readToolDescription = () => ${JSON.stringify(descStub.read)};
const shellToolDescription = () => ${JSON.stringify(descStub.shell)};
const webFetchToolDescription = () => ${JSON.stringify(descStub.web)};
`;
  const body = ['readDefinition', 'toolDefinition', 'webFetchDefinition']
    .map(name => extractFn(src, name))
    .join('\n');
  const fn = new Function(
    `${stubs}${body}
return { read: ${protocol === 'openai' ? 'readDefinition()' : 'readDefinition()'},
         shell: toolDefinition(), web: webFetchDefinition() };`,
  );
  return fn() as { read: unknown; shell: unknown; web: unknown };
}

const oa = evalTools(openaiSrc, 'openai');
const an = evalTools(anthropicSrc, 'anthropic');

// --- mensaje del usuario como lo serializa cada protocolo ---
const userText = 'hola';

function bytes(text: string) {
  return Buffer.byteLength(text, 'utf8');
}
function tokens(text: string) {
  return text.length / 4;
}

type Row = { pieza: string; chars: number; tok: string };
const rows: Row[] = [];
function add(pieza: string, value: string) {
  rows.push({ pieza, chars: value.length, tok: tokens(value).toFixed(0) });
}

add('system 1/2: prompt del usuario', basePrompt);
add('system 2/2: harness - reglas + entorno', literalsOnly);
add('system 2/2: harness - memoria (MEMORY.md)', memoryBlock);
add('system 2/2: harness - indice skills (1 skill)', skillsBlock);
add('system 2/2: harness total (recortado a 2000)', harness);
add('tools: read (JSON openai)', JSON.stringify(oa.read));
add('tools: shell_exec (JSON openai)', JSON.stringify(oa.shell));
add('tools: web_fetch (JSON openai)', JSON.stringify(oa.web));
add('tools: array completo (JSON openai)', JSON.stringify([oa.read, oa.shell, oa.web]));
add('tools: array completo (JSON anthropic)', JSON.stringify([an.read, an.shell, an.web]));
add('mensaje usuario "hola" (openai)', JSON.stringify({ role: 'user', content: userText }));
add('mensaje usuario "hola" (anthropic)', JSON.stringify({ role: 'user', content: [{ type: 'text', text: userText }] }));

const sytemTotal = fullPrompt;
console.log('=== TAMANOS (chars / tokens ~ chars/4) ===');
for (const row of rows) {
  console.log(`${row.pieza.padEnd(46)} ${String(row.chars).padStart(7)}  ~${row.tok.padStart(6)}`);
}

const totalOpenAi = bytes(
  JSON.stringify({
    model: 'deepseek-flash',
    stream: true,
    messages: [
      { role: 'system', content: sytemTotal },
      { role: 'user', content: userText },
    ],
    tools: [oa.read, oa.shell, oa.web],
    stream_options: { include_usage: true },
  }),
);

console.log('\n=== TOTALES ===');
console.log(`system prompt completo: ${sytemTotal.length} chars ~${Math.round(tokens(sytemTotal))} tokens`);
console.log(`base (Configuracion): ${basePrompt.length} chars ~${Math.round(tokens(basePrompt))} tokens`);
console.log(`inyectado por codigo: ${injected.length} chars ~${Math.round(tokens(injected))} tokens`);
console.log(`  de eso, skills: ${skillsBlock.length}, memoria: ${memoryBlock.length}`);
console.log(`tools (openai) suman: ${JSON.stringify([oa.read, oa.shell, oa.web]).length} chars`);
console.log(`BODY openai "hola" total: ${totalOpenAi} bytes ~${Math.round(totalOpenAi / 4)} tokens`);

// --- estandar: cada tool <= 1000 chars de JSON (margen hasta 1024) ---
const TOOL_MAX = 1000;
const oversize = [
  ['read', JSON.stringify(oa.read)],
  ['shell_exec', JSON.stringify(oa.shell)],
  ['web_fetch', JSON.stringify(oa.web)],
].filter(([, json]) => (json as string).length > TOOL_MAX);

if (oversize.length > 0) {
  console.error(`\n[FALLO] tools por encima de ${TOOL_MAX} chars:`);
  for (const [name, json] of oversize) {
    console.error(`  ${name}: ${(json as string).length}`);
  }
  process.exitCode = 1;
}
else {
  console.log(`\nOK: read, shell_exec y web_fetch <= ${TOOL_MAX} chars cada una.`);
}
