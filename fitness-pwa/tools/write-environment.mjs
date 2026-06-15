import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const outputPath = resolve('src/environments/environment.generated.ts');
const supabaseUrl = process.env.SUPABASE_URL?.trim() ?? '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY?.trim() ?? '';
const isVercelBuild = process.env.VERCEL === '1' || process.env.VERCEL === 'true';
const isCiBuild = process.env.CI === '1' || process.env.CI === 'true';
const shouldFailOnMissingConfig = isVercelBuild || isCiBuild;
const hasSupabaseUrl = supabaseUrl.length > 0;
const hasSupabaseAnonKey = supabaseAnonKey.length > 0;
const missingConfig = !hasSupabaseUrl || !hasSupabaseAnonKey;

console.log('Supabase environment diagnostics:');
console.log(`- SUPABASE_URL exists: ${hasSupabaseUrl ? 'yes' : 'no'}`);
console.log(`- SUPABASE_ANON_KEY exists: ${hasSupabaseAnonKey ? 'yes' : 'no'}`);

if (missingConfig && shouldFailOnMissingConfig) {
  console.error(
    'Missing required Supabase environment variables. Set SUPABASE_URL and SUPABASE_ANON_KEY in Vercel Project Settings before deploying.',
  );
  process.exit(1);
}

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

console.log(`Wrote Angular production environment: ${outputPath}`);

if (missingConfig) {
  console.warn(
    'SUPABASE_URL and/or SUPABASE_ANON_KEY are missing. Wrote placeholders for local build only.',
  );
}
