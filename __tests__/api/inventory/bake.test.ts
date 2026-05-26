import { vi, describe, it, expect, beforeEach } from 'vitest'

const mockGetServerSession = vi.hoisted(() => vi.fn())
const mockPrisma = vi.hoisted(() => ({
  item: {
    findFirst: vi.fn(),
  },
  inventoryTransaction: {
    findFirst: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock('@/lib/prisma', () => ({ default: mockPrisma }))
vi.mock('next-auth', () => ({ getServerSession: mockGetServerSession }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))

import { POST } from '@/app/api/inventory/bake/route'
import { DELETE } from '@/app/api/inventory/bake/[id]/route'

const BAKERY_ID = 'bakery-1'
const fakeSession = { user: { bakeryId: BAKERY_ID } }
const fakeItem = { id: 1, name: 'Croissant', bakeryId: BAKERY_ID, hasInventory: true }
const fakeBakeTransaction = { id: 42, itemId: 1, delta: -12, reason: 'BAKE' }

function makePostRequest(body: object) {
  return new Request('http://localhost/api/inventory/bake', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function makeDeleteParams(id: string) {
  return { params: Promise.resolve({ id }) }
}

describe('POST /api/inventory/bake', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetServerSession.mockResolvedValue(fakeSession)
    mockPrisma.item.findFirst.mockResolvedValue(fakeItem)
    mockPrisma.inventoryTransaction.create.mockResolvedValue(fakeBakeTransaction)
  })

  it('returns 401 when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null)
    const res = await POST(makePostRequest({ itemId: 1, quantity: 12 }))
    expect(res.status).toBe(401)
  })

  it('returns 400 when itemId is not a number', async () => {
    const res = await POST(makePostRequest({ itemId: 'abc', quantity: 12 }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when quantity is negative', async () => {
    const res = await POST(makePostRequest({ itemId: 1, quantity: -5 }))
    expect(res.status).toBe(400)
  })

  it('returns 404 when item does not belong to bakery', async () => {
    mockPrisma.item.findFirst.mockResolvedValue(null)
    const res = await POST(makePostRequest({ itemId: 1, quantity: 12 }))
    expect(res.status).toBe(404)
  })

  it('returns 400 when item does not track inventory', async () => {
    mockPrisma.item.findFirst.mockResolvedValue({ ...fakeItem, hasInventory: false })
    const res = await POST(makePostRequest({ itemId: 1, quantity: 12 }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.message).toBe('Item does not track inventory')
  })

  it('returns 422 when DB trigger raises negative stock error', async () => {
    mockPrisma.inventoryTransaction.create.mockRejectedValue(new Error('Stock cannot go negative'))
    const res = await POST(makePostRequest({ itemId: 1, quantity: 12 }))
    expect(res.status).toBe(422)
  })

  it('creates BAKE transaction with negative delta and returns 201', async () => {
    const res = await POST(makePostRequest({ itemId: 1, quantity: 12 }))
    expect(res.status).toBe(201)
    expect(mockPrisma.inventoryTransaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ itemId: 1, delta: -12, reason: 'BAKE' }),
      })
    )
    const body = await res.json()
    expect(body.id).toBe(42)
  })

  it('includes optional note in transaction note field', async () => {
    await POST(makePostRequest({ itemId: 1, quantity: 12, note: 'rushed batch' }))
    expect(mockPrisma.inventoryTransaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ note: 'daily bake, rushed batch' }),
      })
    )
  })

  it('uses default note when none provided', async () => {
    await POST(makePostRequest({ itemId: 1, quantity: 12 }))
    expect(mockPrisma.inventoryTransaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ note: 'daily bake' }),
      })
    )
  })
})

describe('DELETE /api/inventory/bake/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetServerSession.mockResolvedValue(fakeSession)
    mockPrisma.inventoryTransaction.findFirst.mockResolvedValue(fakeBakeTransaction)
    mockPrisma.inventoryTransaction.delete.mockResolvedValue(fakeBakeTransaction)
  })

  it('returns 401 when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null)
    const res = await DELETE(new Request('http://localhost'), makeDeleteParams('42'))
    expect(res.status).toBe(401)
  })

  it('returns 400 when id is not a valid integer', async () => {
    const res = await DELETE(new Request('http://localhost'), makeDeleteParams('abc'))
    expect(res.status).toBe(400)
  })

  it('returns 400 when id is 0', async () => {
    const res = await DELETE(new Request('http://localhost'), makeDeleteParams('0'))
    expect(res.status).toBe(400)
  })

  it('returns 404 when bake transaction is not found', async () => {
    mockPrisma.inventoryTransaction.findFirst.mockResolvedValue(null)
    const res = await DELETE(new Request('http://localhost'), makeDeleteParams('42'))
    expect(res.status).toBe(404)
  })

  it('deletes the bake transaction and returns 204', async () => {
    const res = await DELETE(new Request('http://localhost'), makeDeleteParams('42'))
    expect(res.status).toBe(204)
    expect(mockPrisma.inventoryTransaction.delete).toHaveBeenCalledWith({ where: { id: 42 } })
  })
})
