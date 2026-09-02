export interface AppliedMigration {
  name: string
  checksum: string
}

export function pendingMigrations(
  planned: readonly AppliedMigration[],
  applied: readonly AppliedMigration[],
): AppliedMigration[] {
  const appliedByName = new Map(applied.map((migration) => [migration.name, migration.checksum]))
  for (const migration of planned) {
    const checksum = appliedByName.get(migration.name)
    if (checksum !== undefined && checksum !== migration.checksum) {
      throw new Error(`migration checksum mismatch: ${migration.name}`)
    }
  }
  return planned.filter((migration) => !appliedByName.has(migration.name))
}
