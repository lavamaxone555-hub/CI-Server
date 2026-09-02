import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import type { PlannedMigration } from './migrationHistory'

function isSafeMigrationName(name: string): boolean {
  return name.length > 0
    && name === name.replace(/\\/g, '/')
    && !name.startsWith('/')
    && !name.split('/').includes('..')
}

export async function writeMigrationSet(
  directory: string,
  migrations: readonly PlannedMigration[],
): Promise<void> {
  for (const migration of migrations) {
    if (!isSafeMigrationName(migration.name)) {
      throw new Error(`unsafe migration name: ${migration.name}`)
    }
    const target = join(directory, migration.name)
    await mkdir(dirname(target), { recursive: true })
    await writeFile(target, migration.sql)
  }
}
