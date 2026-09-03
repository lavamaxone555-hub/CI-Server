import type { PostgresReleaseAuditRecord } from './postgresReleaseAuditTrail'

export interface PostgresCiReleaseEvidence {
  verified: boolean
  summary: string
  failures: string[]
  audit: PostgresReleaseAuditRecord
}

function isCommitSha(value: string | undefined): boolean {
  return !!value && /^[0-9a-f]{7,64}$/i.test(value)
}

function hasDuplicateChecks(checks: readonly string[]): boolean {
  return new Set(checks.map((check) => check.trim())).size !== checks.length
}

export function verifyPostgresCiReleaseEvidence(
  audit: PostgresReleaseAuditRecord,
  expectedMigrationBaseline?: number,
): PostgresCiReleaseEvidence {
  const failures: string[] = []
  const baseline = expectedMigrationBaseline ?? audit.expectedMigrationBaseline ?? 1
  if (!Number.isInteger(baseline) || baseline < 1) failures.push('expected migration baseline is invalid')
  if (expectedMigrationBaseline !== undefined && audit.expectedMigrationBaseline !== undefined
    && expectedMigrationBaseline !== audit.expectedMigrationBaseline) {
    failures.push('release evidence baseline does not match audit baseline')
  }
  if (!audit.releaseId?.trim()) failures.push('release identity is missing')
  if (!audit.createdAt || Number.isNaN(Date.parse(audit.createdAt))) failures.push('release timestamp is invalid')
  if (audit.environment === 'production' && !isCommitSha(audit.releaseCommitSha)) {
    failures.push('release commit identity is invalid')
  }
  if (!audit.evidenceReady) failures.push('deployment evidence is incomplete')
  if (!audit.releaseApproved) failures.push('release approval is missing')
  if (audit.migrationsApplied < baseline) failures.push('migration baseline is below the expected level')
  if (audit.checks.length < 1) failures.push('verification checks are missing')
  if (audit.checks.some((check) => !check.trim())) failures.push('verification checks contain an empty entry')
  if (hasDuplicateChecks(audit.checks)) failures.push('verification checks contain duplicate entries')
  const verified = failures.length === 0
  return { verified, summary: verified ? 'postgres release evidence verified' : 'postgres release evidence verification failed', failures, audit }
}

export function assertPostgresCiReleaseEvidence(audit: PostgresReleaseAuditRecord, expectedMigrationBaseline?: number): PostgresCiReleaseEvidence {
  const evidence = verifyPostgresCiReleaseEvidence(audit, expectedMigrationBaseline)
  if (!evidence.verified) throw new Error('postgres CI release evidence failed: ' + evidence.failures.join('; '))
  return evidence
}
