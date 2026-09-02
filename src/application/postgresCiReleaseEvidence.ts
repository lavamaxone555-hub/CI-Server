import type { PostgresReleaseAuditRecord } from './postgresReleaseAuditTrail'

export interface PostgresCiReleaseEvidence {
  verified: boolean
  summary: string
  audit: PostgresReleaseAuditRecord
}

export function verifyPostgresCiReleaseEvidence(
  audit: PostgresReleaseAuditRecord,
): PostgresCiReleaseEvidence {
  const verified = audit.evidenceReady
    && audit.releaseApproved
    && audit.migrationsApplied > 0
    && audit.checks.length > 0

  return {
    verified,
    summary: verified
      ? 'postgres release evidence verified'
      : 'postgres release evidence verification failed',
    audit,
  }
}
