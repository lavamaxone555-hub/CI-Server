import { createHash } from 'node:crypto'
import { readFile, readdir, lstat } from 'node:fs/promises'
import { join } from 'node:path'
import type { PlannedMigration } from './migrationHistory'

export interface MigrationExecutor { execute(sql: string): Promise<void> }
export interface TransactionalMigrationExecutor extends MigrationExecutor {
  begin(): Promise<void>
  commit(): Promise<void>
  rollback(): Promise<void>
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(describeError(error))
}

function assertSafeMigrationFileName(file: string): void {
  if (file.normalize('NFC').trim() !== file || /[\u0000-\u001f\u007f]/.test(file) || !file || file.startsWith('/') || file.includes('\\') || file.split('/').includes('..')) {
    throw new Error(`unsafe migration file name: ${file}`)
  }
}

export async function listMigrations(directory: string): Promise<string[]> {
  const files = await readdir(directory)
  for (const file of files) {
    assertSafeMigrationFileName(file)
    const metadata = await lstat(join(directory, file))
    if (file.endsWith('.sql') && metadata.isSymbolicLink()) {
      throw new Error(`migration entry is a symbolic link: ${file}`)
    }
    if (file.endsWith('.sql') && !metadata.isFile()) {
      throw new Error(`migration entry is not a regular file: ${file}`)
    }
  }
  return files.filter((file) => file.endsWith('.sql')).sort()
}

export async function loadMigrationSources(directory: string): Promise<PlannedMigration[]> {
  const files = await listMigrations(directory)
  return Promise.all(files.map(async (name) => {
    const path = join(directory, name)
    const metadata = await lstat(path)
    if (!metadata.isFile() || metadata.isSymbolicLink()) throw new Error(`migration entry changed after validation: ${name}`)
    const sql = await readFile(path, 'utf8')
    return { name, sql, checksum: checksumMigration(sql) }
  }))
}

export function checksumMigration(sql: string): string {
  return createHash('sha256').update(sql.replace(/\r\n/g, '\n')).digest('hex')
}

export async function runMigrations(executor: MigrationExecutor, directory: string): Promise<string[]> {
  const files = await listMigrations(directory)
  for (const file of files) {
    const path = join(directory, file)
    const metadata = await lstat(path)
    if (!metadata.isFile() || metadata.isSymbolicLink()) throw new Error(`migration entry changed after validation: ${file}`)
    await executor.execute(await readFile(path, 'utf8'))
  }
  return files
}

export async function runMigrationsTransactionally(
  executor: TransactionalMigrationExecutor,
  directory: string,
): Promise<string[]> {
  const files = await listMigrations(directory)
  await executor.begin()
  let commitAttempted = false
  try {
    for (const file of files) {
      const path = join(directory, file)
      const metadata = await lstat(path)
      if (!metadata.isFile() || metadata.isSymbolicLink()) throw new Error(`migration entry changed after validation: ${file}`)
      await executor.execute(await readFile(path, 'utf8'))
    }
    commitAttempted = true
    await executor.commit()
    return files
  } catch (error) {
    if (commitAttempted) throw error
    try {
      await executor.rollback()
    } catch (rollbackError) {
      throw new Error(`migration failed and rollback failed: ${describeError(rollbackError)}`, { cause: toError(error) })
    }
    throw error
  }
}
