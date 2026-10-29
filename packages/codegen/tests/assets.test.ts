import { describe, it, expect } from 'vitest';
import { createDefaultAcmeSaaSProject, createNode, type ProjectBlueprint } from '@app-viz/schema';
import { collectAssetFiles, generateBuildSpec, generateFullExport, generatePageRoute } from '../src/index.js';

// 1×1 transparent PNG
const PNG_B64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
const PNG_DATA_URL = `data:image/png;base64,${PNG_B64}`;

function projectWithAssets(): ProjectBlueprint {
  const bp = createDefaultAcmeSaaSProject();
  bp.assets = [
    { id: 'a1', filename: 'Team Photo.png', mimeType: 'image/png', size: 70, localPath: '/assets/Team Photo.png', alt: 'Our team', dataUrl: PNG_DATA_URL, width: 1, height: 1 },
    { id: 'a2', filename: 'broken.png', mimeType: 'image/png', size: 0, localPath: '/assets/broken.png', alt: '', dataUrl: 'data:image/png;base64,@@@' }
  ];
  const home = bp.pages.find((p) => p.path === '/')!;
  home.rootNode.children.push(
    createNode({ componentType: 'basic/image', name: 'By path', props: { imageUrl: '/assets/Team Photo.png', alt: 'Team' } }),
    createNode({ componentType: 'basic/image', name: 'Legacy data URL', props: { imageUrl: PNG_DATA_URL, alt: 'Team' } })
  );
  return bp;
}

describe('project assets in exports', () => {
  it('collects decodable assets with normalized paths and reports undecodable ones', () => {
    const files = collectAssetFiles(projectWithAssets());
    expect(Object.keys(files.binary)).toEqual(['assets/Team-Photo.png']);
    expect(files.binary['assets/Team-Photo.png'][0]).toBe(0x89); // PNG signature
    expect(files.publicPathFor.get('/assets/Team Photo.png')).toBe('/assets/Team-Photo.png');
    expect(files.publicPathFor.get(PNG_DATA_URL)).toBe('/assets/Team-Photo.png');
    expect(files.skipped).toEqual(['broken.png']);
  });

  it('ships the file in the SvelteKit app and references it by path (never as a data URL)', () => {
    const bp = projectWithAssets();
    const out = generateFullExport(bp);
    expect(out.binaryFiles?.['generated-app/static/assets/Team-Photo.png']).toBeInstanceOf(Uint8Array);
    const home = generatePageRoute(bp.pages.find((p) => p.path === '/')!, bp);
    expect(home).toContain('"/assets/Team-Photo.png"');
    expect(home).not.toContain('data:image');
  });

  it('ships assets in the build spec under spec/static and strips data URLs from blueprint.json', () => {
    const spec = generateBuildSpec(projectWithAssets(), { stack: 'sveltekit-rust' });
    expect(spec.binaryFiles?.['spec/static/assets/Team-Photo.png']).toBeInstanceOf(Uint8Array);
    expect(spec.files['spec/overview.md']).toContain('| `/assets/Team-Photo.png` | Team Photo.png | image/png |');
    expect(spec.files['spec/overview.md']).toContain('`broken.png`');
    expect(spec.files['spec/blueprint.json']).not.toContain('data:image');
    expect(spec.files['CLAUDE.md']).toContain('copy `spec/static/`');
    const allText = Object.values(spec.files).join('\n');
    expect(allText).not.toContain(PNG_B64);
  });
});
