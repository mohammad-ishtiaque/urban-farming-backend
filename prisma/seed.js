// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('password123', 10);

  // Admin
  await prisma.user.create({
    data: { name: 'Admin', email: 'admin@farm.com', password: hash, role: 'ADMIN' },
  });

  // 10 Vendors
  for (let i = 1; i <= 10; i++) {
    const vendor = await prisma.user.create({
      data: {
        name: `Vendor ${i}`,
        email: `vendor${i}@farm.com`,
        password: hash,
        role: 'VENDOR',
      },
    });
    const profile = await prisma.vendorProfile.create({
      data: {
        userId: vendor.id,
        farmName: `Green Farm ${i}`,
        farmLocation: `Location ${i}`,
        certificationStatus: 'APPROVED',
      },
    });

    // 10 products per vendor = 100 total
    for (let j = 1; j <= 10; j++) {
      await prisma.produce.create({
        data: {
          vendorId: profile.id,
          name: `Produce ${i}-${j}`,
          description: `Fresh organic produce`,
          price: Math.random() * 50 + 5,
          category: ['Vegetable', 'Fruit', 'Herb'][j % 3],
          certificationStatus: 'APPROVED',
          availableQuantity: Math.floor(Math.random() * 100 + 10),
        },
      });
    }
  }

  console.log('Seeding complete');
}

main().catch(console.error).finally(() => prisma.$disconnect());