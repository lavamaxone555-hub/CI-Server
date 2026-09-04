import { describe, expect, it } from 'vitest'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { runMigrationsTransactionally } from './migrationRunner'
import { createPostgresMigrationExecutor } from './postgresMigrationExecutor'

describe('PostgreSQL integration boundary', () => {
  it('executes ordered migrations through a transactional PostgreSQL-compatible client', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'postgres-migrations-'))
    await writeFile(join(directory, '001_schema.sql'), 'CREATE TABLE demo (id TEXT PRIMARY KEY)')
    await writeFile(join(directory, '002_index.sql'), 'CREATE INDEX demo_id_idx ON demo (id)')
    const statements: string[] = []
    const files = await runMigrationsTransactionally(
      createPostgresMigrationExecutor({ query: async (sql) => { statements.push(sql) } }),
      directory,
    )
    expect(files).toEqual(['001_schema.sql', '002_index.sql'])
    expect(statements).toEqual([
      'BEGIN',
      'CREATE TABLE demo (id TEXT PRIMARY KEY)',
      'CREATE INDEX demo_id_idx ON demo (id)',
      'COMMIT',
    ])
  })

  it('does not roll back after a commit attempt fails through the PostgreSQL executor', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'postgres-migrations-'))
    await writeFile(join(directory, '001_schema.sql'), 'CREATE TABLE demo (id TEXT PRIMARY KEY)')
    const statements: string[] = []
    const pool = { query: async (sql: string) => { statements.push(sql); if (sql === 'COMMIT') throw new Error('commit failed'); return { rows: [] } }, end: async () => {} }
    const executor = createPostgresMigrationExecutor(pool)
    await expect(runMigrationsTransactionally(executor, directory)).rejects.toThrow('commit failed')
    expect(statements).not.toContain('ROLLBACK')
  })

  it('propagates a real client failure instead of hiding it', async () => {
    const executor = createPostgresMigrationExecutor({ query: async () => { throw new Error('connection refused') } })
    await expect(executor.execute('SELECT 1')).rejects.toThrow('connection refused')
  })
})
