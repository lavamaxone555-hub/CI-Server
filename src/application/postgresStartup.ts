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
  readinessCheckedAt: string
  expectedMigrationBaseline: number
  releaseCommitSha?: string
}

export async function startPostgresInfrastructure(env: Record<string, string | undefined> = process.env): Promise<PostgresStartupResult> {
  const preflight = verifyPostgresDeploymentPreflight(env)
  if (!preflight.ready) throw new Error('database deployment preflight failed')
  const config = loadPostgresDeploymentConfig(env)
  const migrationsDirectory = join(process.cwd(), 'database', 'migrations')
  const migrations = config.migrationOnStartup ? await initializePostgresDatabase(env, migrationsDirectory) : []
  const pool = createPostgresPool(env)
  try {
    const health = await verifyPostgresHealth(pool, { maxLatencyMs: config.healthMaxLatencyMs })
    const readinessCheckedAt = new Date().toISOString()
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
      preflightChecks: preflight.checks, recoveryChecks: recovery.checks,
      postRestoreChecks: postRestore.checks, rollbackChecks: rollback.checks,
    })
    if (!evidence.ready) throw new Error('database release evidence is incomplete')

    const releaseTimestamp = new Date().toISOString()
    const releaseCommitSha = config.releaseCommitSha
    const policy = evaluatePostgresReleasePolicy({
      environment: config.environment, evidenceReady: evidence.ready,
      deploymentPreflightReady: preflight.ready, deploymentVerificationReady: verification.ready,
      migrationsApplied: verification.migrationsApplied, expectedMigrationBaseline: config.expectedMigrationBaseline,
      migrationBaselineVerified: verification.migrationsApplied >= config.expectedMigrationBaseline,
      rollbackReady: rollback.ready, releaseId: config.releaseId, releaseTimestamp, releaseCommitSha,
      verificationChecks: evidence.checks, readinessLatencyMs: health.latencyMs, readinessCheckedAt,
      ...(config.healthMaxLatencyMs !== undefined ? { maxReadinessLatencyMs: config.healthMaxLatencyMs } : {}),
      ...(config.releaseMaxAgeMs !== undefined ? { maxReleaseAgeMs: config.releaseMaxAgeMs } : {}),
      ...(config.readinessMaxAgeMs !== undefined ? { maxReadinessAgeMs: config.readinessMaxAgeMs } : {}),
      ...(config.evidenceMaxSkewMs !== undefined ? { maxEvidenceSkewMs: config.evidenceMaxSkewMs } : {}),
    })
    if (!policy.releasable) throw new Error(policy.reasons.join('; '))

    const audit = createPostgresReleaseAuditRecord({
      environment: config.environment, evidenceReady: evidence.ready, releaseApproved: policy.releasable,
      migrationsApplied: verification.migrationsApplied, checks: evidence.checks, releaseId: config.releaseId,
      createdAt: releaseTimestamp, expectedMigrationBaseline: config.expectedMigrationBaseline, releaseCommitSha,
    })
    assertPostgresCiReleaseEvidence(audit, config.expectedMigrationBaseline, {
      releaseId: config.releaseId, ...(releaseCommitSha ? { releaseCommitSha } : {}),
      ...(config.releaseMaxAgeMs !== undefined ? { maxEvidenceAgeMs: config.releaseMaxAgeMs } : {}),
    })
    return {
      migrations, readiness: verification.readiness, healthLatencyMs: health.latencyMs,
      migrationsApplied: verification.migrationsApplied, preflightChecks: preflight.checks,
      recoveryChecks: recovery.checks, postRestoreChecks: postRestore.checks, rollbackChecks: rollback.checks,
      releaseEvidenceReady: evidence.ready, releaseApproved: policy.releasable,
      releaseAuditEvent: audit.event, releaseId: config.releaseId, releaseTimestamp, readinessCheckedAt,
      expectedMigrationBaseline: config.expectedMigrationBaseline, releaseCommitSha,
    }
  } finally {
    await pool.end()
  }
}
