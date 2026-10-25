import { createDefaultAcmeSaaSProject } from '../packages/schema/src/index.js';
import { generateFullExport } from '../packages/codegen/src/index.js';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { execSync } from 'node:child_process';

async function main() {
  console.log('--- EXPORT INTEGRATION TEST ---');
  const project = createDefaultAcmeSaaSProject();
  console.log('1. Generating full export for:', project.meta.name);
  const result = generateFullExport(project);

  const targetDir = '/tmp/test-export-acme-saas';
  if (fs.existsSync(targetDir)) {
    fs.rmSync(targetDir, { recursive: true, force: true });
  }
  fs.mkdirSync(targetDir, { recursive: true });

  console.log('2. Writing files to targetDir:', targetDir);
  for (const [relPath, content] of Object.entries(result.files)) {
    const fullPath = path.join(targetDir, relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content, 'utf-8');
  }

  const appDir = path.join(targetDir, 'generated-app');
  console.log('3. Installing generated app dependencies in:', appDir);
  execSync('pnpm install --no-frozen-lockfile', { cwd: appDir, stdio: 'inherit' });

  console.log('4. Running production build on generated SvelteKit 3 app...');
  execSync('pnpm build', { cwd: appDir, stdio: 'inherit' });

  console.log('SUCCESS: Generated SvelteKit 3 app built without errors!');
}

main().catch((err) => {
  console.error('Smoke test failed:', err);
  process.exit(1);
});
