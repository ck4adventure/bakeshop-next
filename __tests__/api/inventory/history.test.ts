import { vi, describe, it, expect, beforeEach } from 'vitest'

const mockGetServerSession = vi.hoisted(() => vi.fn())
const mockPrisma = vi.hoisted(() => ({
  inventoryTransaction: {
    findMany: vi.fn(),
  },
}))

vi.mock('@/lib/prisma', () => ({ default: mockPrisma }))
vi.mock('next-auth', () => ({ getServerSession: mockGetServerSession }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))

import { GET } from '@/app/api/inventory/history/route'

const BAKERY_ID = 'bakery-1'
const fakeSession = { user: { bakeryId: BAKERY_ID } }

function makeTransaction(overrides: object) {
  return {
    id: 1,
    itemId: 1,
    delta: -12,
    stockAfter: 8,
    note: null,
    createdAt: new Date('2026-05-01T10:00:00Z'),
    product: { name: 'Croissant', slug: 'croissant' },
    reason: 'BAKE',
    ...overrides,
  }
}

describe('GET /api/inventory/history', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetServerSession.mockResolvedValue(fakeSession)
  })

  it('returns 401 when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null)
    mockPrisma.inventoryTransaction.findMany.mockResolvedValue([])
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('maps BATCH reason to type "batch"', async () => {
    mockPrisma.inventoryTransaction.findMany.mockResolvedValue([
      makeTransaction({ reason: 'BATCH', delta: 24 }),
    ])
    const res = await GET()
    const body = await res.json()
    expect(body[0].type).toBe('batch')
  })

  it('maps BAKE reason to type "bake"', async () => {
    mockPrisma.inventoryTransaction.findMany.mockResolvedValue([
      makeTransaction({ reason: 'BAKE', delta: -12 }),
    ])
    const res = await GET()
    const body = await res.json()
    expect(body[0].type).toBe('bake')
  })

  it('maps ADJUSTMENT reason to type "adjustment"', async () => {
    mockPrisma.inventoryTransaction.findMany.mockResolvedValue([
      makeTransaction({ reason: 'ADJUSTMENT', delta: -2 }),
    ])
    const res = await GET()
    const body = await res.json()
    expect(body[0].type).toBe('adjustment')
  })

  it('maps INITIAL reason to type "adjustment"', async () => {
    mockPrisma.inventoryTransaction.findMany.mockResolvedValue([
      makeTransaction({ reason: 'INITIAL', delta: 10 }),
    ])
    const res = await GET()
    const body = await res.json()
    expect(body[0].type).toBe('adjustment')
  })

  it('returns createdAt as ISO string', async () => {
    mockPrisma.inventoryTransaction.findMany.mockResolvedValue([
      makeTransaction({}),
    ])
    const res = await GET()
    const body = await res.json()
    expect(body[0].createdAt).toBe('2026-05-01T10:00:00.000Z')
  })

  it('queries transactions filtered by bakery', async () => {
    mockPrisma.inventoryTransaction.findMany.mockResolvedValue([])
    await GET()
    expect(mockPrisma.inventoryTransaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { product: { bakeryId: BAKERY_ID } },
      })
    )
  })
})
