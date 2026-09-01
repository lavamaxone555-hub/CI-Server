import { describe, expect, it, vi } from 'vitest'
import { withTransaction, type TransactionalRepository } from './transaction'

describe('withTransaction', () => {
  it('commits a successful operation', () => {
    const repository: TransactionalRepository = { begin: vi.fn(), commit: vi.fn(), rollback: vi.fn() }
    expect(withTransaction(repository, () => 42)).toBe(42)
    expect(repository.begin).toHaveBeenCalledOnce()
    expect(repository.commit).toHaveBeenCalledOnce()
    expect(repository.rollback).not.toHaveBeenCalled()
  })

  it('rolls back a failed operation and rethrows the original error', () => {
    const repository: TransactionalRepository = { begin: vi.fn(), commit: vi.fn(), rollback: vi.fn() }
    expect(() => withTransaction(repository, () => { throw new Error('boom') })).toThrow('boom')
    expect(repository.begin).toHaveBeenCalledOnce()
    expect(repository.rollback).toHaveBeenCalledOnce()
    expect(repository.commit).not.toHaveBeenCalled()
  })
})
