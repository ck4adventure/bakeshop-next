"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new client_1.PrismaClient();
const SALT_ROUNDS = 10;
const demo_bakery = {
    name: "Demo Bakery",
    slug: "demo-bakery",
    operatingDays: [
        client_1.Weekday.Sunday,
        client_1.Weekday.Monday,
        client_1.Weekday.Tuesday,
        client_1.Weekday.Wednesday,
        client_1.Weekday.Thursday,
        client_1.Weekday.Friday,
        client_1.Weekday.Saturday,
    ],
};
const users_demo_data = [
    { username: process.env.USER3_USERNAME ?? 'admin', password: process.env.USER3_PASSWORD ?? 'admin123', role: client_1.Role.ADMIN },
    { username: process.env.USER2_USERNAME ?? 'manager', password: process.env.USER2_PASSWORD ?? 'manager123', role: client_1.Role.MANAGER },
    { username: process.env.USER1_USERNAME ?? 'baker', password: process.env.USER1_PASSWORD ?? 'baker123', role: client_1.Role.BAKER },
];
const categories_demo_data = [
    { name: "Cookies" },
    { name: "Bars" },
    { name: "Sweet Pastry" },
    { name: "Savory Pastry" },
];
const items_demo_data = [
    { name: "Sticky Bun", slug: "ginger-scone", categoryName: "Sweet Pastry" },
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
async function main() {
    const bakery = await prisma.bakery.upsert({
        where: { slug: demo_bakery.slug },
        update: { operatingDays: demo_bakery.operatingDays },
        create: demo_bakery,
    });
    console.log(`bakery seeded: ${bakery.slug}`);
    for (const u of users_demo_data) {
        const passwordHash = await bcrypt.hash(u.password, SALT_ROUNDS);
        const email = `${u.username}@bakeshop.dev`;
        await prisma.user.upsert({
            where: { username: u.username },
            update: { email, passwordHash, bakeryId: bakery.id },
            create: { username: u.username, email, passwordHash, role: u.role, bakeryId: bakery.id },
        });
        console.log(`user seeded: ${u.username}`);
    }
    const categoryMap = {};
    for (const cat of categories_demo_data) {
        const catResult = await prisma.category.upsert({
            where: { name_bakeryId: { name: cat.name, bakeryId: bakery.id } },
            update: {},
            create: { name: cat.name, bakeryId: bakery.id },
        });
        categoryMap[cat.name] = catResult.id;
        console.log(`category seeded: ${catResult.name}`);
    }
    for (const item of items_demo_data) {
        const categoryId = item.categoryName ? categoryMap[item.categoryName] : undefined;
        const itemResult = await prisma.item.upsert({
            where: { slug: item.slug },
            update: { bakeryId: bakery.id, ...(categoryId && { categoryId }) },
            create: { name: item.name, slug: item.slug, bakeryId: bakery.id, ...(categoryId && { categoryId }) },
        });
        console.log("item seeded: ", itemResult.slug);
    }
}
main()
    .then(() => prisma.$disconnect())
    .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
});
//# sourceMappingURL=seed.js.map