import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { PlannedMigration } from './migrationHistory'

export async function writeMigrationSet(
  directory: string,
  migrations: readonly PlannedMigration[],
): Promise<void> {
  for (const migration of migrations) {
    await writeFile(join(directory, migration.name), migration.sql)
  }
}
