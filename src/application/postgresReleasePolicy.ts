export interface PostgresReleasePolicyInput {
  environment: 'development' | 'test' | 'production'
  evidenceReady: boolean
  migrationsApplied: number
  expectedMigrationBaseline?: number
  migrationBaselineVerified?: boolean
}

export interface PostgresReleasePolicy {
  releasable: boolean
  reasons: string[]
}

export function evaluatePostgresReleasePolicy(
  input: PostgresReleasePolicyInput,
): PostgresReleasePolicy {
  const reasons: string[] = []

  if (!input.evidenceReady) reasons.push('deployment evidence is incomplete')
  if (input.environment === 'production' && input.migrationsApplied < 1) {
    reasons.push('production release requires an established migration baseline')
  }
  if (
    input.environment === 'production'
    && input.expectedMigrationBaseline !== undefined
    && input.migrationsApplied < input.expectedMigrationBaseline
  ) {
    reasons.push('production release migration baseline is below the expected level')
  }
  if (input.environment === 'production' && input.migrationBaselineVerified === false) {
    reasons.push('production release migration baseline verification failed')
  }

  return { releasable: reasons.length === 0, reasons }
}
