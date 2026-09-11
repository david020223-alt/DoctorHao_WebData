import { spawnSync } from 'node:child_process';
const cli = new URL('../node_modules/astro/bin/astro.mjs', import.meta.url);
const { fileURLToPath } = await import('node:url');
const result = spawnSync(process.execPath, [fileURLToPath(cli), ...process.argv.slice(2)], {
  stdio: 'inherit', env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' },
});
if (result.error) { console.error(result.error); process.exit(1); }
process.exit(result.status ?? 1);

