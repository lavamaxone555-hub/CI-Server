import { describe, expect, it } from 'vitest'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { hasPostgresIntegrationEnvironment, loadPostgresIntegrationEnvironment } from './postgresIntegrationEnvironment'
import { initializePostgresDatabase } from './postgresIntegration'
import { checkPostgresHealth } from './postgresHealthCheck'
import { checkPostgresReadiness } from './postgresReadiness'
import { readAppliedPostgresMigrations } from './postgresMigrationHistory'
import { writeMigrationSet } from './postgresMigrationFailureRecovery'
import { checksumMigration } from './migrationRunner'
import { createPostgresPool, verifyPostgresConnection } from './postgresDatabase'

const enabled = hasPostgresIntegrationEnvironment()

interface TableNameRow { table_name: string }
interface QueryResult { rows: TableNameRow[] }

describe.skipIf(!enabled)('live PostgreSQL integration', () => {
  it('connects to the explicitly configured PostgreSQL integration database', async () => {
    const env = loadPostgresIntegrationEnvironment()
    const pool = createPostgresPool(env)
    try { await verifyPostgresConnection(pool); expect(true).toBe(true) } finally { await pool.end() }
  })

  it('executes the migration set transactionally against the live PostgreSQL database', async () => {
    const env = loadPostgresIntegrationEnvironment()
    const migrations = await initializePostgresDatabase(env, join(process.cwd(), 'database', 'migrations'))
    expect(migrations.length).toBeGreaterThan(0)
  })

  it('rolls back live PostgreSQL migrations and history when a pending migration fails', async () => {
    const env = loadPostgresIntegrationEnvironment()
    const suffix = Date.now().toString(36)
    const table = `migration_rollback_${suffix}`
    const directory = await mkdtemp(join(tmpdir(), 'postgres-failure-'))
    const firstSql = `CREATE TABLE ${table} (id TEXT PRIMARY KEY)`
    const migrations = [
      { name: '900_live_first.sql', sql: firstSql, checksum: checksumMigration(firstSql) },
      { name: '901_live_broken.sql', sql: 'CREATE TABLE', checksum: checksumMigration('CREATE TABLE') },
    ]
    await writeMigrationSet(directory, migrations)
    await expect(initializePostgresDatabase(env, directory)).rejects.toThrow()
    const pool = createPostgresPool(env)
    try {
      const tableResult = await pool.query(
        `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '${table}'`,
      ) as QueryResult
      expect(tableResult.rows).toEqual([])
      const history = await readAppliedPostgresMigrations(pool)
      expect(history.map((migration) => migration.name)).not.toContain('900_live_first.sql')
    } finally { await pool.end() }
  })

  it('records applied migrations and returns no pending migrations on a second run', async () => {
    const env = loadPostgresIntegrationEnvironment()
    const migrationsDirectory = join(process.cwd(), 'database', 'migrations')
    await initializePostgresDatabase(env, migrationsDirectory)
    expect(await initializePostgresDatabase(env, migrationsDirectory)).toEqual([])
    const pool = createPostgresPool(env)
    try {
      const applied = await readAppliedPostgresMigrations(pool)
      expect(applied.length).toBeGreaterThan(0)
      expect(applied.every((migration) => migration.checksum.length === 64)).toBe(true)
    } finally { await pool.end() }
  })

  it('verifies the migrated retail schema on the live PostgreSQL database', async () => {
    const env = loadPostgresIntegrationEnvironment()
    const pool = createPostgresPool(env)
    try {
      const result = await pool.query(
        `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('sales', 'inventory_movements', 'payments', 'imei_units') ORDER BY table_name`,
      ) as QueryResult
      expect(result.rows.map((row) => row.table_name)).toEqual(['imei_units', 'inventory_movements', 'payments', 'sales'])
    } finally { await pool.end() }
  })

  it('reports healthy and ready after migrations on the live PostgreSQL database', async () => {
    const env = loadPostgresIntegrationEnvironment()
    const pool = createPostgresPool(env)
    try {
      expect((await checkPostgresHealth(pool)).status).toBe('ok')
      expect((await checkPostgresReadiness(pool)).ready).toBe(true)
    } finally { await pool.end() }
  })
})
