import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { Weekday } from '@/app/generated/prisma/client'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.bakeryId) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const bakery = await prisma.bakery.findUnique({
    where: { id: session.user.bakeryId },
    select: { id: true, name: true, slug: true, operatingDays: true },
  })

  return Response.json({
    id: bakery?.id,
    name: bakery?.name,
    slug: bakery?.slug,
    operatingDays: bakery?.operatingDays ?? [],
  })
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.bakeryId) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  if (!body || !Array.isArray(body.operatingDays)) {
    return Response.json({ message: 'operatingDays must be an array' }, { status: 400 })
  }

  const validDays = Object.values(Weekday)
  const invalid = (body.operatingDays as unknown[]).find(d => !validDays.includes(d as Weekday))
  if (invalid !== undefined) {
    return Response.json({ message: `Invalid day: ${invalid}` }, { status: 400 })
  }

  const newDays = body.operatingDays as Weekday[]
  const bakeryId = session.user.bakeryId

  const current = await prisma.bakery.findUnique({
    where: { id: bakeryId },
    select: { operatingDays: true },
  })
  const currentDays = current?.operatingDays ?? []

  const addedDays = newDays.filter(d => !currentDays.includes(d))
  const removedDays = currentDays.filter(d => !newDays.includes(d))

  const items = addedDays.length > 0
    ? await prisma.item.findMany({ where: { bakeryId }, select: { id: true } })
    : []

  await prisma.$transaction([
    prisma.bakery.update({
      where: { id: bakeryId },
      data: { operatingDays: newDays },
    }),
    ...(removedDays.length > 0 ? [
      prisma.productionSchedule.deleteMany({
        where: { weekday: { in: removedDays }, item: { bakeryId } },
      }),
    ] : []),
    ...(addedDays.length > 0 && items.length > 0 ? [
      prisma.productionSchedule.createMany({
        data: addedDays.flatMap(weekday => items.map(item => ({ itemId: item.id, weekday, quantity: null }))),
        skipDuplicates: true,
      }),
    ] : []),
  ])

  return Response.json({ operatingDays: newDays })
}
