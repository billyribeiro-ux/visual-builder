import JSZip from 'jszip';
import type { GeneratedProject } from './generator.js';

/**
 * Creates a bit-exact deterministic ZIP archive from generated project files.
 * Normalizes file creation timestamps to 2026-01-01T00:00:00.000Z and sorts keys.
 */
export async function createDeterministicZip(project: GeneratedProject): Promise<Uint8Array> {
  const zip = new JSZip();
  const normalizedDate = new Date('2026-01-01T00:00:00.000Z');

  // Sort file paths alphabetically for determinism
  const sortedPaths = Object.keys(project.files).sort();

  for (const filePath of sortedPaths) {
    zip.file(filePath, project.files[filePath], {
      date: normalizedDate,
      createFolders: true
    });
  }

  return await zip.generateAsync({
    type: 'uint8array',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });
}
