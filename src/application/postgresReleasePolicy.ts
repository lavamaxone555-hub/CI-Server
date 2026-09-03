export interface PostgresReleasePolicyInput {
  environment: 'development' | 'test' | 'production'
  evidenceReady: boolean
  migrationsApplied: number
  expectedMigrationBaseline?: number
  migrationBaselineVerified?: boolean
  releaseId?: string
  releaseTimestamp?: string
  releaseCommitSha?: string
  verificationChecks?: readonly string[]
  deploymentPreflightReady?: boolean
  deploymentVerificationReady?: boolean
  readinessLatencyMs?: number
  maxReadinessLatencyMs?: number
  readinessCheckedAt?: string
  maxReadinessAgeMs?: number
  now?: string
}

export interface PostgresReleasePolicy {
  releasable: boolean
  reasons: string[]
}

function isCommitSha(value: string | undefined): boolean {
  return !!value && /^[0-9a-f]{7,64}$/i.test(value)
}

function parseTimestamp(value: string | undefined): number | undefined {
  if (!value) return undefined
  const timestamp = Date.parse(value)
  return Number.isNaN(timestamp) ? undefined : timestamp
}

export function evaluatePostgresReleasePolicy(input: PostgresReleasePolicyInput): PostgresReleasePolicy {
  const reasons: string[] = []

  if (!input.evidenceReady) reasons.push('deployment evidence is incomplete')
  if (input.environment === 'production' && input.deploymentPreflightReady === false) reasons.push('production deployment preflight failed')
  if (input.environment === 'production' && input.deploymentVerificationReady === false) reasons.push('production deployment verification failed')
  if (input.environment === 'production' && input.migrationsApplied < 1) reasons.push('production release requires an established migration baseline')
  if (!Number.isInteger(input.expectedMigrationBaseline) && input.expectedMigrationBaseline !== undefined) reasons.push('production release expected migration baseline is invalid')
  if (input.environment === 'production' && input.expectedMigrationBaseline !== undefined && input.migrationsApplied < input.expectedMigrationBaseline) reasons.push('production release migration baseline is below the expected level')
  if (input.environment === 'production' && input.migrationBaselineVerified === false) reasons.push('production release migration baseline verification failed')
  if (input.environment === 'production' && !input.releaseId?.trim()) reasons.push('production release identity is missing')
  if (input.environment === 'production' && (!input.releaseTimestamp || Number.isNaN(Date.parse(input.releaseTimestamp)))) reasons.push('production release timestamp is invalid')
  if (input.environment === 'production' && !isCommitSha(input.releaseCommitSha)) reasons.push('production release commit identity is invalid')
  if (input.environment === 'production' && input.verificationChecks !== undefined && input.verificationChecks.length < 1) reasons.push('production release verification checks are missing')

  if (input.environment === 'production') {
    if (input.maxReadinessLatencyMs !== undefined && (!Number.isFinite(input.maxReadinessLatencyMs) || input.maxReadinessLatencyMs <= 0)) reasons.push('production readiness latency threshold is invalid')
    if (input.readinessLatencyMs !== undefined && (!Number.isFinite(input.readinessLatencyMs) || input.readinessLatencyMs < 0)) reasons.push('production readiness latency is invalid')
    if (input.readinessLatencyMs !== undefined && input.maxReadinessLatencyMs !== undefined && input.readinessLatencyMs > input.maxReadinessLatencyMs) reasons.push('production readiness latency exceeds the allowed threshold')

    if (input.maxReadinessAgeMs !== undefined && (!Number.isFinite(input.maxReadinessAgeMs) || input.maxReadinessAgeMs <= 0)) reasons.push('production readiness freshness threshold is invalid')
    if (input.readinessCheckedAt !== undefined && parseTimestamp(input.readinessCheckedAt) === undefined) reasons.push('production readiness timestamp is invalid')

    if (input.readinessCheckedAt !== undefined && input.maxReadinessAgeMs !== undefined) {
      const checkedAt = parseTimestamp(input.readinessCheckedAt)
      const now = parseTimestamp(input.now) ?? Date.now()
      if (checkedAt !== undefined && now - checkedAt < 0) reasons.push('production readiness evidence timestamp is in the future')
      if (checkedAt !== undefined && now - checkedAt > input.maxReadinessAgeMs) reasons.push('production readiness evidence is stale')
    }

    if (input.releaseTimestamp !== undefined && input.readinessCheckedAt !== undefined) {
      const releaseTimestamp = parseTimestamp(input.releaseTimestamp)
      const readinessTimestamp = parseTimestamp(input.readinessCheckedAt)
      if (releaseTimestamp !== undefined && readinessTimestamp !== undefined && readinessTimestamp < releaseTimestamp) {
        reasons.push('production readiness evidence predates the release')
      }
    }
  }

  return { releasable: reasons.length === 0, reasons }
}
