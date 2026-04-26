import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { NextRequest } from 'next/server'

function rejectIfTodayOrPast(date: string): boolean {
  const todayStr = new Date().toISOString().split('T')[0]
  return date <= todayStr
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.bakeryId) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const date = req.nextUrl.searchParams.get('date')
  if (!date) {
    return Response.json({ message: 'Missing date param' }, { status: 400 })
  }

  const overrides = await prisma.dailyQuotaOverride.findMany({
    where: { date: new Date(date), bakeryId: session.user.bakeryId },
    include: { item: { select: { name: true, slug: true } } },
  })

  return Response.json(overrides)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.bakeryId) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const { itemId, date, quantity, specialOrderQty = 0 } = await req.json()

  if (rejectIfTodayOrPast(date)) {
    return Response.json({ message: 'Overrides cannot be set for today or past dates' }, { status: 400 })
  }

  const item = await prisma.item.findFirst({
    where: { id: itemId, bakeryId: session.user.bakeryId },
  })
  if (!item) return Response.json({ message: 'Item not found' }, { status: 404 })

  const override = await prisma.dailyQuotaOverride.upsert({
    where: { itemId_date: { itemId, date: new Date(date) } },
    create: { itemId, bakeryId: session.user.bakeryId, date: new Date(date), quantity, specialOrderQty },
    update: { quantity, specialOrderQty },
  })

  return Response.json(override, { status: 201 })
}
