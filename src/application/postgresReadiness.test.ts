import { describe, expect, it } from 'vitest'
import { checkPostgresReadiness } from './postgresReadiness'

describe('PostgreSQL readiness', () => {
  it('reports ready when the database probe succeeds', async () => {
    await expect(checkPostgresReadiness({ query: async () => undefined, end: async () => undefined }))
      .resolves.toMatchObject({ ready: true })
  })

  it('reports not ready when the database probe fails', async () => {
    await expect(checkPostgresReadiness({ query: async () => { throw new Error('connection refused') }, end: async () => undefined }))
      .resolves.toEqual({ ready: false, reason: 'connection refused' })
  })
})
