function assertSafeMigrationSequence(files: readonly string[]): void {
  for (const file of files) {
    if (file.normalize('NFC').trim() !== file || /[\u0000-\u001f\u007f]/.test(file) || !file || file.startsWith('/') || file.includes('\\') || file.split('/').includes('..')) {
      throw new Error(`unsafe migration name: ${file}`)
    }
  }
}

export function assertMigrationPlan(expected: readonly string[], executed: readonly string[]): void {
  assertSafeMigrationSequence(expected)
  assertSafeMigrationSequence(executed)
  if (expected.length !== executed.length || expected.some((file, index) => file !== executed[index])) {
    throw new Error('migration execution plan mismatch')
  }
}

export function assertMigrationsAvailable(files: readonly string[]): void {
  if (files.length === 0) throw new Error('no SQL migrations found')
}

export function assertMigrationsAreUnique(files: readonly string[]): void {
  if (new Set(files).size !== files.length) throw new Error('duplicate migration names found')
}

export function assertMigrationNamesAreOrdered(files: readonly string[]): void {
  const sorted = [...files].sort()
  if (files.some((file, index) => file !== sorted[index])) {
    throw new Error('migration files are not ordered')
  }
}
