import { describe, expect, it } from 'vitest'
import { hasPostgresIntegrationEnvironment, loadPostgresIntegrationEnvironment } from './postgresIntegrationEnvironment'
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
})
