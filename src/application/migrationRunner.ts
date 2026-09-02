import { createHash } from 'node:crypto'
import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import type { PlannedMigration } from './migrationHistory'

export interface MigrationExecutor {
  execute(sql: string): Promise<void>
}

export interface TransactionalMigrationExecutor extends MigrationExecutor {
  begin(): Promise<void>
  commit(): Promise<void>
  rollback(): Promise<void>
}

export async function listMigrations(directory: string): Promise<string[]> {
  return (await readdir(directory)).filter((file) => file.endsWith('.sql')).sort()
}

export async function loadMigrationSources(directory: string): Promise<PlannedMigration[]> {
  const files = await listMigrations(directory)
  return Promise.all(files.map(async (name) => {
    const sql = await readFile(join(directory, name), 'utf8')
    return { name, sql, checksum: checksumMigration(sql) }
  }))
}

export function checksumMigration(sql: string): string {
  return createHash('sha256').update(sql.replace(/\r\n/g, '\n')).digest('hex')
}

export async function runMigrations(executor: MigrationExecutor, directory: string): Promise<string[]> {
  const files = await listMigrations(directory)
  for (const file of files) await executor.execute(await readFile(join(directory, file), 'utf8'))
  return files
}

export async function runMigrationsTransactionally(
  executor: TransactionalMigrationExecutor,
  directory: string,
): Promise<string[]> {
  const files = await listMigrations(directory)
  await executor.begin()
  try {
    for (const file of files) await executor.execute(await readFile(join(directory, file), 'utf8'))
    await executor.commit()
    return files
  } catch (error) {
    await executor.rollback()
    throw error
  }
}
