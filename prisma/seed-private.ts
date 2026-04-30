import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { InventoryReason, PrismaClient, Role, Weekday } from '../app/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) })
const SALT_ROUNDS = 10

const private_bakery = {
	name: "Sweet Adeline",
	slug: "sweet-adeline",
	operatingDays: [
		Weekday.Sunday,
		Weekday.Wednesday,
		Weekday.Thursday,
		Weekday.Friday,
		Weekday.Saturday,
	],
}

const categories_demo_data = [
	{ name: "Sweet Pastry" },
	{ name: "Savory Pastry" },
	{ name: "Cookies" },
	// { name: "Bars" },
];

// categoryName is used to look up the seeded category id after upsert
const items_demo_data = [
	{ name: "Sticky Bun",                            slug: "sticky-bun",                    categoryName: "Sweet Pastry",  initialQty: 144, schedule: { Wednesday: 12, Thursday: 12, Friday: 12, Saturday: 24, Sunday: 12 } },
	{ name: "Berry Streusel Muffin",                 slug: "berry-muffin",                  categoryName: "Sweet Pastry",  initialQty: 108, schedule: { Wednesday: 12, Thursday: 12, Friday: 15, Saturday: 21, Sunday: 15 } },
	{ name: "Candied Ginger Scone",                  slug: "ginger-scone",                  categoryName: "Sweet Pastry",  initialQty: 58, schedule: { Wednesday: 9, Thursday: 6, Friday: 9, Saturday: 12, Sunday: 9 } },
	{ name: "Berry Danish",                          slug: "berry-danish",                  categoryName: "Sweet Pastry",  initialQty: 70, schedule: { Wednesday: 6, Thursday: 6, Friday: 9, Saturday: 12, Sunday: 9 } },
	{ name: "Cardamom Donut Muffin",                 slug: "cardamom-donut-muffin",         categoryName: "Sweet Pastry",  initialQty: 116, schedule: { Wednesday: 12, Thursday: 12, Friday: 15, Saturday: 21, Sunday: 15 } },
	{ name: "Apple Frangipane Turnover",             slug: "apple-turnover",                categoryName: "Sweet Pastry",  initialQty: 73, schedule: { Wednesday: 6, Thursday: 6, Friday: 9, Saturday: 12, Sunday: 9 } },
	{ name: "Ham Turnover with Le Gruyere",          slug: "ham-turnover",                  categoryName: "Savory Pastry", initialQty: 55, schedule: { Wednesday: 15, Thursday: 15, Friday: 20, Saturday: 20, Sunday: 20 } },
	{ name: "Curried Cauliflower Galette",           slug: "spanakopita-galette",           categoryName: "Savory Pastry", initialQty: 131, schedule: { Wednesday: 12, Thursday: 12, Friday: 15, Saturday: 15, Sunday: 12 } },
	{ name: "Sharp White Cheddar and Scallion Scone",slug: "cheddar-scallion-scone",        categoryName: "Savory Pastry", initialQty: 133, schedule: { Wednesday: 18, Thursday: 15, Friday: 18, Saturday: 21, Sunday: 18 } },
	{ name: "Gougere with Le Gruyere (herbed)",      slug: "herbed-gougere",                categoryName: "Savory Pastry", initialQty: 110, schedule: { Wednesday: 12, Thursday: 9, Friday: 12, Saturday: 15, Sunday: 12 } },
	{ name: "Ham Quiche with Le Gruyere",            slug: "ham-quiche",                    categoryName: "Savory Pastry", initialQty: 0, schedule: { Wednesday: 1, Thursday: 1, Friday: 1, Saturday: 2, Sunday: 1 } },
	{ name: "Roasted Vegetable and Cheddar Quiche",  slug: "roasted-vegetable-quiche",      categoryName: "Savory Pastry", initialQty: 3, schedule: { Wednesday: 2, Thursday: 2, Friday: 2, Saturday: 3, Sunday: 2 } },
	{ name: "Mozzarella Focaccia",                   slug: "mozzarella-focaccia",           categoryName: "Savory Pastry", initialQty: 12, schedule: { Wednesday: 12, Thursday: 12, Friday: 12, Saturday: 12, Sunday: 12 } },
	{ name: "Sandwich of the Day",                   slug: "sandwich-of-the-day",           categoryName: "Savory Pastry", initialQty: 24, schedule: { Wednesday: 12, Thursday: 24, Friday: 24, Saturday: 18, Sunday: 12 } },
	{ name: "Tahini Jam Cookie",                     slug: "tahini-jam-cookie",             categoryName: "Cookies",       initialQty: 83, schedule: { Wednesday: 15, Thursday: 12, Friday: 18, Saturday: 18, Sunday: 15 } },
	{ name: "Lemon Snap Cookie",                     slug: "lemon-snap-cookie",             categoryName: "Cookies",       initialQty: 49, schedule: { Wednesday: 9, Thursday: 6, Friday: 9, Saturday: 12, Sunday: 9 } },
	{ name: "Tahini Chocolate Chip Cookie",          slug: "tahini-chocolate-chip-cookie",  categoryName: "Cookies",       initialQty: 128, schedule: { Wednesday: 9, Thursday: 6, Friday: 9, Saturday: 12, Sunday: 9 } },
	{ name: "Oatmeal Raisin Cookie",                 slug: "oatmeal-raisin-cookie",         categoryName: "Cookies",       initialQty: 136, schedule: { Wednesday: 9, Thursday: 6, Friday: 9, Saturday: 12, Sunday: 9 } },
	{ name: "Chocolate Chip Cookie",                 slug: "chocolate-chip-cookie",         categoryName: "Cookies",       initialQty: 99, schedule: { Wednesday: 18, Thursday: 15, Friday: 18, Saturday: 21, Sunday: 18 } },
	{ name: "Coconut Macaroon",                      slug: "coconut-macaroon",              categoryName: "Cookies",       initialQty: 144, schedule: { Wednesday: 12, Thursday: 12, Friday: 12, Saturday: 12, Sunday: 12 } },
	// { name: "Lemon Bars", slug: "lemon-bars", categoryName: "Bars", initialQty: 0, schedule: { Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0, Sunday: 0 } },

];


async function main() {
	const username = process.env.PRIVATE_ADMIN_USERNAME
	const password = process.env.PRIVATE_ADMIN_PASSWORD
	if (!username || !password) {
		console.error('PRIVATE_ADMIN_USERNAME and PRIVATE_ADMIN_PASSWORD must be set in environment')
		process.exit(1)
	}

	const bakery = await prisma.bakery.upsert({
		where: { slug: private_bakery.slug },
		update: { operatingDays: private_bakery.operatingDays },
		create: private_bakery,
	})
	console.log(`bakery seeded: ${bakery.slug}`)

	const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
	const email = `${username}@sweetadeline.dev`
	await prisma.user.upsert({
		where: { username },
		update: { email, passwordHash, bakeryId: bakery.id },
		create: { username, email, passwordHash, role: Role.ADMIN, bakeryId: bakery.id },
	})
	console.log(`user seeded: ${username}`)

	// seed categories
	const categoryMap: Record<string, number> = {};
	for (const cat of categories_demo_data) {
		const catResult = await prisma.category.upsert({
			where: { name_bakeryId: { name: cat.name, bakeryId: bakery.id } },
			update: {},
			create: { name: cat.name, bakeryId: bakery.id },
		});
		categoryMap[cat.name] = catResult.id;
		console.log(`category seeded: ${catResult.name}`);
	}

	// seed items
	for (const item of items_demo_data) {
		const categoryId = item.categoryName ? categoryMap[item.categoryName] : undefined;

		// create item (skip if already exists), always link to bakery
		const itemResult = await prisma.item.upsert({
			where: { slug_bakeryId: { slug: item.slug, bakeryId: bakery.id } },
			update: { bakeryId: bakery.id, ...(categoryId && { categoryId }) },
			create: { name: item.name, slug: item.slug, bakeryId: bakery.id, ...(categoryId && { categoryId }) },
		});
		console.log("item seeded: ", itemResult.slug);

		if (item.initialQty > 0) {
			await prisma.$transaction([
				prisma.itemInventory.create({ data: { itemId: itemResult.id } }),
				prisma.inventoryTransaction.create({
					data: { itemId: itemResult.id, delta: item.initialQty, reason: InventoryReason.INITIAL },
				}),
			])
			console.log(`initial qty seeded for: ${itemResult.slug} (qty: ${item.initialQty})`)
		}

		// set per-item production schedule
		const schedResult = await prisma.productionSchedule.createMany({
			skipDuplicates: true,
			data: (Object.entries(item.schedule) as [Weekday, number][]).map(([weekday, quantity]) => ({
				itemId: itemResult.id,
				quantity,
				weekday,
			})),
		})
		console.log("production schedule results: ", schedResult)

	}
}

main()
	.then(() => prisma.$disconnect())
	.catch(async (e) => {
		console.error(e)
		await prisma.$disconnect()
		process.exit(1)
	})
