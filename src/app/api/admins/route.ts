import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const admins = await prisma.admin.findMany({
            select: {
                id: true,
                name: true,
                username: true,
            },
            orderBy: {
                name: 'asc',
            },
        });
        return NextResponse.json(admins);
    } catch (error) {
        console.error('Error fetching admins:', error);
        return NextResponse.json({ error: 'Error fetching admins' }, { status: 500 });
    }
}
