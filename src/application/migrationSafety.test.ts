import { describe, expect, it } from 'vitest'
import { assertMigrationPlan, assertMigrationsAvailable } from './migrationSafety'

describe('migration safety', () => {
  it('accepts an exact migration execution plan', () => {
    expect(() => assertMigrationPlan(['001.sql', '002.sql'], ['001.sql', '002.sql'])).not.toThrow()
  })

  it('rejects reordered or incomplete execution', () => {
    expect(() => assertMigrationPlan(['001.sql', '002.sql'], ['002.sql', '001.sql']))
      .toThrow('migration execution plan mismatch')
  })

  it('requires at least one SQL migration', () => {
    expect(() => assertMigrationsAvailable([])).toThrow('no SQL migrations found')
  })
})
