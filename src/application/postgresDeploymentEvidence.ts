export interface PostgresDeploymentEvidenceInput {
  migrationsApplied: number
  preflightChecks: readonly string[]
  recoveryChecks: readonly string[]
  postRestoreChecks: readonly string[]
}

export interface PostgresDeploymentEvidence {
  ready: boolean
  migrationsApplied: number
  checks: string[]
}

export function createPostgresDeploymentEvidence(
  input: PostgresDeploymentEvidenceInput,
): PostgresDeploymentEvidence {
  const checks = [
    ...input.preflightChecks,
    ...input.recoveryChecks,
    ...input.postRestoreChecks,
  ]
  return {
    ready: input.migrationsApplied > 0 && checks.length > 0,
    migrationsApplied: input.migrationsApplied,
    checks,
  }
}
