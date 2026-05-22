import { vi, describe, it, expect, beforeEach } from 'vitest'

const mockGetServerSession = vi.hoisted(() => vi.fn())
const mockPrisma = vi.hoisted(() => ({
  itemInventory: {
    findUnique: vi.fn(),
  },
  inventoryTransaction: {
    create: vi.fn(),
  },
}))

vi.mock('@/lib/prisma', () => ({ default: mockPrisma }))
vi.mock('next-auth', () => ({ getServerSession: mockGetServerSession }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))

import { POST } from '@/app/api/inventory/adjust/route'

const BAKERY_ID = 'bakery-1'
const fakeSession = { user: { bakeryId: BAKERY_ID } }
const fakeInventory = { itemId: 1, quantity: 10 }
const fakeTransaction = { id: 99, itemId: 1, delta: -3, reason: 'ADJUSTMENT', note: 'broken' }

function makeRequest(body: object) {
  return new Request('http://localhost/api/inventory/adjust', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/inventory/adjust', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetServerSession.mockResolvedValue(fakeSession)
    mockPrisma.itemInventory.findUnique.mockResolvedValue(fakeInventory)
    mockPrisma.inventoryTransaction.create.mockResolvedValue(fakeTransaction)
  })

  it('returns 401 when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null)
    const res = await POST(makeRequest({ itemId: 1, delta: -3, note: 'broken' }))
    expect(res.status).toBe(401)
  })

  it('returns 400 when itemId is not a number', async () => {
    const res = await POST(makeRequest({ itemId: 'abc', delta: -3, note: 'broken' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when delta is 0', async () => {
    const res = await POST(makeRequest({ itemId: 1, delta: 0, note: 'broken' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when note is missing', async () => {
    const res = await POST(makeRequest({ itemId: 1, delta: -3 }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when note is only whitespace', async () => {
    const res = await POST(makeRequest({ itemId: 1, delta: -3, note: '  ' }))
    expect(res.status).toBe(400)
  })

  it('returns 404 when item is not in inventory', async () => {
    mockPrisma.itemInventory.findUnique.mockResolvedValue(null)
    const res = await POST(makeRequest({ itemId: 1, delta: -3, note: 'broken' }))
    expect(res.status).toBe(404)
  })

  it('returns 422 when adjustment would result in negative stock (pre-check)', async () => {
    mockPrisma.itemInventory.findUnique.mockResolvedValue({ itemId: 1, quantity: 2 })
    const res = await POST(makeRequest({ itemId: 1, delta: -5, note: 'broken' }))
    expect(res.status).toBe(422)
    expect(mockPrisma.inventoryTransaction.create).not.toHaveBeenCalled()
  })

  it('returns 422 when DB trigger raises negative stock error', async () => {
    mockPrisma.inventoryTransaction.create.mockRejectedValue(new Error('Stock cannot go negative'))
    const res = await POST(makeRequest({ itemId: 1, delta: -3, note: 'broken' }))
    expect(res.status).toBe(422)
  })

  it('creates ADJUSTMENT transaction and returns 200 on success', async () => {
    const res = await POST(makeRequest({ itemId: 1, delta: -3, note: 'dropped on floor' }))
    expect(res.status).toBe(200)
    expect(mockPrisma.inventoryTransaction.create).toHaveBeenCalledWith({
      data: { itemId: 1, delta: -3, reason: 'ADJUSTMENT', note: 'dropped on floor' },
    })
  })
})
