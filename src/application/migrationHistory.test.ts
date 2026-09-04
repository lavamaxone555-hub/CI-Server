import { describe, expect, it } from 'vitest'
import { pendingMigrations } from './migrationHistory'

describe('migration history', () => {
  it('returns only migrations that have not been applied', () => {
    expect(pendingMigrations(
      [
        { name: '001.sql', checksum: 'a', sql: 'FIRST' },
        { name: '002.sql', checksum: 'b', sql: 'SECOND' },
      ],
      [{ name: '001.sql', checksum: 'a' }],
    )).toEqual([{ name: '002.sql', checksum: 'b', sql: 'SECOND' }])
  })

  it('rejects migration drift', () => {
    expect(() => pendingMigrations(
      [{ name: '001.sql', checksum: 'new', sql: 'NEW' }],
      [{ name: '001.sql', checksum: 'old' }],
    )).toThrow('migration checksum mismatch: 001.sql')
  })

  it('rejects non-canonical or control-character migration names', () => {
    expect(() => pendingMigrations([{ name: ' 001.sql', checksum: 'a', sql: 'SELECT 1' }], []))
      .toThrow('unsafe migration name:  001.sql')
    expect(() => pendingMigrations([{ name: '001.sql\n', checksum: 'a', sql: 'SELECT 1' }], []))
      .toThrow('unsafe migration name: 001.sql\n')
  })

  it('rejects unsafe migration names before planning execution', () => {
    expect(() => pendingMigrations(
      [{ name: '../escape.sql', checksum: 'a', sql: 'SELECT 1' }],
      [],
    )).toThrow('unsafe migration name: ../escape.sql')
  })
})
