import { describe, expect, it } from 'vitest'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { runMigrations } from './migrationRunner'
import { createPostgresMigrationExecutor } from './postgresMigrationExecutor'

describe('PostgreSQL integration boundary', () => {
  it('executes ordered migrations through a PostgreSQL-compatible client', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'postgres-migrations-'))
    await writeFile(join(directory, '001_schema.sql'), 'CREATE TABLE demo (id TEXT PRIMARY KEY)')
    await writeFile(join(directory, '002_index.sql'), 'CREATE INDEX demo_id_idx ON demo (id)')
    const statements: string[] = []
    const files = await runMigrations(
      createPostgresMigrationExecutor({ query: async (sql) => { statements.push(sql) } }),
      directory,
    )
    expect(files).toEqual(['001_schema.sql', '002_index.sql'])
    expect(statements).toHaveLength(2)
    expect(statements[0]).toContain('CREATE TABLE')
    expect(statements[1]).toContain('CREATE INDEX')
  })
})
