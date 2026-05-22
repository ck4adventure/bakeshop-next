import { vi, describe, it, expect, beforeEach } from 'vitest'

const mockGetServerSession = vi.hoisted(() => vi.fn())
const mockPrisma = vi.hoisted(() => ({
  bakery: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
}))

vi.mock('@/lib/prisma', () => ({ default: mockPrisma }))
vi.mock('next-auth', () => ({ getServerSession: mockGetServerSession }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('@/app/generated/prisma/client', () => ({
  Weekday: { SUN: 'SUN', MON: 'MON', TUE: 'TUE', WED: 'WED', THU: 'THU', FRI: 'FRI', SAT: 'SAT' },
}))

import { GET, PATCH } from '@/app/api/bakery/settings/route'

const BAKERY_ID = 'bakery-1'
const fakeSession = { user: { bakeryId: BAKERY_ID } }
const fakeBakery = {
  id: BAKERY_ID,
  name: 'Sweet Things',
  slug: 'sweet-things',
  operatingDays: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
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
    expect(body.operatingDays).toEqual(['MON', 'TUE', 'WED', 'THU', 'FRI'])
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
    mockPrisma.bakery.update.mockResolvedValue(fakeBakery)
  })

  it('returns 401 when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null)
    const res = await PATCH(makePatch({ operatingDays: ['MON'] }))
    expect(res.status).toBe(401)
  })

  it('returns 400 when operatingDays is not an array', async () => {
    const res = await PATCH(makePatch({ operatingDays: 'MON' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when operatingDays contains an invalid day', async () => {
    const res = await PATCH(makePatch({ operatingDays: ['MON', 'FUNDAY'] }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.message).toContain('FUNDAY')
  })

  it('updates operating days and returns them', async () => {
    const res = await PATCH(makePatch({ operatingDays: ['MON', 'WED', 'FRI'] }))
    expect(res.status).toBe(200)
    expect(mockPrisma.bakery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: BAKERY_ID },
        data: { operatingDays: ['MON', 'WED', 'FRI'] },
      })
    )
    const body = await res.json()
    expect(body.operatingDays).toEqual(['MON', 'WED', 'FRI'])
  })

  it('accepts an empty array to clear operating days', async () => {
    const res = await PATCH(makePatch({ operatingDays: [] }))
    expect(res.status).toBe(200)
  })
})
