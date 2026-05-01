import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { slugify } from '@/lib/utils'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.bakeryId) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const items = await prisma.item.findMany({
    where: { bakeryId: session.user.bakeryId },
    include: { category: { select: { id: true, name: true } } },
    orderBy: { name: 'asc' },
  })

  return Response.json(items)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.bakeryId) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const { name, par, defaultBatchQty, categoryId, initialQty } = await req.json()
  if (!name?.trim()) {
    return Response.json({ message: 'Name is required' }, { status: 400 })
  }

  if (categoryId != null) {
    const cat = await prisma.category.findFirst({
      where: { id: categoryId, bakeryId: session.user.bakeryId },
    })
    if (!cat) return Response.json({ message: 'Invalid category' }, { status: 400 })
  }

  const baseSlug = slugify(name.trim())
  // Ensure slug uniqueness by appending a suffix if needed
  let slug = baseSlug
  let suffix = 1
  while (await prisma.item.findUnique({ where: { slug_bakeryId: { slug, bakeryId: session.user.bakeryId! } } })) {
    slug = `${baseSlug}-${suffix++}`
  }

  const item = await prisma.item.create({
    data: {
      name: name.trim(),
      slug,
      par: par ?? null,
      defaultBatchQty: defaultBatchQty ?? null,
      categoryId: categoryId ?? null,
      bakeryId: session.user.bakeryId,
    },
    include: { category: { select: { id: true, name: true } } },
  })

  const qty = (initialQty != null && initialQty > 0) ? initialQty : 0
  await prisma.itemInventory.create({ data: { itemId: item.id, quantity: qty } })
  if (qty > 0) {
    await prisma.inventoryTransaction.create({
      data: { itemId: item.id, delta: qty, reason: 'INITIAL' },
    })
  }

  return Response.json(item, { status: 201 })
}
