import { describe, expect, it } from 'vitest'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { runMigrations, runMigrationsTransactionally } from './migrationRunner'

describe('migration runner', () => {
  it('runs SQL migrations in lexical order', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'retail-migrations-'))
    await writeFile(join(directory, '002_second.sql'), 'SECOND')
    await writeFile(join(directory, '001_first.sql'), 'FIRST')
    const executed: string[] = []
    const files = await runMigrations({ execute: async (sql) => { executed.push(sql) } }, directory)
    expect(files).toEqual(['001_first.sql', '002_second.sql'])
    expect(executed).toEqual(['FIRST', 'SECOND'])
  })

  it('commits the complete migration set transactionally', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'retail-migrations-'))
    await writeFile(join(directory, '001_first.sql'), 'FIRST')
    const calls: string[] = []
    const files = await runMigrationsTransactionally({
      begin: async () => { calls.push('BEGIN') },
      execute: async (sql) => { calls.push(sql) },
      commit: async () => { calls.push('COMMIT') },
      rollback: async () => { calls.push('ROLLBACK') },
    }, directory)
    expect(files).toEqual(['001_first.sql'])
    expect(calls).toEqual(['BEGIN', 'FIRST', 'COMMIT'])
  })

  it('rolls back the complete migration set when execution fails', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'retail-migrations-'))
    await writeFile(join(directory, '001_first.sql'), 'FIRST')
    const calls: string[] = []
    await expect(runMigrationsTransactionally({
      begin: async () => { calls.push('BEGIN') },
      execute: async () => { throw new Error('migration failed') },
      commit: async () => { calls.push('COMMIT') },
      rollback: async () => { calls.push('ROLLBACK') },
    }, directory)).rejects.toThrow('migration failed')
    expect(calls).toEqual(['BEGIN', 'ROLLBACK'])
  })
})
