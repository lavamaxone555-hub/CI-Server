import { describe, expect, it } from 'vitest'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { runMigrations } from './migrationRunner'

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
})
