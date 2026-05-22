import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.bakeryId) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const categories = await prisma.category.findMany({
    where: { bakeryId: session.user.bakeryId },
    orderBy: { name: 'asc' },
  })

  return Response.json(categories)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.bakeryId) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const { name } = await req.json()
  if (!name?.trim()) {
    return Response.json({ message: 'Name is required' }, { status: 400 })
  }

  const existing = await prisma.category.findFirst({
    where: { name: name.trim(), bakeryId: session.user.bakeryId },
  })
  if (existing) {
    return Response.json({ message: 'A category with that name already exists' }, { status: 409 })
  }

  const category = await prisma.category.create({
    data: { name: name.trim(), bakeryId: session.user.bakeryId },
  })

  return Response.json(category, { status: 201 })
}
