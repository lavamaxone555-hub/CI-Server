export interface PostgresReleaseAuditInput {
  environment: 'development' | 'test' | 'production'
  evidenceReady: boolean
  releaseApproved: boolean
  migrationsApplied: number
  checks: readonly string[]
  releaseId?: string
  createdAt?: string
}

export interface PostgresReleaseAuditRecord {
  event: 'postgres-release-verification'
  releaseId?: string
  createdAt?: string
  environment: 'development' | 'test' | 'production'
  evidenceReady: boolean
  releaseApproved: boolean
  migrationsApplied: number
  checks: string[]
}

export function createPostgresReleaseAuditRecord(
  input: PostgresReleaseAuditInput,
): PostgresReleaseAuditRecord {
  return {
    event: 'postgres-release-verification',
    releaseId: input.releaseId ?? 'local',
    createdAt: input.createdAt ?? new Date().toISOString(),
    environment: input.environment,
    evidenceReady: input.evidenceReady,
    releaseApproved: input.releaseApproved,
    migrationsApplied: input.migrationsApplied,
    checks: [...input.checks],
  }
}
