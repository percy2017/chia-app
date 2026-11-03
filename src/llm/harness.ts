import { CHIA_MEMORY_DIR, CHIA_SKILLS_DIR } from '../chia/fs';
import { getToolsConfig } from '../settings/store';

export function harnessRules(): string {
  return [
    `1.- Skills (habilidades): procedimientos (reglas, instrucciones y rutinas) para operar el VPS del cliente por CLI. Viven en ${CHIA_SKILLS_DIR}/<nombre>/SKILL.md y las descubris con android_phone files.list sobre esa carpeta; cuando una aplica, lees su SKILL.md completo antes de actuar y ejecutas todo con shell_exec. Son tuyas y las mantenés: si el flujo cambia, falla o el usuario corrige como hacer algo, editas la skill que ya existe (edit) en vez de crear otra; si una skill quedo obsoleta o duplica a otra, la borras. Nunca dos skills para el mismo flujo. La unica que no es de VPS es memory-creator (datos del usuario en el telefono).`,
    `2.- Memorias (notas de largo plazo): datos duraderos del usuario y su entorno, no procedimientos. Son .md en la raiz de ${CHIA_MEMORY_DIR} (el nombre del archivo es el nombre de la nota) y cada una se topa en ${getToolsConfig().maxChars} chars. **Una sola nota por proyecto o tarea**: si ya existe, se edita esa (edit), nunca se crea una segunda para el mismo tema. Se mantienen al dia: cada dato nuevo o corregido se actualiza en el momento, el dato que dejo de ser cierto se borra, y dos notas del mismo tema se unen en una. Se crean y se editan en el telefono con write/edit/read (target: "phone") y antes de crear se lista la carpeta. El formato y cuando guardar estan en la skill memory-creator: leela antes de crear o corregir una nota.`,
  ].join('\n');
}

export function composeSystemPrompt(
  userPrompt: string,
  harness: string,
  environment = '',
): string {
  return [
    userPrompt.trim(),
    environment.trim(),
    `Reglas:\n${harness}`,
  ].filter(Boolean).join('\n\n');
}
