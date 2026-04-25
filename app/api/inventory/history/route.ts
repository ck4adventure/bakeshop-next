import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.bakeryId) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const [transactions, inventory] = await Promise.all([
    prisma.inventoryTransaction.findMany({
      where: { product: { bakeryId: session.user.bakeryId } },
      include: { product: { select: { name: true, slug: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.itemInventory.findMany({
      where: { item: { bakeryId: session.user.bakeryId } },
      select: { itemId: true, quantity: true },
    }),
  ])

  const invMap = Object.fromEntries(inventory.map(r => [r.itemId, r.quantity]))

  const entries = transactions.map(t => ({
    id: t.id,
    itemId: t.itemId,
    quantity: t.delta,
    note: t.note,
    createdAt: t.createdAt.toISOString(),
    type: t.reason === 'BATCH' ? 'batch' : 'adjustment',
    product: t.product,
  }))

  return Response.json({ entries, invMap })
}
