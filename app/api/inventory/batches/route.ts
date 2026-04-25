import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.bakeryId) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const itemId = Number(body.itemId)
  const quantity = Number(body.quantity)
  if (!Number.isInteger(itemId) || itemId <= 0) {
    return Response.json({ message: 'Valid itemId is required' }, { status: 400 })
  }
  if (!Number.isInteger(quantity) || quantity <= 0) {
    return Response.json({ message: 'quantity must be a positive integer' }, { status: 400 })
  }

  const transaction = await prisma.inventoryTransaction.create({
    data: { itemId, delta: quantity, reason: 'BATCH' },
  })

  return Response.json(transaction, { status: 201 })
}
