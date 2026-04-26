import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { InventoryReason, PrismaClient, Role, Weekday } from '../app/generated/prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()
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
	{ name: "Sticky Bun",                            slug: "sticky-bun",                    categoryName: "Sweet Pastry",  initialQty: 0, schedule: { Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0, Sunday: 0 } },
	{ name: "Berry Streusel Muffin",                 slug: "berry-muffin",                  categoryName: "Sweet Pastry",  initialQty: 0, schedule: { Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0, Sunday: 0 } },
	{ name: "Candied Ginger Scone",                  slug: "ginger-scone",                  categoryName: "Sweet Pastry",  initialQty: 0, schedule: { Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0, Sunday: 0 } },
	{ name: "Berry Danish",                          slug: "berry-danish",                  categoryName: "Sweet Pastry",  initialQty: 0, schedule: { Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0, Sunday: 0 } },
	{ name: "Cardamom Donut Muffin",                 slug: "cardamom-donut-muffin",         categoryName: "Sweet Pastry",  initialQty: 0, schedule: { Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0, Sunday: 0 } },
	{ name: "Apple Frangipane Turnover",             slug: "apple-turnover",                categoryName: "Sweet Pastry",  initialQty: 0, schedule: { Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0, Sunday: 0 } },
	{ name: "Ham Turnover with Le Gruyere",          slug: "ham-turnover",                  categoryName: "Savory Pastry", initialQty: 0, schedule: { Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0, Sunday: 0 } },
	{ name: "Curried Cauliflower Galette",           slug: "spanakopita-galette",           categoryName: "Savory Pastry", initialQty: 0, schedule: { Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0, Sunday: 0 } },
	{ name: "Sharp White Cheddar and Scallion Scone",slug: "cheddar-scallion-scone",        categoryName: "Savory Pastry", initialQty: 0, schedule: { Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0, Sunday: 0 } },
	{ name: "Gougere with Le Gruyere (herbed)",      slug: "herbed-gougere",                categoryName: "Savory Pastry", initialQty: 0, schedule: { Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0, Sunday: 0 } },
	{ name: "Ham Quiche with Le Gruyere",            slug: "ham-quiche",                    categoryName: "Savory Pastry", initialQty: 0, schedule: { Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0, Sunday: 0 } },
	{ name: "Roasted Vegetable and Cheddar Quiche",  slug: "roasted-vegetable-quiche",      categoryName: "Savory Pastry", initialQty: 0, schedule: { Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0, Sunday: 0 } },
	{ name: "Mozzarella Focaccia",                   slug: "mozzarella-focaccia",           categoryName: "Savory Pastry", initialQty: 0, schedule: { Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0, Sunday: 0 } },
	{ name: "Sandwich of the Day",                   slug: "sandwich-of-the-day",           categoryName: "Savory Pastry", initialQty: 0, schedule: { Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0, Sunday: 0 } },
	{ name: "Tahini Jam Cookie",                     slug: "tahini-jam-cookie",             categoryName: "Cookies",       initialQty: 0, schedule: { Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0, Sunday: 0 } },
	{ name: "Lemon Snap Cookie",                     slug: "lemon-snap-cookie",             categoryName: "Cookies",       initialQty: 0, schedule: { Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0, Sunday: 0 } },
	{ name: "Tahini Chocolate Chip Cookie",          slug: "tahini-chocolate-chip-cookie",  categoryName: "Cookies",       initialQty: 0, schedule: { Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0, Sunday: 0 } },
	{ name: "Oatmeal Raisin Cookie",                 slug: "oatmeal-raisin-cookie",         categoryName: "Cookies",       initialQty: 0, schedule: { Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0, Sunday: 0 } },
	{ name: "Chocolate Chip Cookie",                 slug: "chocolate-chip-cookie",         categoryName: "Cookies",       initialQty: 0, schedule: { Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0, Sunday: 0 } },
	{ name: "Coconut Macaroon",                      slug: "coconut-macaroon",              categoryName: "Cookies",       initialQty: 0, schedule: { Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0, Sunday: 0 } },
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
				prisma.itemInventory.create({ data: { itemId: itemResult.id, quantity: item.initialQty } }),
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
