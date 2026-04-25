import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.bakeryId) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const { id: idStr } = await params
  const id = Number(idStr)
  if (!Number.isInteger(id) || id <= 0) {
    return Response.json({ message: 'Invalid transaction id' }, { status: 400 })
  }

  const transaction = await prisma.inventoryTransaction.findFirst({
    where: { id, reason: 'BAKE', product: { bakeryId: session.user.bakeryId } },
  })
  if (!transaction) {
    return Response.json({ message: 'Bake transaction not found' }, { status: 404 })
  }

  await prisma.inventoryTransaction.delete({ where: { id } })
  return new Response(null, { status: 204 })
}
