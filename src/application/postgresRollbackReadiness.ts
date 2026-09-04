export interface PostgresRollbackReadinessInput {
  rollbackChecks?: readonly string[]
}

export interface PostgresRollbackReadiness {
  ready: boolean
  checks: string[]
  failures: string[]
}

function hasControlCharacters(value: string): boolean {
  return Array.from(value, (character) => character.charCodeAt(0)).some((code) => code <= 0x1f || code === 0x7f)
}

export function verifyPostgresRollbackReadiness(input: PostgresRollbackReadinessInput = {}): PostgresRollbackReadiness {
  const checks = [...(input.rollbackChecks ?? [])].map((check) => check.trim())
  const failures: string[] = []
  if (checks.length < 1) failures.push('rollback verification checks are missing')
  if (checks.some((check) => !check)) failures.push('rollback verification checks contain an empty entry')
  if (checks.some(hasControlCharacters)) failures.push('rollback verification checks contain control characters')
  if (new Set(checks).size !== checks.length) failures.push('rollback verification checks contain duplicate entries')
  return { ready: failures.length === 0, checks, failures }
}