export interface PostgresReleasePolicyInput {
  environment: 'development' | 'test' | 'production'
  evidenceReady: boolean
  migrationsApplied: number
  expectedMigrationBaseline?: number
  migrationBaselineVerified?: boolean
  releaseId?: string
  releaseTimestamp?: string
  releaseCommitSha?: string
}

export interface PostgresReleasePolicy {
  releasable: boolean
  reasons: string[]
}

function isCommitSha(value: string | undefined): boolean {
  return !!value && /^[0-9a-f]{7,64}$/i.test(value)
}

export function evaluatePostgresReleasePolicy(input: PostgresReleasePolicyInput): PostgresReleasePolicy {
  const reasons: string[] = []

  if (!input.evidenceReady) reasons.push('deployment evidence is incomplete')
  if (input.environment === 'production' && input.migrationsApplied < 1) {
    reasons.push('production release requires an established migration baseline')
  }
  if (!Number.isInteger(input.expectedMigrationBaseline) && input.expectedMigrationBaseline !== undefined) {
    reasons.push('production release expected migration baseline is invalid')
  }
  if (input.environment === 'production' && input.expectedMigrationBaseline !== undefined
    && input.migrationsApplied < input.expectedMigrationBaseline) {
    reasons.push('production release migration baseline is below the expected level')
  }
  if (input.environment === 'production' && input.migrationBaselineVerified === false) {
    reasons.push('production release migration baseline verification failed')
  }
  if (input.environment === 'production' && !input.releaseId?.trim()) {
    reasons.push('production release identity is missing')
  }
  if (input.environment === 'production'
    && (!input.releaseTimestamp || Number.isNaN(Date.parse(input.releaseTimestamp)))) {
    reasons.push('production release timestamp is invalid')
  }
  if (input.environment === 'production' && !isCommitSha(input.releaseCommitSha)) {
    reasons.push('production release commit identity is invalid')
  }

  return { releasable: reasons.length === 0, reasons }
}
