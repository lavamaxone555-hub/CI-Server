import { createHash } from 'node:crypto'
import type { PostgresReleaseAuditRecord } from './postgresReleaseAuditTrail'

export interface PostgresCiReleaseEvidence { verified: boolean; summary: string; failures: string[]; audit: PostgresReleaseAuditRecord }
export interface PostgresExpectedRelease { releaseId: string; releaseCommitSha?: string; evidenceFingerprint?: string; maxEvidenceAgeMs?: number; maxFutureSkewMs?: number }

function isCommitSha(value: string | undefined): boolean { return !!value && /^[0-9a-f]{7,64}$/i.test(value) }
function hasControlCharacters(value: string): boolean { return Array.from(value, c => c.charCodeAt(0)).some(code => code <= 0x1f || code === 0x7f) }
function canonicalizeEvidenceCheck(check: string): string { return check.normalize('NFC').trim() }
function canonicalizeReleaseId(value: string): string { return value.normalize('NFC').trim() }
function canonicalizeCommitSha(value: string): string { return value.normalize('NFC').trim().toLowerCase() }
function canonicalizeTimestamp(value: string): string | undefined { const parsed = new Date(value); return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString() }

export function createPostgresReleaseEvidenceFingerprint(audit: PostgresReleaseAuditRecord): string {
  const payload = JSON.stringify({ releaseId: audit.releaseId === undefined ? '' : canonicalizeReleaseId(audit.releaseId), releaseCommitSha: audit.releaseCommitSha === undefined ? '' : canonicalizeCommitSha(audit.releaseCommitSha), createdAt: audit.createdAt === undefined ? '' : canonicalizeTimestamp(audit.createdAt) ?? audit.createdAt, migrationsApplied: audit.migrationsApplied, checks: audit.checks.map(canonicalizeEvidenceCheck).sort() })
  return createHash('sha256').update(payload).digest('hex')
}
function hasDuplicateChecks(checks: readonly string[]): boolean { const normalized = checks.map(canonicalizeEvidenceCheck); return new Set(normalized).size !== normalized.length }
function validateExpectedRelease(expected: PostgresExpectedRelease | undefined, failures: string[]): number {
  if (!expected) return 5 * 60 * 1000
  const id = canonicalizeReleaseId(expected.releaseId)
  if (!id) failures.push('expected release identity is invalid')
  else if (hasControlCharacters(id)) failures.push('expected release identity contains control characters')
  if (expected.maxFutureSkewMs === undefined) return 5 * 60 * 1000
  if (!Number.isSafeInteger(expected.maxFutureSkewMs) || expected.maxFutureSkewMs < 0 || expected.maxFutureSkewMs > 60 * 60 * 1000) {
    failures.push('release evidence future skew window is invalid')
    return 5 * 60 * 1000
  }
  return expected.maxFutureSkewMs
}

export function verifyPostgresCiReleaseEvidence(audit: PostgresReleaseAuditRecord, expectedMigrationBaseline?: number, expectedRelease?: PostgresExpectedRelease, nowMs = Date.now()): PostgresCiReleaseEvidence {
  const failures: string[] = []
  if (!Number.isSafeInteger(nowMs) || nowMs < 0) failures.push('verification clock is invalid')
  const baseline = expectedMigrationBaseline ?? audit.expectedMigrationBaseline ?? 1
  if (!Number.isInteger(baseline) || baseline < 1) failures.push('expected migration baseline is invalid')
  if (expectedMigrationBaseline !== undefined && audit.expectedMigrationBaseline !== undefined && expectedMigrationBaseline !== audit.expectedMigrationBaseline) failures.push('release evidence baseline does not match audit baseline')
  const auditReleaseId = audit.releaseId === undefined ? '' : canonicalizeReleaseId(audit.releaseId)
  if (!auditReleaseId) failures.push('release identity is missing')
  else if (hasControlCharacters(auditReleaseId)) failures.push('release identity contains control characters')
  const futureSkewMs = validateExpectedRelease(expectedRelease, failures)
  if (expectedRelease) {
    const expectedReleaseId = canonicalizeReleaseId(expectedRelease.releaseId)
    if (expectedReleaseId && !hasControlCharacters(expectedReleaseId) && auditReleaseId !== expectedReleaseId) failures.push('release evidence identity does not match expected release')
  }
  const fingerprint = createPostgresReleaseEvidenceFingerprint(audit)
  if (expectedRelease?.evidenceFingerprint !== undefined) {
    const expected = expectedRelease.evidenceFingerprint.normalize('NFC').trim().toLowerCase()
    if (!/^[0-9a-f]{64}$/.test(expected)) failures.push('release evidence fingerprint is invalid')
    else if (fingerprint !== expected) failures.push('release evidence fingerprint does not match expected evidence')
  }
  const auditTimestamp = audit.createdAt === undefined ? undefined : canonicalizeTimestamp(audit.createdAt)
  if (!auditTimestamp) failures.push('release timestamp is invalid')
  else {
    const timestampMs = Date.parse(auditTimestamp)
    if (audit.createdAt !== auditTimestamp) failures.push('release timestamp is not canonical')
    if (timestampMs > nowMs && timestampMs - nowMs > futureSkewMs) failures.push('release timestamp is too far in the future')
    if (expectedRelease?.maxEvidenceAgeMs !== undefined) {
      const age = expectedRelease.maxEvidenceAgeMs
      if (!Number.isSafeInteger(age) || age < 0 || age > 365 * 24 * 60 * 60 * 1000) failures.push('release evidence freshness window is invalid')
      else if (nowMs - timestampMs > age) failures.push('release evidence is stale')
    }
  }
  const auditCommitSha = audit.releaseCommitSha === undefined ? undefined : canonicalizeCommitSha(audit.releaseCommitSha)
  if (audit.environment === 'production' && !isCommitSha(auditCommitSha)) failures.push('release commit identity is invalid')
  if (expectedRelease?.releaseCommitSha !== undefined) {
    const expected = canonicalizeCommitSha(expectedRelease.releaseCommitSha)
    if (!isCommitSha(expected)) failures.push('expected release commit identity is invalid')
    else if (auditCommitSha !== expected) failures.push('release evidence commit does not match expected release')
  }
  if (!Number.isInteger(audit.migrationsApplied) || audit.migrationsApplied < 0) failures.push('applied migration count is invalid')
  if (!audit.evidenceReady) failures.push('deployment evidence is incomplete')
  if (!audit.releaseApproved) failures.push('release approval is missing')
  if (audit.migrationsApplied < baseline) failures.push('migration baseline is below the expected level')
  if (audit.checks.length < 1) failures.push('verification checks are missing')
  if (audit.checks.some(check => !canonicalizeEvidenceCheck(check))) failures.push('verification checks contain an empty entry')
  if (audit.checks.some(hasControlCharacters)) failures.push('verification checks contain control characters')
  if (hasDuplicateChecks(audit.checks)) failures.push('verification checks contain duplicate entries')
  const verified = failures.length === 0
  return { verified, summary: verified ? 'postgres release evidence verified' : 'postgres release evidence verification failed', failures, audit }
}
export function assertPostgresCiReleaseEvidence(audit: PostgresReleaseAuditRecord, expectedMigrationBaseline?: number, expectedRelease?: PostgresExpectedRelease, nowMs?: number): PostgresCiReleaseEvidence {
  const evidence = verifyPostgresCiReleaseEvidence(audit, expectedMigrationBaseline, expectedRelease, nowMs)
  if (!evidence.verified) throw new Error('postgres CI release evidence failed: ' + evidence.failures.join('; '))
  return evidence
}