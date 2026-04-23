import { InventoryReason, PrismaClient, Role, Weekday } from '@prisma/client'
import * as bcrypt from 'bcrypt'
const prisma = new PrismaClient()

const SALT_ROUNDS = 10

const demo_bakery = {
	name: "Demo Bakery",
	slug: "demo-bakery",
	operatingDays: [
		Weekday.Sunday,
		Weekday.Monday,
		Weekday.Tuesday,
		Weekday.Wednesday,
		Weekday.Thursday,
		Weekday.Friday,
		Weekday.Saturday,
	],
}

const users_demo_data = [
	{ username: process.env.USER3_USERNAME ?? 'admin', password: process.env.USER3_PASSWORD ?? 'admin123', role: Role.ADMIN },
	{ username: process.env.USER2_USERNAME ?? 'manager', password: process.env.USER2_PASSWORD ?? 'manager123', role: Role.MANAGER },
	{ username: process.env.USER1_USERNAME ?? 'baker', password: process.env.USER1_PASSWORD ?? 'baker123', role: Role.BAKER },
]

const categories_demo_data = [
	{ name: "Cookies" },
	{ name: "Bars" },
	{name: "Sweet Pastry"},
	{name: "Savory Pastry"},
];

// categoryName is used to look up the seeded category id after upsert
const items_demo_data = [
	{ name: "Sticky Bun", slug: "sticky-bun", categoryName: "Sweet Pastry" },
	{ name: "Ginger Scone", slug: "ginger-scone", categoryName: "Sweet Pastry" },
	{ name: "Berry Muffin", slug: "berry-muffin", categoryName: "Sweet Pastry" },
	{ name: "Cardamom Donut Muffin", slug: "cardamom-donut-muffin", categoryName: "Sweet Pastry" },
	{ name: "Apple Turnover", slug: "apple-turnover", categoryName: "Sweet Pastry" },
	{ name: "Berry Danish", slug: "berry-danish", categoryName: "Sweet Pastry" },
	{ name: "Ham Turnover", slug: "ham-turnover", categoryName: "Savory Pastry" },
	{ name: "Cheddar Scallion Scone", slug: "cheddar-scallion-scone", categoryName: "Savory Pastry" },
	{ name: "Spanakopita Galette", slug: "spanakopita-galette", categoryName: "Savory Pastry" },
	{ name: "Herbed Gougere", slug: "herbed-gougere", categoryName: "Savory Pastry" },
	{ name: "Ham Quiche", slug: "ham-quiche", categoryName: "Savory Pastry" },
	{ name: "Roasted Vegetable Quiche", slug: "roasted-vegetable-quiche", categoryName: "Savory Pastry" },
	{ name: "Focaccia", slug: "focaccia", categoryName: "Savory Pastry" },
	{ name: "Sandwich of the Day", slug: "sandwich", categoryName: "Savory Pastry" },
	{ name: "Chocolate Chip Cookie", slug: "chocolate-chip-cookie", categoryName: "Cookies" },
	{ name: "Lemon Snap", slug: "lemon-snap", categoryName: "Cookies" },
	{ name: "Oatmeal Raisin", slug: "oatmeal-raisin", categoryName: "Cookies" },
	{ name: "Tahini Jam", slug: "tahini-jam", categoryName: "Cookies" },
	{ name: "Tahini Chocolate Chip", slug: "tahini-chocolate-chip", categoryName: "Cookies" },
	{ name: "Coconut Macaroon", slug: "coconut-macaroon", categoryName: "Cookies" },
	{ name: "Lemon Bars", slug: "lemon-bars", categoryName: "Bars" },

];

// createMany
// async function main() {
//   await prisma.item.createMany({
//     data: items_demo_data,
//     skipDuplicates: true, // optional if you don't want duplicate errors
//   })
// }

// looping
// async function main() {
//   for (const item of items_demo_data) {
//     await prisma.item.create({
//       data: item
//     })
//   }
// }

async function main() {
	// seed demo bakery
	const bakery = await prisma.bakery.upsert({
		where: { slug: demo_bakery.slug },
		update: { operatingDays: demo_bakery.operatingDays },
		create: demo_bakery,
	})
	console.log(`bakery seeded: ${bakery.slug}`)

	// seed users, linked to demo bakery
	for (const u of users_demo_data) {
		const passwordHash = await bcrypt.hash(u.password, SALT_ROUNDS)
		const email = `${u.username}@bakeshop.dev`
		await prisma.user.upsert({
			where: { username: u.username },
			update: { email, passwordHash, bakeryId: bakery.id },
			create: { username: u.username, email, passwordHash, role: u.role, bakeryId: bakery.id },
		})
		console.log(`user seeded: ${u.username}`)
	}

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
		// 	data: { itemId: itemResult.id, quantity: qty, reason: InventoryReason.BATCH }
		// });
		// console.log(`batch seeded for: ${itemResult.slug} (qty: ${qty})`);

		// give item a production schedule
		// itemId, weekday 0-6, quantity
		// const schedResult = await prisma.productionSchedule.create({
		// 	data: {
		// 		itemId: itemResult.id,
		// 		quantity: 10,
		// 		weekday: Weekday.Sunday
		// 	}
		// })
		// const schedResult = await prisma.productionSchedule.createMany({ skipDuplicates: true,
		// 	data: [
		// 		{
		// 			itemId: itemResult.id,
		// 			quantity: 0,
		// 			weekday: Weekday.Monday
		// 		},
		// 		{
		// 			itemId: itemResult.id,
		// 			quantity: 0,
		// 			weekday: Weekday.Tuesday
		// 		},
		// 		{
		// 			itemId: itemResult.id,
		// 			quantity: 10,
		// 			weekday: Weekday.Wednesday
		// 		},
		// 		{
		// 			itemId: itemResult.id,
		// 			quantity: 10,
		// 			weekday: Weekday.Thursday
		// 		},
		// 		{
		// 			itemId: itemResult.id,
		// 			quantity: 15,
		// 			weekday: Weekday.Friday
		// 		},
		// 		{
		// 			itemId: itemResult.id,
		// 			quantity: 15,
		// 			weekday: Weekday.Saturday
		// 		},
		// 		{
		// 			itemId: itemResult.id,
		// 			quantity: 10,
		// 			weekday: Weekday.Sunday
		// 		}
		// 	]
		// })
		// console.log("production schedule results: ", schedResult)

	}
}

main()
	.then(() => prisma.$disconnect())
	.catch(async (e) => {
		console.error(e)
		await prisma.$disconnect()
		process.exit(1)
	})
