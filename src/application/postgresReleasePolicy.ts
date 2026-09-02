export interface PostgresReleasePolicyInput {
  environment: 'development' | 'test' | 'production'
  evidenceReady: boolean
  migrationsApplied: number
}

export interface PostgresReleasePolicy {
  releasable: boolean
  reasons: string[]
}

export function evaluatePostgresReleasePolicy(
  input: PostgresReleasePolicyInput,
): PostgresReleasePolicy {
  const reasons: string[] = []

  if (!input.evidenceReady) reasons.push('deployment evidence is incomplete')
  if (input.environment === 'production' && input.migrationsApplied < 1) {
    reasons.push('production release requires an established migration baseline')
  }

  return { releasable: reasons.length === 0, reasons }
}
