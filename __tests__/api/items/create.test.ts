import { vi, describe, it, expect, beforeEach } from 'vitest'

const mockGetServerSession = vi.hoisted(() => vi.fn())

const mockPrisma = vi.hoisted(() => ({
  item: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
  },
  category: {
    findFirst: vi.fn(),
  },
  inventoryTransaction: {
    create: vi.fn(),
  },
  itemInventory: {
    create: vi.fn(),
  },
}))

vi.mock('@/lib/prisma', () => ({ default: mockPrisma }))
vi.mock('next-auth', () => ({ getServerSession: mockGetServerSession }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))

import { POST } from '@/app/api/items/route'

const BAKERY_ID = 'bakery-1'

const fakeItem = {
  id: 1,
  name: 'Croissant',
  slug: 'croissant',
  par: null,
  defaultBatchQty: null,
  categoryId: null,
  bakeryId: BAKERY_ID,
  category: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

function makeRequest(body: object) {
  return new Request('http://localhost/api/items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/items', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetServerSession.mockResolvedValue({ user: { bakeryId: BAKERY_ID } })
    mockPrisma.item.findUnique.mockResolvedValue(null)
    mockPrisma.item.create.mockResolvedValue(fakeItem)
    mockPrisma.inventoryTransaction.create.mockResolvedValue({})
    mockPrisma.itemInventory.create.mockResolvedValue({})
  })

  it('returns 401 when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null)
    const res = await POST(makeRequest({ name: 'Croissant' }))
    expect(res.status).toBe(401)
  })

  it('returns 400 when name is missing', async () => {
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(400)
  })

  it('returns 400 when name is only whitespace', async () => {
    const res = await POST(makeRequest({ name: '   ' }))
    expect(res.status).toBe(400)
  })

  it('creates InventoryTransaction when initialQty > 0', async () => {
    const res = await POST(makeRequest({ name: 'Croissant', initialQty: 5 }))

    expect(res.status).toBe(201)
    expect(mockPrisma.inventoryTransaction.create).toHaveBeenCalledWith({
      data: { itemId: fakeItem.id, delta: 5, reason: 'INITIAL' },
    })
    expect(mockPrisma.itemInventory.create).not.toHaveBeenCalled()
  })

  it('creates ItemInventory with quantity 0 when no initialQty provided', async () => {
    const res = await POST(makeRequest({ name: 'Croissant' }))

    expect(res.status).toBe(201)
    expect(mockPrisma.itemInventory.create).toHaveBeenCalledWith({
      data: { itemId: fakeItem.id, quantity: 0 },
    })
    expect(mockPrisma.inventoryTransaction.create).not.toHaveBeenCalled()
  })

  it('creates ItemInventory with quantity 0 when initialQty is 0', async () => {
    const res = await POST(makeRequest({ name: 'Croissant', initialQty: 0 }))

    expect(res.status).toBe(201)
    expect(mockPrisma.itemInventory.create).toHaveBeenCalledWith({
      data: { itemId: fakeItem.id, quantity: 0 },
    })
    expect(mockPrisma.inventoryTransaction.create).not.toHaveBeenCalled()
  })

  it('appends -1 to slug when the base slug is already taken', async () => {
    mockPrisma.item.findUnique
      .mockResolvedValueOnce(fakeItem) // 'croissant' is taken
      .mockResolvedValueOnce(null)     // 'croissant-1' is free

    const res = await POST(makeRequest({ name: 'Croissant' }))

    expect(res.status).toBe(201)
    expect(mockPrisma.item.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ slug: 'croissant-1' }),
      })
    )
  })
})
