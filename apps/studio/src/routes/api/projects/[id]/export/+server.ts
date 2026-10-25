import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createDefaultAcmeSaaSProject, ProjectBlueprintSchema } from '@app-viz/schema';
import { generateFullExport, createDeterministicZip } from '@app-viz/codegen';

export const POST: RequestHandler = async ({ request, params }) => {
  try {
    const body = await request.json().catch(() => null);
    const blueprint = body ? ProjectBlueprintSchema.parse(body) : createDefaultAcmeSaaSProject();

    const generated = generateFullExport(blueprint);
    const zipBytes = await createDeterministicZip(generated);

    return new Response(zipBytes as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${blueprint.meta.slug || 'project'}-ai-handoff.zip"`,
        'Cache-Control': 'no-store'
      }
    });
  } catch (err: any) {
    return json({ error: err.message || 'Export failed' }, { status: 400 });
  }
};

export const GET: RequestHandler = async ({ params }) => {
  // Default export of the canonical seed project
  const blueprint = createDefaultAcmeSaaSProject();
  const generated = generateFullExport(blueprint);
  const zipBytes = await createDeterministicZip(generated);

  return new Response(zipBytes as any, {
    status: 200,
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${blueprint.meta.slug}-ai-handoff.zip"`,
      'Cache-Control': 'no-store'
    }
  });
};
