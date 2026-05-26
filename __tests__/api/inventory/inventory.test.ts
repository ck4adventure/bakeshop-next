import { vi, describe, it, expect, beforeEach } from 'vitest'

const mockGetServerSession = vi.hoisted(() => vi.fn())
const mockPrisma = vi.hoisted(() => ({
  itemInventory: {
    findMany: vi.fn(),
  },
}))

vi.mock('@/lib/prisma', () => ({ default: mockPrisma }))
vi.mock('next-auth', () => ({ getServerSession: mockGetServerSession }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))

import { GET } from '@/app/api/inventory/route'

const BAKERY_ID = 'bakery-1'
const fakeSession = { user: { bakeryId: BAKERY_ID } }

describe('GET /api/inventory', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetServerSession.mockResolvedValue(fakeSession)
    mockPrisma.itemInventory.findMany.mockResolvedValue([
      { itemId: 1, quantity: 10, item: { id: 1, name: 'Croissant', slug: 'croissant', par: 20, defaultBatchQty: 12, category: null } },
    ])
  })

  it('returns 401 when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null)
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns inventory filtered by bakery', async () => {
    const res = await GET()
    expect(res.status).toBe(200)
    expect(mockPrisma.itemInventory.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { item: { bakeryId: BAKERY_ID, hasInventory: true } } })
    )
    const body = await res.json()
    expect(body).toHaveLength(1)
    expect(body[0].quantity).toBe(10)
  })
})
