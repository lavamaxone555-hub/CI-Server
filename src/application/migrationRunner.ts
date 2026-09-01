import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'

export interface MigrationExecutor {
  execute(sql: string): Promise<void>
}

export async function runMigrations(executor: MigrationExecutor, directory: string): Promise<string[]> {
  const files = (await readdir(directory)).filter((file) => file.endsWith('.sql')).sort()
  for (const file of files) await executor.execute(await readFile(join(directory, file), 'utf8'))
  return files
}
