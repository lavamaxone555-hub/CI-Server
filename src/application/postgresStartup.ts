import { initializePostgresDatabase } from './postgresIntegration'
import type { PostgresReadiness } from './postgresReadiness'
import { createPostgresPool } from './postgresDatabase'
import { loadPostgresDeploymentConfig } from './postgresDeploymentConfig'
import { verifyPostgresDeployment } from './postgresDeploymentVerification'
import { verifyPostgresDeploymentPreflight } from './postgresDeploymentPreflight'
import { verifyPostgresRecoveryReadiness } from './postgresRecoveryReadiness'
import { verifyPostgresPostRestore } from './postgresPostRestoreVerification'
import { createPostgresDeploymentEvidence } from './postgresDeploymentEvidence'
import { evaluatePostgresReleasePolicy } from './postgresReleasePolicy'
import { createPostgresReleaseAuditRecord } from './postgresReleaseAuditTrail'
import { assertPostgresCiReleaseEvidence } from './postgresCiReleaseEvidence'

export interface PostgresStartupResult {
  migrations: string[]
  readiness: PostgresReadiness
  migrationsApplied: number
  preflightChecks: string[]
  recoveryChecks: string[]
  postRestoreChecks: string[]
  releaseEvidenceReady: boolean
  releaseApproved: boolean
  releaseAuditEvent: string
}

export async function startPostgresInfrastructure(
  env: Record<string, string | undefined> = process.env,
): Promise<PostgresStartupResult> {
  const preflight = verifyPostgresDeploymentPreflight(env)
  if (!preflight.ready) throw new Error('database deployment preflight failed')

  const config = loadPostgresDeploymentConfig(env)
  const migrations = config.migrationOnStartup ? await initializePostgresDatabase(env) : []
  const pool = createPostgresPool(env)
  try {
    const verification = await verifyPostgresDeployment(pool)
    if (!verification.ready) throw new Error(verification.readiness.reason ?? 'database deployment verification failed')

    const recovery = await verifyPostgresRecoveryReadiness(pool)
    if (!recovery.ready) throw new Error(recovery.readiness.reason ?? 'database recovery verification failed')

    const postRestore = await verifyPostgresPostRestore(pool, verification.migrationsApplied)
    if (!postRestore.ready) throw new Error(postRestore.readiness.reason ?? 'database post-restore verification failed')

    const evidence = createPostgresDeploymentEvidence({
      migrationsApplied: verification.migrationsApplied,
      preflightChecks: preflight.checks,
      recoveryChecks: recovery.checks,
      postRestoreChecks: postRestore.checks,
    })
    if (!evidence.ready) throw new Error('database release evidence is incomplete')

    const policy = evaluatePostgresReleasePolicy({
      environment: config.environment,
      evidenceReady: evidence.ready,
      migrationsApplied: verification.migrationsApplied,
      migrationBaselineVerified: verification.migrationsApplied > 0,
    })
    if (!policy.releasable) throw new Error(policy.reasons.join('; '))

    const audit = createPostgresReleaseAuditRecord({
      environment: config.environment,
      evidenceReady: evidence.ready,
      releaseApproved: policy.releasable,
      migrationsApplied: verification.migrationsApplied,
      checks: evidence.checks,
    })
    assertPostgresCiReleaseEvidence(audit)

    return {
      migrations,
      readiness: verification.readiness,
      migrationsApplied: verification.migrationsApplied,
      preflightChecks: preflight.checks,
      recoveryChecks: recovery.checks,
      postRestoreChecks: postRestore.checks,
      releaseEvidenceReady: evidence.ready,
      releaseApproved: policy.releasable,
      releaseAuditEvent: audit.event,
    }
  } finally {
    await pool.end()
  }
}
