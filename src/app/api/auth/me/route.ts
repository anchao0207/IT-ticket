import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token');

        if (!token) {
            return NextResponse.json({ user: null });
        }

        // 2. Lookup Admin by ID
        const admin = await prisma.admin.findUnique({
            where: { id: parseInt(token.value) }
        });

        if (!admin) {
            return NextResponse.json({ user: null });
        }

        return NextResponse.json({ user: { id: admin.id, name: admin.name, username: admin.username } });
    } catch (error) {
        return NextResponse.json({ error: 'Session check failed' }, { status: 500 });
    }
}
