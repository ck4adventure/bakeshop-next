import { vi, describe, it, expect, beforeEach } from 'vitest'

const mockGetServerSession = vi.hoisted(() => vi.fn())
const mockPrisma = vi.hoisted(() => ({
  bakery: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  item: {
    findMany: vi.fn(),
  },
  productionSchedule: {
    deleteMany: vi.fn(),
    createMany: vi.fn(),
  },
  $transaction: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({ default: mockPrisma }))
vi.mock('next-auth', () => ({ getServerSession: mockGetServerSession }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('@/app/generated/prisma/client', () => ({
  Weekday: {
    Sunday: 'Sunday', Monday: 'Monday', Tuesday: 'Tuesday',
    Wednesday: 'Wednesday', Thursday: 'Thursday', Friday: 'Friday', Saturday: 'Saturday',
  },
}))

import { GET, PATCH } from '@/app/api/bakery/settings/route'

const BAKERY_ID = 'bakery-1'
const fakeSession = { user: { bakeryId: BAKERY_ID } }
const fakeBakery = {
  id: BAKERY_ID,
  name: 'Sweet Things',
  slug: 'sweet-things',
  operatingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
}

function makePatch(body: object) {
  return new Request('http://localhost/api/bakery/settings', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('GET /api/bakery/settings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetServerSession.mockResolvedValue(fakeSession)
    mockPrisma.bakery.findUnique.mockResolvedValue(fakeBakery)
  })

  it('returns 401 when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null)
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns bakery settings', async () => {
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.name).toBe('Sweet Things')
    expect(body.operatingDays).toEqual(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'])
  })

  it('returns empty operatingDays when bakery has none set', async () => {
    mockPrisma.bakery.findUnique.mockResolvedValue({ ...fakeBakery, operatingDays: null })
    const res = await GET()
    const body = await res.json()
    expect(body.operatingDays).toEqual([])
  })
})

describe('PATCH /api/bakery/settings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetServerSession.mockResolvedValue(fakeSession)
    // findUnique is called twice: once for GET (settings), once at start of PATCH to get current days
    mockPrisma.bakery.findUnique.mockResolvedValue(fakeBakery)
    mockPrisma.item.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }])
    mockPrisma.bakery.update.mockResolvedValue(fakeBakery)
    mockPrisma.productionSchedule.deleteMany.mockResolvedValue({ count: 0 })
    mockPrisma.productionSchedule.createMany.mockResolvedValue({ count: 0 })
    mockPrisma.$transaction.mockResolvedValue([])
  })

  it('returns 401 when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null)
    const res = await PATCH(makePatch({ operatingDays: ['Monday'] }))
    expect(res.status).toBe(401)
  })

  it('returns 400 when operatingDays is not an array', async () => {
    const res = await PATCH(makePatch({ operatingDays: 'Monday' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when operatingDays contains an invalid day', async () => {
    const res = await PATCH(makePatch({ operatingDays: ['Monday', 'Funday'] }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.message).toContain('Funday')
  })

  it('updates operating days and returns them', async () => {
    const newDays = ['Monday', 'Wednesday', 'Friday']
    const res = await PATCH(makePatch({ operatingDays: newDays }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.operatingDays).toEqual(newDays)
  })

  it('accepts an empty array to clear operating days', async () => {
    const res = await PATCH(makePatch({ operatingDays: [] }))
    expect(res.status).toBe(200)
  })

  it('deletes schedule entries for removed days', async () => {
    // Current: Mon-Fri. New: Mon-Thu (Friday removed)
    const res = await PATCH(makePatch({ operatingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday'] }))
    expect(res.status).toBe(200)

    const txOps = mockPrisma.$transaction.mock.calls[0][0]
    // Verify deleteMany is included with Friday
    const deleteManyCall = mockPrisma.productionSchedule.deleteMany.mock.calls[0]
    expect(deleteManyCall[0]).toEqual({
      where: { weekday: { in: ['Friday'] }, item: { bakeryId: BAKERY_ID } },
    })
    expect(txOps.length).toBeGreaterThanOrEqual(2)
  })

  it('creates null-quantity schedule slots for added days', async () => {
    // Current: Mon-Fri. New: Mon-Fri + Saturday (Saturday added)
    const res = await PATCH(
      makePatch({ operatingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] })
    )
    expect(res.status).toBe(200)

    // Fetches items to create slots
    expect(mockPrisma.item.findMany).toHaveBeenCalledWith({
      where: { bakeryId: BAKERY_ID },
      select: { id: true },
    })

    // Creates null-quantity slots for each item on Saturday
    expect(mockPrisma.productionSchedule.createMany).toHaveBeenCalledWith({
      data: [
        { itemId: 1, weekday: 'Saturday', quantity: null },
        { itemId: 2, weekday: 'Saturday', quantity: null },
      ],
      skipDuplicates: true,
    })
  })

  it('does not fetch items or call createMany when no days are added', async () => {
    // Removing a day only — no adds
    await PATCH(makePatch({ operatingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday'] }))
    expect(mockPrisma.item.findMany).not.toHaveBeenCalled()
    expect(mockPrisma.productionSchedule.createMany).not.toHaveBeenCalled()
  })

  it('does not call deleteMany when no days are removed', async () => {
    // Adding a day only — no removes
    await PATCH(makePatch({ operatingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] }))
    expect(mockPrisma.productionSchedule.deleteMany).not.toHaveBeenCalled()
  })
})
