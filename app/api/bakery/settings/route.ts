import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.bakeryId) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const bakery = await prisma.bakery.findUnique({
    where: { id: session.user.bakeryId },
    select: { operatingDays: true },
  })

  return Response.json({ operatingDays: bakery?.operatingDays ?? [] })
}
