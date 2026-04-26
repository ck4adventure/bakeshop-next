import { PrismaClient, Role, Weekday } from '../app/generated/prisma/client'
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
	{ name: "Sticky Bun", slug: "sticky-bun", categoryName: "Sweet Pastry" },
	{ name: "Berry Streusel Muffin", slug: "berry-muffin", categoryName: "Sweet Pastry" },
	{ name: "Candied Ginger Scone", slug: "ginger-scone", categoryName: "Sweet Pastry" },
	{ name: "Berry Danish", slug: "berry-danish", categoryName: "Sweet Pastry" },
	{ name: "Cardamom Donut Muffin", slug: "cardamom-donut-muffin", categoryName: "Sweet Pastry" },
	{ name: "Apple Frangipane Turnover", slug: "apple-turnover", categoryName: "Sweet Pastry" },
	{ name: "Ham Turnover with Le Gruyere", slug: "ham-turnover", categoryName: "Savory Pastry" },
	{ name: "Curried Cauliflower Galette", slug: "spanakopita-galette", categoryName: "Savory Pastry" },
	{ name: "Sharp White Cheddar and Scallion Scone", slug: "cheddar-scallion-scone", categoryName: "Savory Pastry" },
	{ name: "Gougere with Le Gruyere (herbed)", slug: "herbed-gougere", categoryName: "Savory Pastry" },
	{ name: "Ham Quiche with Le Gruyere", slug: "ham-quiche", categoryName: "Savory Pastry" },
	{ name: "Roasted Vegetable and Cheddar Quiche", slug: "roasted-vegetable-quiche", categoryName: "Savory Pastry" },
	{ name: "Mozzarella Focaccia", slug: "mozzarella-focaccia", categoryName: "Savory Pastry" },
	{ name: "Sandwich of the Day", slug: "sandwich-of-the-day", categoryName: "Savory Pastry" },
	{ name: "Tahini Jam Cookie", slug: "tahini-jam-cookie", categoryName: "Cookies" },
	{ name: "Lemon Snap Cookie", slug: "lemon-snap-cookie", categoryName: "Cookies" },
	{ name: "Tahini Chocolate Chip Cookie", slug: "tahini-chocolate-chip-cookie", categoryName: "Cookies" },
	{ name: "Oatmeal Raisin Cookie", slug: "oatmeal-raisin-cookie", categoryName: "Cookies" },
	{ name: "Chocolate Chip Cookie", slug: "chocolate-chip-cookie", categoryName: "Cookies" },
	{ name: "Coconut Macaroon", slug: "coconut-macaroon", categoryName: "Cookies" },
	// { name: "Lemon Bars", slug: "lemon-bars", categoryName: "Bars" },

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
			where: { slug: item.slug },
			update: { bakeryId: bakery.id, ...(categoryId && { categoryId }) },
			create: { name: item.name, slug: item.slug, bakeryId: bakery.id, ...(categoryId && { categoryId }) },
		});
		console.log("item seeded: ", itemResult.slug);

		// create batch for item to give it a starting quantity
		// (the trigger on InventoryTransaction projects the delta onto ItemInventory)
		// const qty = itemResult.id * 10;
		// await prisma.inventoryTransaction.create({
		// 	data: { itemId: itemResult.id, delta: qty, reason: InventoryReason.BATCH, note: 'batch added' }
		// });
		// console.log(`batch seeded for: ${itemResult.slug} (qty: ${qty})`);

		// set default schedule quantities
		const schedResult = await prisma.productionSchedule.createMany({
			skipDuplicates: true,
			data: [
				// {
				// 	itemId: itemResult.id,
				// 	quantity: 0,
				// 	weekday: Weekday.Monday
				// },
				// {
				// 	itemId: itemResult.id,
				// 	quantity: 0,
				// 	weekday: Weekday.Tuesday
				// },
				{
					itemId: itemResult.id,
					quantity: 10,
					weekday: Weekday.Wednesday
				},
				{
					itemId: itemResult.id,
					quantity: 10,
					weekday: Weekday.Thursday
				},
				{
					itemId: itemResult.id,
					quantity: 15,
					weekday: Weekday.Friday
				},
				{
					itemId: itemResult.id,
					quantity: 15,
					weekday: Weekday.Saturday
				},
				{
					itemId: itemResult.id,
					quantity: 10,
					weekday: Weekday.Sunday
				}
			]
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
