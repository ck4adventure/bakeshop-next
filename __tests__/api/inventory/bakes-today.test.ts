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

import { GET } from '@/app/api/inventory/bakes/today/route'

const BAKERY_ID = 'bakery-1'
const fakeSession = { user: { bakeryId: BAKERY_ID } }

describe('GET /api/inventory/bakes/today', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetServerSession.mockResolvedValue(fakeSession)
    mockPrisma.inventoryTransaction.findMany.mockResolvedValue([
      { id: 1, itemId: 10, delta: -12 },
      { id: 2, itemId: 11, delta: -6 },
    ])
  })

  it('returns 401 when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null)
    const res = await GET(new Request('http://localhost/api/inventory/bakes/today'))
    expect(res.status).toBe(401)
  })

  it('returns bakes for today when no from param provided', async () => {
    const res = await GET(new Request('http://localhost/api/inventory/bakes/today'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveLength(2)
    // delta is mapped to quantity in the response
    expect(body[0]).toEqual({ id: 1, itemId: 10, quantity: -12 })
    expect(body[1]).toEqual({ id: 2, itemId: 11, quantity: -6 })
  })

  it('filters by the provided from date', async () => {
    const fromDate = '2026-05-15'
    const res = await GET(new Request(`http://localhost/api/inventory/bakes/today?from=${fromDate}`))
    expect(res.status).toBe(200)

    const call = mockPrisma.inventoryTransaction.findMany.mock.calls[0][0]
    const { gte, lt } = call.where.createdAt
    expect(gte.toISOString().startsWith('2026-05-15')).toBe(true)
    expect(lt.getTime()).toBe(gte.getTime() + 24 * 60 * 60 * 1000)
  })

  it('queries only BAKE reason transactions for the bakery', async () => {
    await GET(new Request('http://localhost/api/inventory/bakes/today'))
    expect(mockPrisma.inventoryTransaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          reason: 'BAKE',
          product: { bakeryId: BAKERY_ID },
        }),
      })
    )
  })
})
