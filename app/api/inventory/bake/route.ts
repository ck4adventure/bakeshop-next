import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.bakeryId) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const { itemId, quantity, note } = await req.json()
  if (typeof itemId !== 'number' || typeof quantity !== 'number' || quantity < 0) {
    return Response.json({ message: 'itemId and a non-negative quantity are required' }, { status: 400 })
  }

  const item = await prisma.item.findFirst({ where: { id: itemId, bakeryId: session.user.bakeryId } })
  if (!item) {
    return Response.json({ message: 'Item not found' }, { status: 404 })
  }

  try {
    const transaction = await prisma.inventoryTransaction.create({
      data: { itemId, delta: -quantity, reason: 'BAKE', note: note?.trim() ? `daily bake, ${note.trim()}` : 'daily bake' },
    })
    return Response.json({ id: transaction.id }, { status: 201 })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('Stock cannot go negative')) {
      return Response.json({ message: 'Not enough stock to record this bake' }, { status: 422 })
    }
    console.error('[inventory/bake]', err)
    throw err
  }
}
