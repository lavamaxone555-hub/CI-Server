export interface PostgresReleaseAuditInput {
  environment: 'development' | 'test' | 'production'
  evidenceReady: boolean
  releaseApproved: boolean
  migrationsApplied: number
  checks: readonly string[]
}

export interface PostgresReleaseAuditRecord {
  event: 'postgres-release-verification'
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
    environment: input.environment,
    evidenceReady: input.evidenceReady,
    releaseApproved: input.releaseApproved,
    migrationsApplied: input.migrationsApplied,
    checks: [...input.checks],
  }
}
