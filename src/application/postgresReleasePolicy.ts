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
  maxReleaseAgeMs?: number
  maxEvidenceSkewMs?: number
  releaseCommitTimestamp?: string
  maxCommitEvidenceSkewMs?: number
}

export interface PostgresReleasePolicy {
  releasable: boolean
  reasons: string[]
}

function isCommitSha(value: string | undefined): boolean {
  return !!value && /^[0-9a-f]{7,64}$/i.test(value)
}

function hasControlCharacters(value: string): boolean {
  return Array.from(value, (character) => character.charCodeAt(0)).some((code) => code <= 0x1f || code === 0x7f)
}

function parseTimestamp(value: string | undefined): number | undefined {
  if (!value) return undefined
  const timestamp = Date.parse(value)
  return Number.isNaN(timestamp) ? undefined : timestamp
}

function evaluateFreshness(
  timestamp: number | undefined,
  maxAgeMs: number | undefined,
  now: number,
  futureReason: string,
  staleReason: string,
  reasons: string[],
): void {
  if (timestamp === undefined || maxAgeMs === undefined) return
  if (now < timestamp) reasons.push(futureReason)
  if (now - timestamp > maxAgeMs) reasons.push(staleReason)
}

export function evaluatePostgresReleasePolicy(input: PostgresReleasePolicyInput): PostgresReleasePolicy {
  const reasons: string[] = []
  const now = parseTimestamp(input.now) ?? Date.now()

  if (!input.evidenceReady) reasons.push('deployment evidence is incomplete')
  if (input.environment === 'production' && input.deploymentPreflightReady === false) reasons.push('production deployment preflight failed')
  if (input.environment === 'production' && input.deploymentVerificationReady === false) reasons.push('production deployment verification failed')
  if (input.environment === 'production' && (!Number.isInteger(input.migrationsApplied) || input.migrationsApplied < 1)) reasons.push('production release requires an established migration baseline')
  if (!Number.isInteger(input.expectedMigrationBaseline) && input.expectedMigrationBaseline !== undefined) reasons.push('production release expected migration baseline is invalid')
  if (input.environment === 'production' && input.expectedMigrationBaseline !== undefined && input.migrationsApplied < input.expectedMigrationBaseline) reasons.push('production release migration baseline is below the expected level')
  if (input.environment === 'production' && input.migrationBaselineVerified === false) reasons.push('production release migration baseline verification failed')
  if (input.environment === 'production' && !input.releaseId?.trim()) reasons.push('production release identity is missing')
  if (input.environment === 'production' && input.releaseId !== undefined && hasControlCharacters(input.releaseId)) reasons.push('production release identity contains control characters')
  if (input.environment === 'production' && (!input.releaseTimestamp || Number.isNaN(Date.parse(input.releaseTimestamp)))) reasons.push('production release timestamp is invalid')
  if (input.environment === 'production' && input.maxReleaseAgeMs !== undefined && (!Number.isFinite(input.maxReleaseAgeMs) || input.maxReleaseAgeMs <= 0)) reasons.push('production release freshness threshold is invalid')
  if (input.environment === 'production' && input.maxEvidenceSkewMs !== undefined && (!Number.isFinite(input.maxEvidenceSkewMs) || input.maxEvidenceSkewMs < 0)) reasons.push('production evidence skew threshold is invalid')
  if (input.environment === 'production' && input.releaseCommitTimestamp !== undefined && parseTimestamp(input.releaseCommitTimestamp) === undefined) reasons.push('production release commit timestamp is invalid')
  if (input.environment === 'production' && input.maxCommitEvidenceSkewMs !== undefined && (!Number.isFinite(input.maxCommitEvidenceSkewMs) || input.maxCommitEvidenceSkewMs < 0)) reasons.push('production commit evidence skew threshold is invalid')

  if (input.environment === 'production') {
    evaluateFreshness(
      parseTimestamp(input.releaseTimestamp),
      input.maxReleaseAgeMs,
      now,
      'production release timestamp is in the future',
      'production release evidence is stale',
      reasons,
    )
  }

  if (input.environment === 'production' && !isCommitSha(input.releaseCommitSha)) reasons.push('production release commit identity is invalid')
  if (input.environment === 'production') {
    const releaseTimestamp = parseTimestamp(input.releaseTimestamp)
    const commitTimestamp = parseTimestamp(input.releaseCommitTimestamp)
    if (releaseTimestamp !== undefined && commitTimestamp !== undefined && commitTimestamp > releaseTimestamp) reasons.push('production release commit timestamp is after the release')
    if (releaseTimestamp !== undefined && commitTimestamp !== undefined && input.maxCommitEvidenceSkewMs !== undefined && releaseTimestamp - commitTimestamp > input.maxCommitEvidenceSkewMs) reasons.push('production release evidence exceeds the allowed commit skew')
  }

  if (input.environment === 'production' && input.verificationChecks !== undefined) {
    if (input.verificationChecks.length < 1 || input.verificationChecks.some((check) => !check.trim())) reasons.push('production release verification checks are missing')
    if (input.verificationChecks.some(hasControlCharacters)) reasons.push('production release verification checks contain control characters')
  }

  if (input.environment === 'production') {
    if (input.maxReadinessLatencyMs !== undefined && (!Number.isFinite(input.maxReadinessLatencyMs) || input.maxReadinessLatencyMs <= 0)) reasons.push('production readiness latency threshold is invalid')
    if (input.readinessLatencyMs !== undefined && (!Number.isFinite(input.readinessLatencyMs) || input.readinessLatencyMs < 0)) reasons.push('production readiness latency is invalid')
    if (input.readinessLatencyMs !== undefined && input.maxReadinessLatencyMs !== undefined && input.readinessLatencyMs > input.maxReadinessLatencyMs) reasons.push('production readiness latency exceeds the allowed threshold')
    if (input.maxReadinessAgeMs !== undefined && (!Number.isFinite(input.maxReadinessAgeMs) || input.maxReadinessAgeMs <= 0)) reasons.push('production readiness freshness threshold is invalid')
    if (input.readinessCheckedAt !== undefined && parseTimestamp(input.readinessCheckedAt) === undefined) reasons.push('production readiness timestamp is invalid')

    evaluateFreshness(
      parseTimestamp(input.readinessCheckedAt),
      input.maxReadinessAgeMs,
      now,
      'production readiness evidence timestamp is in the future',
      'production readiness evidence is stale',
      reasons,
    )

    const releaseTimestamp = parseTimestamp(input.releaseTimestamp)
    const readinessTimestamp = parseTimestamp(input.readinessCheckedAt)
    if (releaseTimestamp !== undefined && readinessTimestamp !== undefined && readinessTimestamp < releaseTimestamp) reasons.push('production readiness evidence predates the release')
    if (releaseTimestamp !== undefined && readinessTimestamp !== undefined && input.maxEvidenceSkewMs !== undefined && readinessTimestamp - releaseTimestamp > input.maxEvidenceSkewMs) reasons.push('production readiness evidence exceeds the allowed release skew')
  }

  return { releasable: reasons.length === 0, reasons }
}
