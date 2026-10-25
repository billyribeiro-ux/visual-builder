import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import vm from 'node:vm';

const ROOT_DIR = process.cwd();
const SVELTE_VERSION = '5.57.2';

function findSvelteFiles(dir: string, fileList: string[] = []): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (
        entry.name === 'node_modules' ||
        entry.name === '.git' ||
        entry.name === '.svelte-kit' ||
        entry.name === 'dist'
      ) {
        continue;
      }
      findSvelteFiles(fullPath, fileList);
    } else if (entry.isFile() && entry.name.endsWith('.svelte')) {
      fileList.push(fullPath);
    }
  }

  return fileList;
}

interface AuditResult {
  file: string;
  relative: string;
  passed: boolean;
  issues: string[];
  suggestions: string[];
}

function parseMcpOutput(output: string): { issues: string[]; suggestions: string[] } {
  const start = output.indexOf('{');
  const end = output.lastIndexOf('}');
  if (start === -1 || end === -1) {
    throw new Error('No JS/JSON object found in output: ' + output);
  }
  const objStr = output.slice(start, end + 1);
  const parsed = vm.runInNewContext(`(${objStr})`);
  return {
    issues: Array.isArray(parsed.issues) ? parsed.issues : [],
    suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : []
  };
}

async function auditRepository() {
  console.log('=================================================================');
  console.log('🔍 SVELTE AI-TOOL (@sveltejs/mcp) AUDIT — Svelte 5.57.2');
  console.log('=================================================================');

  const files = findSvelteFiles(ROOT_DIR);
  console.log(`Found ${files.length} Svelte component(s) to audit.\n`);

  const results: AuditResult[] = [];
  let totalIssues = 0;

  for (const file of files) {
    const relative = path.relative(ROOT_DIR, file);

    try {
      const output = execSync(
        `pnpm exec svelte-mcp svelte-autofixer "${file}" --svelte-version ${SVELTE_VERSION}`,
        { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] }
      );

      const { issues, suggestions } = parseMcpOutput(output);

      if (issues.length === 0) {
        console.log(`✅ PASS: ${relative}`);
        results.push({ file, relative, passed: true, issues: [], suggestions });
      } else {
        console.log(`❌ FAIL: ${relative} (${issues.length} issue(s))`);
        for (const iss of issues) {
          console.log(`   - ${iss}`);
        }
        totalIssues += issues.length;
        results.push({ file, relative, passed: false, issues, suggestions });
      }
    } catch (err: any) {
      console.log(`❌ ERROR on ${relative}: ${err.message}`);
      totalIssues += 1;
      results.push({
        file,
        relative,
        passed: false,
        issues: [err.message],
        suggestions: []
      });
    }
  }

  console.log('\n=================================================================');
  console.log('📊 AUDIT SUMMARY');
  console.log('=================================================================');
  console.log(`Total Files Audited : ${files.length}`);
  console.log(`Passed Cleanly      : ${results.filter((r) => r.passed).length}`);
  console.log(`Failed / Has Issues : ${results.filter((r) => !r.passed).length}`);
  console.log(`Total Issues Found  : ${totalIssues}`);
  console.log('=================================================================');

  if (totalIssues > 0) {
    console.error(`\n❌ Svelte AI-tool audit failed with ${totalIssues} issue(s).`);
    process.exit(1);
  } else {
    console.log('\n✨ All Svelte components passed the Svelte AI-Tool audit with 0 issues!');
    process.exit(0);
  }
}

auditRepository().catch((err) => {
  console.error('Fatal audit error:', err);
  process.exit(1);
});
