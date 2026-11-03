import type { SkillRecord } from '../skills/types';
import { database } from './index';

type Row = {
  name: string;
  description: string;
  path: string;
  base_dir: string;
  hidden: number;
  content: string;
  synced_at: number;
};

export function readSkills(): SkillRecord[] {
  const { rows } = database().executeSync('SELECT * FROM skills ORDER BY name ASC;');
  return (rows as unknown as Row[]).map(row => ({
    name: row.name,
    description: row.description,
    path: row.path,
    baseDir: row.base_dir,
    hidden: row.hidden === 1,
    content: row.content,
    syncedAt: row.synced_at,
  }));
}

export function replaceSkills(skills: SkillRecord[]) {
  const db = database();
  db.executeSync('DELETE FROM skills;');
  for (const skill of skills) {
    db.executeSync(
      `INSERT INTO skills (name, description, path, base_dir, hidden, content, synced_at)
       VALUES (?, ?, ?, ?, ?, ?, ?);`,
      [
        skill.name,
        skill.description,
        skill.path,
        skill.baseDir,
        skill.hidden ? 1 : 0,
        skill.content,
        skill.syncedAt,
      ],
    );
  }
}

export function clearSkills() {
  database().executeSync('DELETE FROM skills;');
}

export function deleteSkill(name: string) {
  database().executeSync('DELETE FROM skills WHERE name = ?;', [name]);
}
