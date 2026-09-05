import { join } from 'node:path'
import { initializePostgresDatabase } from './postgresIntegration'
import { loadMigrationSources } from './migrationRunner'
import { verifyPostgresMigrationHistory } from './postgresMigrationHistory'
import type { PostgresReadiness } from './postgresReadiness'
import { createPostgresPool } from './postgresDatabase'
import { loadPostgresDeploymentConfig } from './postgresDeploymentConfig'
import { verifyPostgresDeployment } from './postgresDeploymentVerification'
import { verifyPostgresDeploymentPreflight } from './postgresDeploymentPreflight'
import { verifyPostgresRecoveryReadiness } from './postgresRecoveryReadiness'
import { verifyPostgresPostRestore } from './postgresPostRestoreVerification'
import { verifyPostgresRollbackReadiness } from './postgresRollbackReadiness'
import { createPostgresDeploymentEvidence } from './postgresDeploymentEvidence'
import { evaluatePostgresReleasePolicy } from './postgresReleasePolicy'
import { createPostgresReleaseAuditRecord } from './postgresReleaseAuditTrail'
import { assertPostgresCiReleaseEvidence } from './postgresCiReleaseEvidence'
import { verifyPostgresHealth } from './postgresHealthCheck'

export interface PostgresStartupResult {
  migrations: string[]
  readiness: PostgresReadiness
  healthLatencyMs: number
  migrationsApplied: number
  preflightChecks: string[]
  recoveryChecks: string[]
  postRestoreChecks: string[]
  rollbackChecks: string[]
  releaseEvidenceReady: boolean
  releaseApproved: boolean
  releaseAuditEvent: string
  releaseId: string
  releaseTimestamp: string
  expectedMigrationBaseline: number
  releaseCommitSha?: string
}

function loadHealthLatencyLimit(env: Record<string, string | undefined>): number | undefined {
  const raw = env.DATABASE_HEALTH_MAX_LATENCY_MS?.trim()
  if (raw === undefined || raw === '') return undefined
  const value = Number(raw)
  if (!Number.isSafeInteger(value) || value < 0 || value > 300_000) {
    throw new Error('DATABASE_HEALTH_MAX_LATENCY_MS must be a non-negative integer')
  }
  return value
}

export async function startPostgresInfrastructure(
  env: Record<string, string | undefined> = process.env,
): Promise<PostgresStartupResult> {
  const healthLatencyLimit = loadHealthLatencyLimit(env)
  const preflight = verifyPostgresDeploymentPreflight(env)
  if (!preflight.ready) throw new Error('database deployment preflight failed')
  const config = loadPostgresDeploymentConfig(env)
  const migrationsDirectory = join(process.cwd(), 'database', 'migrations')
  const migrations = config.migrationOnStartup ? await initializePostgresDatabase(env, migrationsDirectory) : []
  const pool = createPostgresPool(env)
  try {
    const health = await verifyPostgresHealth(pool, { maxLatencyMs: healthLatencyLimit })
    const verification = await verifyPostgresDeployment(pool, config.expectedMigrationBaseline)
    if (!verification.ready) throw new Error(verification.readiness.reason ?? 'database deployment verification failed')

    const expectedMigrations = await loadMigrationSources(migrationsDirectory)
    await verifyPostgresMigrationHistory(pool, expectedMigrations)

    const recovery = await verifyPostgresRecoveryReadiness(pool, config.expectedMigrationBaseline, expectedMigrations)
    if (!recovery.ready) throw new Error(recovery.readiness.reason ?? 'database recovery verification failed')
    const postRestore = await verifyPostgresPostRestore(pool, config.expectedMigrationBaseline, expectedMigrations)
    if (!postRestore.ready) throw new Error(postRestore.readiness.reason ?? 'database post-restore verification failed')
    const rollback = verifyPostgresRollbackReadiness({ rollbackChecks: env.DATABASE_ROLLBACK_CHECKS?.split(',') })
    if (!rollback.ready) throw new Error('database rollback readiness verification failed')
    const evidence = createPostgresDeploymentEvidence({
      migrationsApplied: verification.migrationsApplied,
      preflightChecks: preflight.checks, recoveryChecks: recovery.checks, postRestoreChecks: postRestore.checks,
      rollbackChecks: rollback.checks,
    })
    if (!evidence.ready) throw new Error('database release evidence is incomplete')
    const releaseTimestamp = new Date().toISOString()
    const releaseCommitSha = env.RELEASE_COMMIT_SHA?.trim()
    const policy = evaluatePostgresReleasePolicy({
      environment: config.environment, evidenceReady: evidence.ready,
      migrationsApplied: verification.migrationsApplied,
      expectedMigrationBaseline: config.expectedMigrationBaseline,
      migrationBaselineVerified: verification.migrationsApplied >= config.expectedMigrationBaseline,
      rollbackReady: rollback.ready,
      releaseId: config.releaseId, releaseTimestamp, releaseCommitSha,
    })
    if (!policy.releasable) throw new Error(policy.reasons.join('; '))
    const audit = createPostgresReleaseAuditRecord({
      environment: config.environment, evidenceReady: evidence.ready, releaseApproved: policy.releasable,
      migrationsApplied: verification.migrationsApplied, checks: evidence.checks,
      releaseId: config.releaseId, createdAt: releaseTimestamp,
      expectedMigrationBaseline: config.expectedMigrationBaseline, releaseCommitSha,
    })
    assertPostgresCiReleaseEvidence(audit, config.expectedMigrationBaseline, {
      releaseId: config.releaseId,
      ...(releaseCommitSha ? { releaseCommitSha } : {}),
    })
    return {
      migrations, readiness: verification.readiness, healthLatencyMs: health.latencyMs,
      migrationsApplied: verification.migrationsApplied,
      preflightChecks: preflight.checks, recoveryChecks: recovery.checks, postRestoreChecks: postRestore.checks,
      rollbackChecks: rollback.checks,
      releaseEvidenceReady: evidence.ready, releaseApproved: policy.releasable,
      releaseAuditEvent: audit.event, releaseId: config.releaseId, releaseTimestamp,
      expectedMigrationBaseline: config.expectedMigrationBaseline, releaseCommitSha,
    }
  } finally {
    await pool.end()
  }
}
