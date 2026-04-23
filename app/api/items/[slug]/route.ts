import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.bakeryId) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const { slug } = await params
  const { name, par, defaultBatchQty, categoryId } = await req.json()

  const item = await prisma.item.update({
    where: { slug, bakeryId: session.user.bakeryId },
    data: {
      name: name?.trim(),
      par: par ?? null,
      defaultBatchQty: defaultBatchQty ?? null,
      categoryId: categoryId ?? null,
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

  await prisma.item.delete({
    where: { slug, bakeryId: session.user.bakeryId },
  })

  return new Response(null, { status: 204 })
}
