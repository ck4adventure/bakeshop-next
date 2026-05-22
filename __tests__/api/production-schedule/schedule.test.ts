import { vi, describe, it, expect, beforeEach } from 'vitest'

const mockGetServerSession = vi.hoisted(() => vi.fn())
const mockPrisma = vi.hoisted(() => ({
  productionSchedule: {
    findMany: vi.fn(),
    upsert: vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock('@/lib/prisma', () => ({ default: mockPrisma }))
vi.mock('next-auth', () => ({ getServerSession: mockGetServerSession }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('@/app/generated/prisma/client', () => ({
  Weekday: { SUN: 'SUN', MON: 'MON', TUE: 'TUE', WED: 'WED', THU: 'THU', FRI: 'FRI', SAT: 'SAT' },
}))

import { GET, POST } from '@/app/api/production-schedule/route'
import { DELETE } from '@/app/api/production-schedule/[itemId]/[weekday]/route'

const BAKERY_ID = 'bakery-1'
const fakeSession = { user: { bakeryId: BAKERY_ID } }
const fakeSchedule = { id: 1, itemId: 1, weekday: 'MON', quantity: 24 }

function makePostRequest(body: object) {
  return new Request('http://localhost/api/production-schedule', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function makeDeleteParams(itemId: string, weekday: string) {
  return { params: Promise.resolve({ itemId, weekday }) }
}

describe('GET /api/production-schedule', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetServerSession.mockResolvedValue(fakeSession)
    mockPrisma.productionSchedule.findMany.mockResolvedValue([fakeSchedule])
  })

  it('returns 401 when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null)
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns schedules filtered by bakery', async () => {
    const res = await GET()
    expect(res.status).toBe(200)
    expect(mockPrisma.productionSchedule.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { item: { bakeryId: BAKERY_ID } } })
    )
    const body = await res.json()
    expect(body).toHaveLength(1)
    expect(body[0].weekday).toBe('MON')
  })
})

describe('POST /api/production-schedule', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetServerSession.mockResolvedValue(fakeSession)
    mockPrisma.productionSchedule.upsert.mockResolvedValue(fakeSchedule)
  })

  it('returns 401 when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null)
    const res = await POST(makePostRequest({ itemId: 1, weekday: 'MON', quantity: 24 }))
    expect(res.status).toBe(401)
  })

  it('upserts schedule and returns 201', async () => {
    const res = await POST(makePostRequest({ itemId: 1, weekday: 'MON', quantity: 24 }))
    expect(res.status).toBe(201)
    expect(mockPrisma.productionSchedule.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { itemId_weekday: { itemId: 1, weekday: 'MON' } },
        update: { quantity: 24 },
        create: { itemId: 1, weekday: 'MON', quantity: 24 },
      })
    )
  })
})

describe('DELETE /api/production-schedule/[itemId]/[weekday]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetServerSession.mockResolvedValue(fakeSession)
    mockPrisma.productionSchedule.delete.mockResolvedValue(fakeSchedule)
  })

  it('returns 401 when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null)
    const res = await DELETE(new Request('http://localhost'), makeDeleteParams('1', 'MON'))
    expect(res.status).toBe(401)
  })

  it('deletes the schedule entry and returns 204', async () => {
    const res = await DELETE(new Request('http://localhost'), makeDeleteParams('1', 'MON'))
    expect(res.status).toBe(204)
    expect(mockPrisma.productionSchedule.delete).toHaveBeenCalledWith({
      where: { itemId_weekday: { itemId: 1, weekday: 'MON' } },
    })
  })
})
