import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

function rejectIfTodayOrPast(date: string): boolean {
  const todayStr = new Date().toISOString().split('T')[0]
  return date <= todayStr
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ itemId: string; date: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.bakeryId) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const { itemId, date } = await params

  if (rejectIfTodayOrPast(date)) {
    return Response.json({ message: 'Overrides cannot be removed for today or past dates' }, { status: 400 })
  }

  const existing = await prisma.dailyQuotaOverride.findFirst({
    where: { itemId: Number(itemId), date: new Date(date), bakeryId: session.user.bakeryId },
  })
  if (!existing) {
    return Response.json({ message: 'Override not found' }, { status: 404 })
  }

  await prisma.dailyQuotaOverride.delete({ where: { id: existing.id } })

  return new Response(null, { status: 204 })
}
