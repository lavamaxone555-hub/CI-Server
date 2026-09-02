import type { PostgresReleaseAuditRecord } from './postgresReleaseAuditTrail'

export interface PostgresCiReleaseEvidence {
  verified: boolean
  summary: string
  failures: string[]
  audit: PostgresReleaseAuditRecord
}

export function verifyPostgresCiReleaseEvidence(audit: PostgresReleaseAuditRecord): PostgresCiReleaseEvidence {
  const failures: string[] = []
  if (!audit.evidenceReady) failures.push('deployment evidence is incomplete')
  if (!audit.releaseApproved) failures.push('release approval is missing')
  if (audit.migrationsApplied < 1) failures.push('migration baseline is missing')
  if (audit.checks.length < 1) failures.push('verification checks are missing')
  const verified = failures.length === 0
  return { verified, summary: verified ? 'postgres release evidence verified' : 'postgres release evidence verification failed', failures, audit }
}

export function assertPostgresCiReleaseEvidence(audit: PostgresReleaseAuditRecord): PostgresCiReleaseEvidence {
  const evidence = verifyPostgresCiReleaseEvidence(audit)
  if (!evidence.verified) throw new Error('postgres CI release evidence failed: ' + evidence.failures.join('; '))
  return evidence
}
