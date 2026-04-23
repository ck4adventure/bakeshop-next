import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.bakeryId) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const { name } = await req.json()
  if (!name?.trim()) {
    return Response.json({ message: 'Name is required' }, { status: 400 })
  }

  const category = await prisma.category.create({
    data: { name: name.trim(), bakeryId: session.user.bakeryId },
  })

  return Response.json(category, { status: 201 })
}
