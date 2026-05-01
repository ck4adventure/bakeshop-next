import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.bakeryId) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const fromParam = new URL(req.url).searchParams.get('from')
  const startOfDay = fromParam ? new Date(fromParam) : (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d })()
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)

  const transactions = await prisma.inventoryTransaction.findMany({
    where: {
      reason: 'BAKE',
      product: { bakeryId: session.user.bakeryId },
      createdAt: { gte: startOfDay, lt: endOfDay },
    },
    select: { id: true, itemId: true, delta: true },
  })

  return Response.json(transactions.map(t => ({ id: t.id, itemId: t.itemId, quantity: t.delta })))
}
