const { PrismaClient, Role } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const initialProducts = [
  { name: "Zaity", size: "2X6", sellingPrice: 1400 },
  { name: "timber", size: "soft single", sellingPrice: 6000 },
  { name: "timber", size: "soft double", sellingPrice: 12000 },
  { name: "timber", size: "hard single", sellingPrice: 6000 },
  { name: "timber", size: "hard double", sellingPrice: 12000 },
  { name: "plank aba", size: "fall", sellingPrice: 5000 },
  { name: "timber", size: "hard reject", sellingPrice: 3500 },
  { name: "timber", size: "soft reject", sellingPrice: 3500 },
  { name: "plank rimi", size: "nil", sellingPrice: 3500 },
  { name: "plank", size: "reject", sellingPrice: 2500 },
];

async function main() {
  const adminPasswordHash = await bcrypt.hash("admin123", 10);
  const clientPasswordHash = await bcrypt.hash("client123", 10);

  await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
    },
  });

  await prisma.user.upsert({
    where: { username: "client" },
    update: {},
    create: {
      username: "client",
      passwordHash: clientPasswordHash,
      role: Role.CLIENT,
    },
  });

  for (const product of initialProducts) {
    await prisma.product.upsert({
      where: {
        name_size: {
          name: product.name,
          size: product.size,
        },
      },
      update: {
        sellingPrice: product.sellingPrice,
      },
      create: {
        ...product,
        quantity: 0,
      },
    });
  }

  console.log("Seed complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
