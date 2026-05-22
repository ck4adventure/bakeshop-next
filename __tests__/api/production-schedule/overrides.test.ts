import { vi, describe, it, expect, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mockGetServerSession = vi.hoisted(() => vi.fn())
const mockPrisma = vi.hoisted(() => ({
  item: {
    findFirst: vi.fn(),
  },
  dailyQuotaOverride: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    upsert: vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock('@/lib/prisma', () => ({ default: mockPrisma }))
vi.mock('next-auth', () => ({ getServerSession: mockGetServerSession }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))

import { GET, POST } from '@/app/api/production-schedule/overrides/route'
import { DELETE } from '@/app/api/production-schedule/overrides/[itemId]/[date]/route'

const BAKERY_ID = 'bakery-1'
const fakeSession = { user: { bakeryId: BAKERY_ID } }
const fakeItem = { id: 1, name: 'Croissant', bakeryId: BAKERY_ID }
const fakeOverride = { id: 10, itemId: 1, date: new Date('2099-12-31'), quantity: 50, specialOrderQty: 0 }

// A date guaranteed to be in the future for test stability
const FUTURE_DATE = '2099-12-31'
const PAST_DATE = '2000-01-01'

function makePostRequest(body: object) {
  return new Request('http://localhost/api/production-schedule/overrides', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function makeDeleteParams(itemId: string, date: string) {
  return { params: Promise.resolve({ itemId, date }) }
}

describe('GET /api/production-schedule/overrides', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetServerSession.mockResolvedValue(fakeSession)
    mockPrisma.dailyQuotaOverride.findMany.mockResolvedValue([fakeOverride])
  })

  it('returns 401 when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null)
    const res = await GET(new NextRequest('http://localhost/api/production-schedule/overrides?date=2099-12-31'))
    expect(res.status).toBe(401)
  })

  it('returns 400 when date param is missing', async () => {
    const res = await GET(new NextRequest('http://localhost/api/production-schedule/overrides'))
    expect(res.status).toBe(400)
  })

  it('returns overrides for the given date', async () => {
    const res = await GET(new NextRequest(`http://localhost/api/production-schedule/overrides?date=${FUTURE_DATE}`))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveLength(1)
    expect(mockPrisma.dailyQuotaOverride.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ bakeryId: BAKERY_ID }),
      })
    )
  })
})

describe('POST /api/production-schedule/overrides', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetServerSession.mockResolvedValue(fakeSession)
    mockPrisma.item.findFirst.mockResolvedValue(fakeItem)
    mockPrisma.dailyQuotaOverride.upsert.mockResolvedValue(fakeOverride)
  })

  it('returns 401 when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null)
    const res = await POST(makePostRequest({ itemId: 1, date: FUTURE_DATE, quantity: 50 }))
    expect(res.status).toBe(401)
  })

  it('returns 400 when date is in the past', async () => {
    const res = await POST(makePostRequest({ itemId: 1, date: PAST_DATE, quantity: 50 }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when date is today', async () => {
    const today = new Date().toISOString().split('T')[0]
    const res = await POST(makePostRequest({ itemId: 1, date: today, quantity: 50 }))
    expect(res.status).toBe(400)
  })

  it('returns 404 when item does not belong to the bakery', async () => {
    mockPrisma.item.findFirst.mockResolvedValue(null)
    const res = await POST(makePostRequest({ itemId: 1, date: FUTURE_DATE, quantity: 50 }))
    expect(res.status).toBe(404)
  })

  it('upserts override for a future date and returns 201', async () => {
    const res = await POST(makePostRequest({ itemId: 1, date: FUTURE_DATE, quantity: 50 }))
    expect(res.status).toBe(201)
    expect(mockPrisma.dailyQuotaOverride.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { itemId_date: { itemId: 1, date: new Date(FUTURE_DATE) } },
        create: expect.objectContaining({ quantity: 50, specialOrderQty: 0 }),
        update: { quantity: 50, specialOrderQty: 0 },
      })
    )
  })
})

describe('DELETE /api/production-schedule/overrides/[itemId]/[date]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetServerSession.mockResolvedValue(fakeSession)
    mockPrisma.dailyQuotaOverride.findFirst.mockResolvedValue(fakeOverride)
    mockPrisma.dailyQuotaOverride.delete.mockResolvedValue(fakeOverride)
  })

  it('returns 401 when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null)
    const res = await DELETE(new Request('http://localhost'), makeDeleteParams('1', FUTURE_DATE))
    expect(res.status).toBe(401)
  })

  it('returns 400 when date is in the past', async () => {
    const res = await DELETE(new Request('http://localhost'), makeDeleteParams('1', PAST_DATE))
    expect(res.status).toBe(400)
  })

  it('returns 400 when date is today', async () => {
    const today = new Date().toISOString().split('T')[0]
    const res = await DELETE(new Request('http://localhost'), makeDeleteParams('1', today))
    expect(res.status).toBe(400)
  })

  it('returns 404 when override does not exist', async () => {
    mockPrisma.dailyQuotaOverride.findFirst.mockResolvedValue(null)
    const res = await DELETE(new Request('http://localhost'), makeDeleteParams('1', FUTURE_DATE))
    expect(res.status).toBe(404)
  })

  it('deletes the override and returns 204', async () => {
    const res = await DELETE(new Request('http://localhost'), makeDeleteParams('1', FUTURE_DATE))
    expect(res.status).toBe(204)
    expect(mockPrisma.dailyQuotaOverride.delete).toHaveBeenCalledWith({
      where: { id: fakeOverride.id },
    })
  })
})
