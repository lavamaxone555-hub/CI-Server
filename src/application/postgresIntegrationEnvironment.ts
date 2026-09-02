export function hasPostgresIntegrationEnvironment(
  env: Record<string, string | undefined> = process.env,
): boolean {
  return typeof env.POSTGRES_INTEGRATION_URL === 'string' && env.POSTGRES_INTEGRATION_URL.length > 0
}

export function loadPostgresIntegrationEnvironment(
  env: Record<string, string | undefined> = process.env,
): Record<string, string | undefined> {
  const connectionString = env.POSTGRES_INTEGRATION_URL
  if (!connectionString) throw new Error('POSTGRES_INTEGRATION_URL is required for live integration tests')
  return {
    DATABASE_URL: connectionString,
    DATABASE_SSL: env.POSTGRES_INTEGRATION_SSL ?? 'false',
    NODE_ENV: 'test',
  }
}
