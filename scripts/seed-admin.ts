import { prisma } from '@/lib/prisma'; // Assumes tsx runs this with path aliases working or relative imports.
// Actually, for scripts, better to use relative if not configured.
// Let's use relative path to prisma client if needed or just assume the env is set up for tsx.

async function main() {
    console.log('Seeding Admin...');
    const username = 'tech1';
    const password = 'password123';

    const existing = await prisma.admin.findUnique({
        where: { username }
    });

    if (!existing) {
        await prisma.admin.create({
            data: {
                username,
                password,
                name: 'Technician One'
            }
        });
        console.log('Created Admin: tech1');
    } else {
        console.log('Admin tech1 already exists');
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
