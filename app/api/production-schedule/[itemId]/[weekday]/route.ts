import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { Weekday } from '@/app/generated/prisma/client'

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ itemId: string; weekday: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.bakeryId) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const { itemId, weekday } = await params

  await prisma.productionSchedule.delete({
    where: { itemId_weekday: { itemId: Number(itemId), weekday: weekday as Weekday } },
  })

  return new Response(null, { status: 204 })
}
