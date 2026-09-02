import type { PostgresCiReleaseEvidence } from './postgresCiReleaseEvidence'

export interface PostgresCiReleaseEvidenceReport {
  status: 'passed' | 'failed'
  summary: string
  details: string[]
}

export function createPostgresCiReleaseEvidenceReport(
  evidence: PostgresCiReleaseEvidence,
): PostgresCiReleaseEvidenceReport {
  return {
    status: evidence.verified ? 'passed' : 'failed',
    summary: evidence.summary,
    details: evidence.verified
      ? [
          'deployment evidence verified',
          'release approved',
          'migration baseline verified',
          'verification checks present',
        ]
      : evidence.failures,
  }
}
