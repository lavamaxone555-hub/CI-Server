import { loadPostgresDeploymentConfig } from './postgresDeploymentConfig'

export interface PostgresDeploymentPreflight {
  ready: boolean
  checks: string[]
}

export function verifyPostgresDeploymentPreflight(
  env: Record<string, string | undefined> = process.env,
): PostgresDeploymentPreflight {
  const config = loadPostgresDeploymentConfig(env)
  const checks = ['database configuration valid']

  if (config.environment === 'production') {
    checks.push('production SSL enabled')
    if (config.migrationOnStartup) checks.push('production migration explicitly approved')
    else checks.push('startup migrations disabled')
  }

  return { ready: true, checks }
}
