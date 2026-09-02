import { describe, expect, it } from 'vitest'
import { join } from 'node:path'
import { hasPostgresIntegrationEnvironment, loadPostgresIntegrationEnvironment } from './postgresIntegrationEnvironment'
import { initializePostgresDatabase } from './postgresIntegration'
import { createPostgresPool, verifyPostgresConnection } from './postgresDatabase'

const enabled = hasPostgresIntegrationEnvironment()

describe.skipIf(!enabled)('live PostgreSQL integration', () => {
  it('connects to the explicitly configured PostgreSQL integration database', async () => {
    const env = loadPostgresIntegrationEnvironment()
    const pool = createPostgresPool(env)
    try {
      await verifyPostgresConnection(pool)
      expect(true).toBe(true)
    } finally {
      await pool.end()
    }
  })

  it('executes the migration set against the live PostgreSQL database', async () => {
    const env = loadPostgresIntegrationEnvironment()
    const migrations = await initializePostgresDatabase(env, join(process.cwd(), 'database', 'migrations'))
    expect(migrations.length).toBeGreaterThan(0)
  })
})
