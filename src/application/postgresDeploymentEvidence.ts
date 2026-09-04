export interface PostgresDeploymentEvidenceInput {
  migrationsApplied: number
  preflightChecks: readonly string[]
  recoveryChecks: readonly string[]
  postRestoreChecks: readonly string[]
  rollbackChecks: readonly string[]
}

export interface PostgresDeploymentEvidence {
  ready: boolean
  migrationsApplied: number
  checks: string[]
}

function hasControlCharacters(value: string): boolean {
  return Array.from(value, (character) => character.charCodeAt(0)).some((code) => code <= 0x1f || code === 0x7f)
}

function normalizeChecks(checks: readonly string[]): string[] {
  return checks.map((check) => check.trim())
}

function hasValidChecks(checks: readonly string[]): boolean {
  return checks.length > 0 && checks.every((check) => check.length > 0 && !hasControlCharacters(check))
}

export function createPostgresDeploymentEvidence(
  input: PostgresDeploymentEvidenceInput,
): PostgresDeploymentEvidence {
  const preflightChecks = normalizeChecks(input.preflightChecks)
  const recoveryChecks = normalizeChecks(input.recoveryChecks)
  const postRestoreChecks = normalizeChecks(input.postRestoreChecks)
  const rollbackChecks = normalizeChecks(input.rollbackChecks)
  const checks = [...preflightChecks, ...recoveryChecks, ...postRestoreChecks, ...rollbackChecks]
  const validMigrations = Number.isInteger(input.migrationsApplied) && input.migrationsApplied > 0
  const ready = validMigrations
    && hasValidChecks(preflightChecks)
    && hasValidChecks(recoveryChecks)
    && hasValidChecks(postRestoreChecks)
    && hasValidChecks(rollbackChecks)

  return {
    ready,
    migrationsApplied: input.migrationsApplied,
    checks,
  }
}
