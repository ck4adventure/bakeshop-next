import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.bakeryId) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const inventory = await prisma.itemInventory.findMany({
    where: { item: { bakeryId: session.user.bakeryId } },
    include: {
      item: {
        select: { id: true, name: true, slug: true, par: true, defaultBatchQty: true, category: { select: { id: true, name: true } } },
      },
    },
    orderBy: { item: { name: 'asc' } },
  })

  return Response.json(inventory)
}
