import { loadPostgresDeploymentConfig } from './postgresDeploymentConfig'

export interface PostgresDeploymentPreflight {
  ready: boolean
  checks: string[]
  failures: string[]
}

export function verifyPostgresDeploymentPreflight(
  env: Record<string, string | undefined> = process.env,
): PostgresDeploymentPreflight {
  const config = loadPostgresDeploymentConfig(env)
  const checks = ['database configuration valid']
  const failures: string[] = []

  if (config.environment === 'production') {
    if (config.ssl) checks.push('production SSL enabled')
    else failures.push('production SSL must be enabled')

    if (config.releaseId.trim()) checks.push('production release identity verified')
    else failures.push('production release identity is missing')

    if (Number.isInteger(config.expectedMigrationBaseline) && config.expectedMigrationBaseline >= 1) {
      checks.push('production migration baseline configured')
    } else {
      failures.push('production migration baseline is invalid')
    }

    if (config.migrationOnStartup) checks.push('production migration explicitly approved')
    else checks.push('startup migrations disabled')
  }

  return { ready: failures.length === 0, checks, failures }
}
