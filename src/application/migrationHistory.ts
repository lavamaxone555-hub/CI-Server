export interface AppliedMigration {
  name: string
  checksum: string
}

export interface PlannedMigration extends AppliedMigration {
  sql: string
}

function assertSafeMigrationChecksum(checksum: string): void {
  if (checksum.normalize('NFC').trim() !== checksum || /[\u0000-\u001f\u007f]/.test(checksum) || !checksum) {
    throw new Error(`invalid migration checksum: ${checksum}`)
  }
}

function assertSafeMigrationName(name: string): void {
  if (name.normalize('NFC').trim() !== name || /[\u0000-\u001f\u007f]/.test(name) || !name || name.startsWith('/') || name.includes('\\') || name.split('/').includes('..')) {
    throw new Error(`unsafe migration name: ${name}`)
  }
}

export function pendingMigrations(
  planned: readonly PlannedMigration[],
  applied: readonly AppliedMigration[],
): PlannedMigration[] {
  const appliedByName = new Map<string, string>()
  for (const migration of applied) {
    assertSafeMigrationName(migration.name)
    assertSafeMigrationChecksum(migration.checksum)
    const previousChecksum = appliedByName.get(migration.name)
    if (previousChecksum !== undefined && previousChecksum !== migration.checksum) {
      throw new Error(`duplicate applied migration checksum mismatch: ${migration.name}`)
    }
    if (previousChecksum !== undefined) {
      throw new Error(`duplicate applied migration name: ${migration.name}`)
    }
    appliedByName.set(migration.name, migration.checksum)
  }
  const plannedByName = new Map<string, string>()
  let previousPlannedName: string | undefined
  for (const migration of planned) {
    assertSafeMigrationName(migration.name)
    assertSafeMigrationChecksum(migration.checksum)
    if (previousPlannedName !== undefined && migration.name <= previousPlannedName) {
      throw new Error(`migration plan is not strictly ordered: ${migration.name}`)
    }
    previousPlannedName = migration.name
    const previousChecksum = plannedByName.get(migration.name)
    if (previousChecksum !== undefined && previousChecksum !== migration.checksum) {
      throw new Error(`duplicate planned migration checksum mismatch: ${migration.name}`)
    }
    if (previousChecksum !== undefined) {
      throw new Error(`duplicate planned migration name: ${migration.name}`)
    }
    plannedByName.set(migration.name, migration.checksum)
    const checksum = appliedByName.get(migration.name)
    if (checksum !== undefined && checksum !== migration.checksum) {
      throw new Error(`migration checksum mismatch: ${migration.name}`)
    }
  }
  return planned.filter((migration) => !appliedByName.has(migration.name))
}
