import type { PostgresReleaseAuditRecord } from './postgresReleaseAuditTrail'

export interface PostgresCiReleaseEvidence {
  verified: boolean
  summary: string
  failures: string[]
  audit: PostgresReleaseAuditRecord
}

export function verifyPostgresCiReleaseEvidence(
  audit: PostgresReleaseAuditRecord,
  expectedMigrationBaseline = 1,
): PostgresCiReleaseEvidence {
  const failures: string[] = []
  if (!Number.isInteger(expectedMigrationBaseline) || expectedMigrationBaseline < 1) {
    failures.push('expected migration baseline is invalid')
  }
  if (!audit.evidenceReady) failures.push('deployment evidence is incomplete')
  if (!audit.releaseApproved) failures.push('release approval is missing')
  if (audit.migrationsApplied < expectedMigrationBaseline) {
    failures.push('migration baseline is below the expected level')
  }
  if (audit.checks.length < 1) failures.push('verification checks are missing')
  const verified = failures.length === 0
  return {
    verified,
    summary: verified ? 'postgres release evidence verified' : 'postgres release evidence verification failed',
    failures,
    audit,
  }
}

export function assertPostgresCiReleaseEvidence(
  audit: PostgresReleaseAuditRecord,
  expectedMigrationBaseline = 1,
): PostgresCiReleaseEvidence {
  const evidence = verifyPostgresCiReleaseEvidence(audit, expectedMigrationBaseline)
  if (!evidence.verified) throw new Error('postgres CI release evidence failed: ' + evidence.failures.join('; '))
  return evidence
}
