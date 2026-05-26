import { vi, describe, it, expect, beforeEach } from 'vitest'

const mockGetServerSession = vi.hoisted(() => vi.fn())
const mockPrisma = vi.hoisted(() => ({
  item: {
    findFirst: vi.fn(),
  },
  inventoryTransaction: {
    create: vi.fn(),
  },
}))

vi.mock('@/lib/prisma', () => ({ default: mockPrisma }))
vi.mock('next-auth', () => ({ getServerSession: mockGetServerSession }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))

import { POST } from '@/app/api/inventory/batches/route'

const BAKERY_ID = 'bakery-1'
const fakeSession = { user: { bakeryId: BAKERY_ID } }
const fakeItem = { id: 1, name: 'Croissant', bakeryId: BAKERY_ID, hasInventory: true }
const fakeTransaction = { id: 5, itemId: 1, delta: 24, reason: 'BATCH', note: 'batch added' }

function makeRequest(body: object) {
  return new Request('http://localhost/api/inventory/batches', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/inventory/batches', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetServerSession.mockResolvedValue(fakeSession)
    mockPrisma.item.findFirst.mockResolvedValue(fakeItem)
    mockPrisma.inventoryTransaction.create.mockResolvedValue(fakeTransaction)
  })

  it('returns 401 when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null)
    const res = await POST(makeRequest({ itemId: 1, quantity: 24 }))
    expect(res.status).toBe(401)
  })

  it('returns 400 when itemId is not a valid integer', async () => {
    const res = await POST(makeRequest({ itemId: 'abc', quantity: 24 }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when itemId is 0', async () => {
    const res = await POST(makeRequest({ itemId: 0, quantity: 24 }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when quantity is 0', async () => {
    const res = await POST(makeRequest({ itemId: 1, quantity: 0 }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when quantity is negative', async () => {
    const res = await POST(makeRequest({ itemId: 1, quantity: -5 }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when quantity is a float', async () => {
    const res = await POST(makeRequest({ itemId: 1, quantity: 1.5 }))
    expect(res.status).toBe(400)
  })

  it('returns 404 when item does not belong to bakery', async () => {
    mockPrisma.item.findFirst.mockResolvedValue(null)
    const res = await POST(makeRequest({ itemId: 1, quantity: 24 }))
    expect(res.status).toBe(404)
  })

  it('returns 400 when item does not track inventory', async () => {
    mockPrisma.item.findFirst.mockResolvedValue({ ...fakeItem, hasInventory: false })
    const res = await POST(makeRequest({ itemId: 1, quantity: 24 }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.message).toBe('Item does not track inventory')
  })

  it('creates BATCH transaction and returns 201', async () => {
    const res = await POST(makeRequest({ itemId: 1, quantity: 24 }))
    expect(res.status).toBe(201)
    expect(mockPrisma.inventoryTransaction.create).toHaveBeenCalledWith({
      data: { itemId: 1, delta: 24, reason: 'BATCH', note: 'batch added' },
    })
  })
})
