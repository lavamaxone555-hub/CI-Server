export function hasPostgresIntegrationEnvironment(
  env: Record<string, string | undefined> = process.env,
): boolean {
  return typeof env.POSTGRES_INTEGRATION_URL === 'string' && env.POSTGRES_INTEGRATION_URL.normalize('NFC').trim().length > 0
}

export function loadPostgresIntegrationEnvironment(
  env: Record<string, string | undefined> = process.env,
): Record<string, string | undefined> {
  const connectionString = env.POSTGRES_INTEGRATION_URL?.normalize('NFC').trim()
  if (!connectionString) throw new Error('POSTGRES_INTEGRATION_URL is required for live integration tests')
  const rawSsl = env.POSTGRES_INTEGRATION_SSL?.normalize('NFC').trim().toLowerCase()
  if (rawSsl === '') throw new Error('POSTGRES_INTEGRATION_SSL must not be empty')
  if (rawSsl !== undefined && rawSsl !== 'true' && rawSsl !== 'false') {
    throw new Error('POSTGRES_INTEGRATION_SSL must be true or false')
  }
  return {
    DATABASE_URL: connectionString,
    DATABASE_SSL: rawSsl ?? 'false',
    NODE_ENV: 'test',
  }
}
