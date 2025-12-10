import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
});


async function main() {
    console.log('Connecting to database...');
    try {
        await prisma.$connect();
        console.log('Connected successfully!');
        const count = await prisma.ticket.count();
        console.log(`Ticket count: ${count}`);
    } catch (e) {
        console.error('Connection failed:', e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
