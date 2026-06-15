import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const outputPath = resolve('src/environments/environment.generated.ts');
const supabaseUrl = process.env.SUPABASE_URL?.trim() ?? '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY?.trim() ?? '';

const environment = {
  production: true,
  supabaseUrl: supabaseUrl || 'https://your-project-ref.supabase.co',
  supabaseAnonKey: supabaseAnonKey || 'your-public-anon-key',
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(
  outputPath,
  `export const environment = ${JSON.stringify(environment, null, 2)};\n`,
);

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'SUPABASE_URL and/or SUPABASE_ANON_KEY are missing. Wrote placeholder Angular production environment.',
  );
}
