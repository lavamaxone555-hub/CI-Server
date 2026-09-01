import { describe, expect, it, vi } from 'vitest'
import { withTransaction, type TransactionalRepository } from './transaction'

describe('withTransaction', () => {
  it('commits successful work', () => {
    const repository: TransactionalRepository = { begin: vi.fn(), commit: vi.fn(), rollback: vi.fn() }
    expect(withTransaction(repository, () => 42)).toBe(42)
    expect(repository.begin).toHaveBeenCalledOnce()
    expect(repository.commit).toHaveBeenCalledOnce()
    expect(repository.rollback).not.toHaveBeenCalled()
  })

  it('rolls back failed work', () => {
    const repository: TransactionalRepository = { begin: vi.fn(), commit: vi.fn(), rollback: vi.fn() }
    expect(() => withTransaction(repository, () => { throw new Error('boom') })).toThrow('boom')
    expect(repository.rollback).toHaveBeenCalledOnce()
  })
})
