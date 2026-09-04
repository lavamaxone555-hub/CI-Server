import { describe, expect, it } from 'vitest'
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { runMigrations, runMigrationsTransactionally } from './migrationRunner'

describe('migration runner', () => {
  it('rejects non-canonical or control-character migration file names', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'retail-migrations-'))
    await writeFile(join(directory, ' 001_first.sql'), 'FIRST')
    await expect(runMigrations({ execute: async () => {} }, directory))
      .rejects.toThrow('unsafe migration file name:  001_first.sql')
  })

  it('rejects unsafe non-SQL entries instead of silently ignoring them', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'retail-migrations-'))
    await writeFile(join(directory, '001_first.sql'), 'FIRST')
    await writeFile(join(directory, '  notes.txt'), 'IGNORE')
    await expect(runMigrations({ execute: async () => {} }, directory))
      .rejects.toThrow('unsafe migration file name:   notes.txt')
  })

  it('rejects SQL migration entries that are not regular files', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'retail-migrations-'))
    await mkdir(join(directory, '001_not_a_file.sql'))
    await expect(runMigrations({ execute: async () => {} }, directory))
      .rejects.toThrow('migration entry is not a regular file: 001_not_a_file.sql')
  })

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
      begin: async () => { calls.push('BEGIN') }, execute: async (sql) => { calls.push(sql) },
      commit: async () => { calls.push('COMMIT') }, rollback: async () => { calls.push('ROLLBACK') },
    }, directory)
    expect(files).toEqual(['001_first.sql'])
    expect(calls).toEqual(['BEGIN', 'FIRST', 'COMMIT'])
  })

  it('does not attempt rollback when begin fails', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'retail-migrations-'))
    await writeFile(join(directory, '001_first.sql'), 'FIRST')
    const calls: string[] = []
    await expect(runMigrationsTransactionally({
      begin: async () => { calls.push('BEGIN'); throw new Error('begin failed') }, execute: async () => {},
      commit: async () => calls.push('COMMIT'), rollback: async () => calls.push('ROLLBACK'),
    }, directory)).rejects.toThrow('begin failed')
    expect(calls).toEqual(['BEGIN'])
  })

  it('does not roll back when commit begins and fails synchronously', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'retail-migrations-'))
    await writeFile(join(directory, '001_first.sql'), 'FIRST')
    const calls: string[] = []
    await expect(runMigrationsTransactionally({
      begin: async () => { calls.push('BEGIN') }, execute: async () => { calls.push('FIRST') },
      commit: async () => { calls.push('COMMIT'); throw new Error('commit failed') }, rollback: async () => { calls.push('ROLLBACK') },
    }, directory)).rejects.toThrow('commit failed')
    expect(calls).toEqual(['BEGIN', 'FIRST', 'COMMIT'])
  })

  it('does not roll back after a commit failure because migration outcome is unknown', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'retail-migrations-'))
    await writeFile(join(directory, '001_first.sql'), 'FIRST')
    const calls: string[] = []
    await expect(runMigrationsTransactionally({
      begin: async () => { calls.push('BEGIN') }, execute: async (sql) => { calls.push(sql) },
      commit: async () => { calls.push('COMMIT'); throw new Error('commit failed') }, rollback: async () => { calls.push('ROLLBACK') },
    }, directory)).rejects.toThrow('commit failed')
    expect(calls).toEqual(['BEGIN', 'FIRST', 'COMMIT'])
  })

  it('rolls back the complete migration set when execution fails', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'retail-migrations-'))
    await writeFile(join(directory, '001_first.sql'), 'FIRST')
    const calls: string[] = []
    await expect(runMigrationsTransactionally({
      begin: async () => { calls.push('BEGIN') }, execute: async () => { throw new Error('migration failed') },
      commit: async () => { calls.push('COMMIT') }, rollback: async () => { calls.push('ROLLBACK') },
    }, directory)).rejects.toThrow('migration failed')
    expect(calls).toEqual(['BEGIN', 'ROLLBACK'])
  })

  it('preserves a non-Error primary failure as the rollback error cause', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'retail-migrations-'))
    await writeFile(join(directory, '001_first.sql'), 'FIRST')
    try {
      await runMigrationsTransactionally({
        begin: async () => {}, execute: async () => { throw 'migration failed' },
        commit: async () => {}, rollback: async () => { throw new Error('rollback unavailable') },
      }, directory)
      throw new Error('expected migration to fail')
    } catch (error) {
      expect(error).toMatchObject({ message: 'migration failed and rollback failed: rollback unavailable', cause: expect.objectContaining({ message: 'migration failed' }) })
    }
  })

  it('preserves non-Error rollback failure detail', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'retail-migrations-'))
    await writeFile(join(directory, '001_first.sql'), 'FIRST')
    try {
      await runMigrationsTransactionally({
        begin: async () => {}, execute: async () => { throw new Error('migration failed') },
        commit: async () => {}, rollback: async () => { throw 'rollback unavailable' },
      }, directory)
      throw new Error('expected migration to fail')
    } catch (error) {
      expect(error).toMatchObject({ message: 'migration failed and rollback failed: rollback unavailable', cause: expect.objectContaining({ message: 'migration failed' }) })
    }
  })

  it('exposes both primary and rollback failures structurally', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'retail-migrations-'))
    await writeFile(join(directory, '001_first.sql'), 'FIRST')
    const original = new Error('migration failed')
    const rollback = new Error('rollback unavailable')
    try {
      await runMigrationsTransactionally({ begin: async () => {}, execute: async () => { throw original }, commit: async () => {}, rollback: async () => { throw rollback } }, directory)
      throw new Error('expected migration to fail')
    } catch (error) {
      expect(error).toBeInstanceOf(AggregateError)
      expect((error as AggregateError).errors).toEqual([original, rollback])
      expect((error as Error).cause).toBe(original)
    }
  })

  it('reports rollback failure without hiding the failed migration context', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'retail-migrations-'))
    await writeFile(join(directory, '001_first.sql'), 'FIRST')
    await expect(runMigrationsTransactionally({
      begin: async () => {}, execute: async () => { throw new Error('migration failed') },
      commit: async () => {}, rollback: async () => { throw new Error('rollback unavailable') },
    }, directory)).rejects.toThrow('migration failed and rollback failed: rollback unavailable')
  })
})
