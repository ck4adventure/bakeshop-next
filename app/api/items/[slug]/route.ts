import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { Prisma } from '@/app/generated/prisma/client'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.bakeryId) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const { slug } = await params
  const { name, par, defaultBatchQty, categoryId, isActive } = await req.json()

  const item = await prisma.item.update({
    where: { slug_bakeryId: { slug, bakeryId: session.user.bakeryId } },
    data: {
      name: name?.trim(),
      par: par ?? null,
      defaultBatchQty: defaultBatchQty ?? null,
      categoryId: categoryId ?? null,
      ...(isActive !== undefined && { isActive }),
    },
    include: { category: { select: { id: true, name: true } } },
  })

  return Response.json(item)
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.bakeryId) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const { slug } = await params

  try {
    await prisma.item.delete({
      where: { slug_bakeryId: { slug, bakeryId: session.user.bakeryId } },
    })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return Response.json({ message: 'Item not found' }, { status: 404 })
    }
    return Response.json({ message: 'Failed to delete item' }, { status: 500 })
  }

  return new Response(null, { status: 204 })
}
