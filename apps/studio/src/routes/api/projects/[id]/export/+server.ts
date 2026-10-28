import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createDefaultAcmeSaaSProject, migrateBlueprint } from '@app-viz/schema';
import { generateFullExport, createDeterministicZip } from '@app-viz/codegen';

function sanitizeAttachmentSlug(raw: string | undefined): string {
  const cleaned = (raw || 'project')
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
  return cleaned || 'project';
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json().catch(() => null);
    const blueprint = body ? migrateBlueprint(body) : createDefaultAcmeSaaSProject();

    const generated = generateFullExport(blueprint);
    const zipBytes = await createDeterministicZip(generated);
    const safeSlug = sanitizeAttachmentSlug(blueprint.meta.slug);

    return new Response(zipBytes as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${safeSlug}-ai-handoff.zip"`,
        'Cache-Control': 'no-store'
      }
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Export failed';
    return json({ error: message }, { status: 400 });
  }
};

export const GET: RequestHandler = async () => {
  const blueprint = createDefaultAcmeSaaSProject();
  const generated = generateFullExport(blueprint);
  const zipBytes = await createDeterministicZip(generated);
  const safeSlug = sanitizeAttachmentSlug(blueprint.meta.slug);

  return new Response(zipBytes as unknown as BodyInit, {
    status: 200,
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${safeSlug}-ai-handoff.zip"`,
      'Cache-Control': 'no-store'
    }
  });
};
