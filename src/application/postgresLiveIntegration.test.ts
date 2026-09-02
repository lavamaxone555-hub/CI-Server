import { describe, expect, it } from 'vitest'
import { join } from 'node:path'
import { hasPostgresIntegrationEnvironment, loadPostgresIntegrationEnvironment } from './postgresIntegrationEnvironment'
import { initializePostgresDatabase } from './postgresIntegration'
import { createPostgresPool, verifyPostgresConnection } from './postgresDatabase'

const enabled = hasPostgresIntegrationEnvironment()

interface TableNameRow {
  table_name: string
}

interface QueryResult {
  rows: TableNameRow[]
}

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

  it('verifies the migrated retail schema on the live PostgreSQL database', async () => {
    const env = loadPostgresIntegrationEnvironment()
    const pool = createPostgresPool(env)
    try {
      const result = await pool.query(
        `SELECT table_name FROM information_schema.tables
         WHERE table_schema = 'public'
           AND table_name IN ('sales', 'inventory_movements', 'payments', 'imei_units')
         ORDER BY table_name`,
      ) as QueryResult
      expect(result.rows.map((row) => row.table_name))
        .toEqual(['imei_units', 'inventory_movements', 'payments', 'sales'])
    } finally {
      await pool.end()
    }
  })
})
