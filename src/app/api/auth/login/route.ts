import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { username, password } = body;

        // 2. Find Admin
        const admin = await prisma.admin.findUnique({
            where: { username }
        });

        if (!admin || admin.password !== password) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // 3. Create Session / Set Cookie
        // Store admin ID in cookie for "auth"
        const cookieStore = await cookies();
        cookieStore.set('auth_token', admin.id.toString(), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24, // 1 day
        });

        return NextResponse.json({ success: true, user: { name: admin.name, id: admin.id, username: admin.username } });
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
