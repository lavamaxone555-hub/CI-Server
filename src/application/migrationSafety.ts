export function assertMigrationPlan(expected: readonly string[], executed: readonly string[]): void {
  if (expected.length !== executed.length || expected.some((file, index) => file !== executed[index])) {
    throw new Error('migration execution plan mismatch')
  }
}

export function assertMigrationsAvailable(files: readonly string[]): void {
  if (files.length === 0) throw new Error('no SQL migrations found')
}
