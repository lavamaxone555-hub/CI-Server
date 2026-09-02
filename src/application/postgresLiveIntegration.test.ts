import { describe, expect, it } from 'vitest'
import { join } from 'node:path'
import { hasPostgresIntegrationEnvironment, loadPostgresIntegrationEnvironment } from './postgresIntegrationEnvironment'
import { initializePostgresDatabase } from './postgresIntegration'
import { checkPostgresHealth } from './postgresHealthCheck'
import { checkPostgresReadiness } from './postgresReadiness'
import { readAppliedPostgresMigrations } from './postgresMigrationHistory'
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

  it('executes the migration set transactionally against the live PostgreSQL database', async () => {
    const env = loadPostgresIntegrationEnvironment()
    const migrations = await initializePostgresDatabase(env, join(process.cwd(), 'database', 'migrations'))
    expect(migrations.length).toBeGreaterThan(0)
  })

  it('records applied migrations and returns no pending migrations on a second run', async () => {
    const env = loadPostgresIntegrationEnvironment()
    const migrationsDirectory = join(process.cwd(), 'database', 'migrations')
    await initializePostgresDatabase(env, migrationsDirectory)
    const second = await initializePostgresDatabase(env, migrationsDirectory)
    expect(second).toEqual([])
    const pool = createPostgresPool(env)
    try {
      const applied = await readAppliedPostgresMigrations(pool)
      expect(applied.length).toBeGreaterThan(0)
      expect(applied.every((migration) => migration.checksum.length === 64)).toBe(true)
    } finally {
      await pool.end()
    }
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

  it('reports healthy and ready after migrations on the live PostgreSQL database', async () => {
    const env = loadPostgresIntegrationEnvironment()
    const pool = createPostgresPool(env)
    try {
      const health = await checkPostgresHealth(pool)
      expect(health.status).toBe('ok')
      expect(health.latencyMs).toBeGreaterThanOrEqual(0)
      const readiness = await checkPostgresReadiness(pool)
      expect(readiness.ready).toBe(true)
      expect(readiness.latencyMs).toBeGreaterThanOrEqual(0)
    } finally {
      await pool.end()
    }
  })
})
