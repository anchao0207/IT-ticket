import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const tech = await prisma.admin.upsert({
        where: { username: 'tech1' },
        update: {},
        create: {
            username: 'tech1',
            password: 'password123', // In real app, hash this
            name: 'Technician One',
        },
    });
    const tech2 = await prisma.admin.upsert({
        where: { username: 'tech2' },
        update: {},
        create: {
            username: 'tech2',
            password: 'password123', // In real app, hash this
            name: 'Technician Two',
        },
    });
    const tech3 = await prisma.admin.upsert({
        where: { username: 'tech3' },
        update: {},
        create: {
            username: 'tech3',
            password: 'password123', // In real app, hash this
            name: 'Technician Three',
        },
    });
    console.log({ tech, tech2, tech3 });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
