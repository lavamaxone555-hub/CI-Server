import type { PostgresCiReleaseEvidence } from './postgresCiReleaseEvidence'

export interface PostgresCiReleaseEvidenceReport {
  status: 'passed' | 'failed'
  summary: string
  details: string[]
}

export function createPostgresCiReleaseEvidenceReport(
  evidence: PostgresCiReleaseEvidence,
): PostgresCiReleaseEvidenceReport {
  if (!evidence.verified) {
    return {
      status: 'failed',
      summary: evidence.summary,
      details: evidence.failures,
    }
  }

  const details = [
    'deployment evidence verified',
    'release approved',
    'migration baseline verified',
    'verification checks present',
  ]

  if (evidence.audit.environment === 'production') {
    details.push(
      'release identity verified',
      'release timestamp verified',
      'release commit identity verified',
    )
  }

  if (evidence.audit.expectedMigrationBaseline !== undefined) {
    details.push('audited migration baseline verified')
  }

  return {
    status: 'passed',
    summary: evidence.summary,
    details,
  }
}
