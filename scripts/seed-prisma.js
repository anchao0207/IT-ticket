const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding directly via Prisma...');

    // Create 15 tickets
    for (let i = 1; i <= 15; i++) {
        await prisma.ticket.create({
            data: {
                company: `Company ${i}`,
                issue: `Pagination Test Issue ${i}`,
                status: i % 2 === 0 ? 'Open' : 'Unassigned',
                startedTime: new Date(),
                person: `User ${i}`,
                location: `Location ${i}`,
            },
        });
        console.log(`Created ticket ${i}`);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
