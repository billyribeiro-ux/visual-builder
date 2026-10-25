import { ProjectBlueprintSchema, type ProjectBlueprint } from './blueprint.js';

export interface MigrationStep {
  fromVersion: string;
  toVersion: string;
  migrate: (data: any) => any;
}

const MIGRATIONS: MigrationStep[] = [
  // Future migrations can be appended here
];

export function migrateBlueprint(input: unknown): ProjectBlueprint {
  if (typeof input !== 'object' || input === null) {
    throw new Error('Invalid blueprint input: must be an object');
  }

  let current: any = { ...input };
  const currentVersion = current.schemaVersion || '1.0.0';

  for (const step of MIGRATIONS) {
    if (step.fromVersion === current.schemaVersion) {
      current = step.migrate(current);
    }
  }

  // Final parse via Zod schema to ensure full compliance
  return ProjectBlueprintSchema.parse(current);
}
