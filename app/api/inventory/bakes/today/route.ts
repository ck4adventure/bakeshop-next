import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.bakeryId) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date()
  endOfDay.setHours(23, 59, 59, 999)

  const transactions = await prisma.inventoryTransaction.findMany({
    where: {
      reason: 'BAKE',
      product: { bakeryId: session.user.bakeryId },
      createdAt: { gte: startOfDay, lte: endOfDay },
    },
    select: { id: true, itemId: true, delta: true },
  })

  return Response.json(transactions.map(t => ({ id: t.id, itemId: t.itemId, quantity: t.delta })))
}
