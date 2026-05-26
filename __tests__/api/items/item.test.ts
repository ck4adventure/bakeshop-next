import { vi, describe, it, expect, beforeEach } from 'vitest'

const mockGetServerSession = vi.hoisted(() => vi.fn())
const mockPrisma = vi.hoisted(() => ({
  item: {
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock('@/lib/prisma', () => ({ default: mockPrisma }))
vi.mock('next-auth', () => ({ getServerSession: mockGetServerSession }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))

import { Prisma } from '@/app/generated/prisma/client'

import { GET } from '@/app/api/items/route'
import { PATCH, DELETE } from '@/app/api/items/[slug]/route'

const BAKERY_ID = 'bakery-1'
const fakeSession = { user: { bakeryId: BAKERY_ID } }
const fakeItem = {
  id: 1,
  name: 'Croissant',
  slug: 'croissant',
  par: null,
  defaultBatchQty: null,
  categoryId: null,
  isActive: true,
  hasInventory: true,
  bakeryId: BAKERY_ID,
  category: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

function makeParams(slug: string) {
  return { params: Promise.resolve({ slug }) }
}

describe('GET /api/items', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetServerSession.mockResolvedValue(fakeSession)
    mockPrisma.item.findMany.mockResolvedValue([fakeItem])
  })

  it('returns 401 when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null)
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns the list of items for the bakery', async () => {
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveLength(1)
    expect(body[0].slug).toBe('croissant')
    expect(mockPrisma.item.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { bakeryId: BAKERY_ID } })
    )
  })
})

describe('PATCH /api/items/[slug]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetServerSession.mockResolvedValue(fakeSession)
    mockPrisma.item.update.mockResolvedValue({ ...fakeItem, name: 'Updated Croissant' })
  })

  it('returns 401 when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null)
    const req = new Request('http://localhost', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Updated' }),
    })
    const res = await PATCH(req, makeParams('croissant'))
    expect(res.status).toBe(401)
  })

  it('updates item and returns 200 with updated data', async () => {
    const req = new Request('http://localhost', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Updated Croissant', par: 10 }),
    })
    const res = await PATCH(req, makeParams('croissant'))
    expect(res.status).toBe(200)
    expect(mockPrisma.item.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { slug_bakeryId: { slug: 'croissant', bakeryId: BAKERY_ID } },
      })
    )
    const body = await res.json()
    expect(body.name).toBe('Updated Croissant')
  })

  it('deactivates item when isActive is false', async () => {
    mockPrisma.item.update.mockResolvedValue({ ...fakeItem, isActive: false })
    const req = new Request('http://localhost', {
      method: 'PATCH',
      body: JSON.stringify({ isActive: false }),
    })
    const res = await PATCH(req, makeParams('croissant'))
    expect(res.status).toBe(200)
    expect(mockPrisma.item.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ isActive: false }),
      })
    )
    const body = await res.json()
    expect(body.isActive).toBe(false)
  })

  it('does not include isActive in update when not provided', async () => {
    const req = new Request('http://localhost', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Updated Croissant' }),
    })
    await PATCH(req, makeParams('croissant'))
    const call = mockPrisma.item.update.mock.calls[0][0]
    expect(call.data).not.toHaveProperty('isActive')
  })

  it('sets hasInventory to false when provided', async () => {
    mockPrisma.item.update.mockResolvedValue({ ...fakeItem, hasInventory: false })
    const req = new Request('http://localhost', {
      method: 'PATCH',
      body: JSON.stringify({ hasInventory: false }),
    })
    const res = await PATCH(req, makeParams('croissant'))
    expect(res.status).toBe(200)
    expect(mockPrisma.item.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ hasInventory: false }),
      })
    )
  })

  it('does not include hasInventory in update when not provided', async () => {
    const req = new Request('http://localhost', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Updated Croissant' }),
    })
    await PATCH(req, makeParams('croissant'))
    const call = mockPrisma.item.update.mock.calls[0][0]
    expect(call.data).not.toHaveProperty('hasInventory')
  })
})

describe('DELETE /api/items/[slug]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetServerSession.mockResolvedValue(fakeSession)
    mockPrisma.item.delete.mockResolvedValue(fakeItem)
  })

  it('returns 401 when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null)
    const res = await DELETE(new Request('http://localhost'), makeParams('croissant'))
    expect(res.status).toBe(401)
  })

  it('deletes the item and returns 204', async () => {
    const res = await DELETE(new Request('http://localhost'), makeParams('croissant'))
    expect(res.status).toBe(204)
    expect(mockPrisma.item.delete).toHaveBeenCalledWith({
      where: { slug_bakeryId: { slug: 'croissant', bakeryId: BAKERY_ID } },
    })
  })

  it('returns 404 when item does not exist', async () => {
    mockPrisma.item.delete.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Record not found', { code: 'P2025', clientVersion: '0' })
    )
    const res = await DELETE(new Request('http://localhost'), makeParams('nonexistent'))
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.message).toBe('Item not found')
  })

  it('returns 500 on unexpected delete error', async () => {
    mockPrisma.item.delete.mockRejectedValue(new Error('DB connection lost'))
    const res = await DELETE(new Request('http://localhost'), makeParams('croissant'))
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.message).toBe('Failed to delete item')
  })
})
