import fs from 'node:fs';
import postgres from '/home/percyalvarez/vocero-crm/node_modules/postgres/src/index.js';

const env = fs.readFileSync('/home/percyalvarez/vocero-crm/.env', 'utf8');
const url = env.match(/^DATABASE_URL=(.*)$/m)[1].trim().replace(/^"|"$/g, '');
const sql = postgres(url, { max: 1 });

const tables = await sql`
  select table_name from information_schema.tables
  where table_schema = 'public' order by table_name`;
console.log('TABLES:', tables.map(t => t.table_name).join(', '));

for (const name of ['contacts', 'contact', 'pins', 'pin', 'app_pins', 'sessions', 'conversations', 'leads']) {
  const cols = await sql`
    select column_name, data_type from information_schema.columns
    where table_schema = 'public' and table_name = ${name} order by ordinal_position`;
  if (cols.length) {
    console.log(`\n${name}:`, cols.map(c => `${c.column_name}:${c.data_type}`).join(' '));
  }
}

await sql.end();
