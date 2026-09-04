import { createHash } from 'node:crypto'
import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import type { PlannedMigration } from './migrationHistory'

export interface MigrationExecutor { execute(sql: string): Promise<void> }
export interface TransactionalMigrationExecutor extends MigrationExecutor {
  begin(): Promise<void>
  commit(): Promise<void>
  rollback(): Promise<void>
}

function assertSafeMigrationFileName(file: string): void {
  if (!file || file.startsWith('/') || file.includes('\\') || file.split('/').includes('..')) {
    throw new Error(`unsafe migration file name: ${file}`)
  }
}

export async function listMigrations(directory: string): Promise<string[]> {
  return (await readdir(directory))
    .filter((file) => file.endsWith('.sql'))
    .filter((file) => {
      assertSafeMigrationFileName(file)
      return true
    })
    .sort()
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
  let migrationsCompleted = false
  try {
    for (const file of files) await executor.execute(await readFile(join(directory, file), 'utf8'))
    migrationsCompleted = true
    await executor.commit()
    return files
  } catch (error) {
    if (migrationsCompleted) throw error
    try {
      await executor.rollback()
    } catch (rollbackError) {
      const message = rollbackError instanceof Error ? rollbackError.message : 'unknown rollback failure'
      throw new Error(`migration failed and rollback failed: ${message}`, { cause: error })
    }
    throw error
  }
}
