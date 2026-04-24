import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.bakeryId) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const { itemId, delta, note } = await req.json()
  if (typeof itemId !== 'number' || typeof delta !== 'number' || delta === 0) {
    return Response.json({ message: 'itemId and a non-zero delta quantity are required' }, { status: 400 })
  }
  if (!note?.trim()) {
    return Response.json({ message: 'A reason note is required' }, { status: 400 })
  }

  const current = await prisma.itemInventory.findUnique({ where: { itemId } })
  if (!current) {
    return Response.json({ message: 'Item not found in inventory' }, { status: 404 })
  }
  const newQty = current.quantity + delta;
  if (newQty < 0) {
    return Response.json({ message: 'Adjustment would result in negative stock' }, { status: 422 })
  }

  try {
    const transaction = await prisma.inventoryTransaction.create({
      data: { itemId, delta, reason: 'ADJUSTMENT', note: note.trim() },
    })
    return Response.json(transaction)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('Stock cannot go negative')) {
      return Response.json({ message: 'Adjustment would result in negative stock' }, { status: 422 })
    }
    console.error('[inventory/adjust]', err)
    throw err
  }
}
