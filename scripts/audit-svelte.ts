import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execSync } from 'node:child_process';
import vm from 'node:vm';
import { createDefaultAcmeSaaSProject } from '../packages/schema/src/index.js';
import { generateFullExport } from '../packages/codegen/src/index.js';

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

  // 1. Audit all repository .svelte files
  const repoFiles = findSvelteFiles(ROOT_DIR);

  // 2. Also materialize generated SvelteKit 3 files to a temp directory and audit them
  const tmpExportDir = fs.mkdtempSync(path.join(os.tmpdir(), 'app-viz-mcp-audit-'));
  const exported = generateFullExport(createDefaultAcmeSaaSProject());
  const generatedFiles: { fullPath: string; label: string }[] = [];

  for (const [relPath, content] of Object.entries(exported.files)) {
    if (relPath.endsWith('.svelte')) {
      const fullPath = path.join(tmpExportDir, relPath);
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
      fs.writeFileSync(fullPath, content, 'utf-8');
      generatedFiles.push({ fullPath, label: `[codegen] ${relPath}` });
    }
  }

  const allTargets = [
    ...repoFiles.map((f) => ({ fullPath: f, label: path.relative(ROOT_DIR, f) })),
    ...generatedFiles
  ];

  console.log(
    `Found ${repoFiles.length} Studio Svelte file(s) + ${generatedFiles.length} Codegen Svelte file(s) (${allTargets.length} total).\n`
  );

  const results: AuditResult[] = [];
  let totalIssues = 0;

  try {
    for (const target of allTargets) {
      try {
        const output = execSync(
          `pnpm exec svelte-mcp svelte-autofixer "${target.fullPath}" --svelte-version ${SVELTE_VERSION}`,
          { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] }
        );

        const { issues, suggestions } = parseMcpOutput(output);

        if (issues.length === 0) {
          console.log(`✅ PASS: ${target.label}`);
          results.push({
            file: target.fullPath,
            relative: target.label,
            passed: true,
            issues: [],
            suggestions
          });
        } else {
          console.log(`❌ FAIL: ${target.label} (${issues.length} issue(s))`);
          for (const iss of issues) {
            console.log(`   - ${iss}`);
          }
          totalIssues += issues.length;
          results.push({
            file: target.fullPath,
            relative: target.label,
            passed: false,
            issues,
            suggestions
          });
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.log(`❌ ERROR on ${target.label}: ${message}`);
        totalIssues += 1;
        results.push({
          file: target.fullPath,
          relative: target.label,
          passed: false,
          issues: [message],
          suggestions: []
        });
      }
    }
  } finally {
    fs.rmSync(tmpExportDir, { recursive: true, force: true });
  }

  console.log('\n=================================================================');
  console.log('📊 AUDIT SUMMARY');
  console.log('=================================================================');
  console.log(`Studio Files Audited  : ${repoFiles.length}`);
  console.log(`Codegen Files Audited : ${generatedFiles.length}`);
  console.log(`Total Files Audited   : ${allTargets.length}`);
  console.log(`Passed Cleanly        : ${results.filter((r) => r.passed).length}`);
  console.log(`Failed / Has Issues   : ${results.filter((r) => !r.passed).length}`);
  console.log(`Total Issues Found    : ${totalIssues}`);
  console.log('=================================================================');

  if (totalIssues > 0) {
    console.error(`\n❌ Svelte AI-tool audit failed with ${totalIssues} issue(s).`);
    process.exit(1);
  } else {
    console.log('\n✨ All Studio & Codegen Svelte 5 components passed the Svelte AI-Tool audit with 0 issues!');
    process.exit(0);
  }
}

auditRepository().catch((err) => {
  console.error('Fatal audit error:', err);
  process.exit(1);
});
