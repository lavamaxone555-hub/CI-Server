export interface AppliedMigration {
  name: string
  checksum: string
}

export interface PlannedMigration extends AppliedMigration {
  sql: string
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
    const previousChecksum = appliedByName.get(migration.name)
    if (previousChecksum !== undefined && previousChecksum !== migration.checksum) {
      throw new Error(`duplicate applied migration checksum mismatch: ${migration.name}`)
    }
    appliedByName.set(migration.name, migration.checksum)
  }
  for (const migration of planned) {
    assertSafeMigrationName(migration.name)
    const checksum = appliedByName.get(migration.name)
    if (checksum !== undefined && checksum !== migration.checksum) {
      throw new Error(`migration checksum mismatch: ${migration.name}`)
    }
  }
  return planned.filter((migration) => !appliedByName.has(migration.name))
}
