import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { Weekday } from '@/app/generated/prisma/client'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.bakeryId) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const schedules = await prisma.productionSchedule.findMany({
    where: { item: { bakeryId: session.user.bakeryId } },
    include: { item: { select: { name: true, slug: true, category: { select: { id: true, name: true } } } } },
  })

  return Response.json(schedules)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.bakeryId) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const { itemId, weekday, quantity } = await req.json()

  const schedule = await prisma.productionSchedule.upsert({
    where: { itemId_weekday: { itemId, weekday: weekday as Weekday } },
    update: { quantity },
    create: { itemId, weekday: weekday as Weekday, quantity },
  })

  return Response.json(schedule, { status: 201 })
}
