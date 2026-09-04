import { describe, expect, it } from 'vitest'
import {
  assertMigrationNamesAreOrdered,
  assertMigrationPlan,
  assertMigrationsAreUnique,
  assertMigrationsAvailable,
} from './migrationSafety'

describe('migration safety', () => {
  it('accepts an exact migration execution plan', () => {
    expect(() => assertMigrationPlan(['001.sql', '002.sql'], ['001.sql', '002.sql'])).not.toThrow()
  })

  it('rejects unsafe migration names in execution plans', () => {
    expect(() => assertMigrationPlan(['001.sql'], [' ../001.sql']))
      .toThrow('unsafe migration name:  ../001.sql')
    expect(() => assertMigrationPlan(['001.sql'], ['001.sql\n']))
      .toThrow('unsafe migration name: 001.sql\n')
  })

  it('rejects reordered or incomplete execution', () => {
    expect(() => assertMigrationPlan(['001.sql', '002.sql'], ['002.sql', '001.sql']))
      .toThrow('migration execution plan mismatch')
  })

  it('requires at least one SQL migration', () => {
    expect(() => assertMigrationsAvailable([])).toThrow('no SQL migrations found')
  })

  it('requires unique migration names', () => {
    expect(() => assertMigrationsAreUnique(['001.sql', '001.sql']))
      .toThrow('duplicate migration names found')
  })

  it('requires migration names to be ordered', () => {
    expect(() => assertMigrationNamesAreOrdered(['002.sql', '001.sql']))
      .toThrow('migration files are not ordered')
  })
})
