import { describe, expect, it } from 'vitest'
import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { writeMigrationSet } from './postgresMigrationFailureRecovery'

describe('migration failure recovery fixtures', () => {
  it('writes an isolated migration set', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'migration-set-'))
    await writeMigrationSet(directory, [{ name: '001.sql', sql: 'SELECT 1', checksum: 'x' }])
    await expect(readFile(join(directory, '001.sql'), 'utf8')).resolves.toBe('SELECT 1')
  })

  it('creates nested fixture directories safely', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'migration-set-'))
    await writeMigrationSet(directory, [{ name: 'nested/001.sql', sql: 'SELECT 1', checksum: 'x' }])
    await expect(readFile(join(directory, 'nested', '001.sql'), 'utf8')).resolves.toBe('SELECT 1')
  })

  it('rejects path traversal migration names', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'migration-set-'))
    await expect(writeMigrationSet(directory, [{ name: '../escape.sql', sql: 'SELECT 1', checksum: 'x' }]))
      .rejects.toThrow('unsafe migration name')
  })
})
