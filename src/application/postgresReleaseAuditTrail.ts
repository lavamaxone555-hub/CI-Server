export interface PostgresReleaseAuditInput {
  environment: 'development' | 'test' | 'production'
  evidenceReady: boolean
  releaseApproved: boolean
  migrationsApplied: number
  checks: readonly string[]
  releaseId?: string
  createdAt?: string
  expectedMigrationBaseline?: number
  releaseCommitSha?: string
}

export interface PostgresReleaseAuditRecord {
  event: 'postgres-release-verification'
  releaseId?: string
  createdAt?: string
  environment: 'development' | 'test' | 'production'
  evidenceReady: boolean
  releaseApproved: boolean
  migrationsApplied: number
  expectedMigrationBaseline?: number
  releaseCommitSha?: string
  checks: readonly string[]
}

function freezeAuditRecord(record: PostgresReleaseAuditRecord): PostgresReleaseAuditRecord {
  return Object.freeze({
    ...record,
    checks: Object.freeze([...record.checks]),
  })
}

export function createPostgresReleaseAuditRecord(input: PostgresReleaseAuditInput): PostgresReleaseAuditRecord {
  return freezeAuditRecord({
    event: 'postgres-release-verification',
    releaseId: input.releaseId ?? 'local',
    createdAt: input.createdAt ?? new Date().toISOString(),
    environment: input.environment,
    evidenceReady: input.evidenceReady,
    releaseApproved: input.releaseApproved,
    migrationsApplied: input.migrationsApplied,
    ...(input.expectedMigrationBaseline === undefined ? {} : { expectedMigrationBaseline: input.expectedMigrationBaseline }),
    ...(input.releaseCommitSha === undefined ? {} : { releaseCommitSha: input.releaseCommitSha }),
    checks: [...input.checks],
  })
}
