import { describe, expect, it } from 'vitest'
import { pendingMigrations } from './migrationHistory'

describe('migration history', () => {
  it('returns only migrations that have not been applied', () => {
    expect(pendingMigrations(
      [{ name: '001.sql', checksum: 'a' }, { name: '002.sql', checksum: 'b' }],
      [{ name: '001.sql', checksum: 'a' }],
    )).toEqual([{ name: '002.sql', checksum: 'b' }])
  })

  it('rejects migration drift', () => {
    expect(() => pendingMigrations(
      [{ name: '001.sql', checksum: 'new' }],
      [{ name: '001.sql', checksum: 'old' }],
    )).toThrow('migration checksum mismatch: 001.sql')
  })
})
