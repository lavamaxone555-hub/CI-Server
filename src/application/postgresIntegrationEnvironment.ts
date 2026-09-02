export function shouldRunPostgresIntegration(env: Record<string, string | undefined> = process.env): boolean {
  return Boolean(env.DATABASE_URL)
}

export function requirePostgresIntegrationUrl(env: Record<string, string | undefined> = process.env): string {
  const url = env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is required for PostgreSQL integration tests')
  return url
}
