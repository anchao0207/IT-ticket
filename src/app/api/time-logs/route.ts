import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/time-logs?technicianId=X or ?from=...&to=...
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const adminId = searchParams.get('technicianId'); // legacy param name
        const from = searchParams.get('from');
        const to = searchParams.get('to');

        const where: any = {};
        if (adminId) where.adminId = parseInt(adminId);
        if (from && to) {
            where.date = {
                gte: new Date(from),
                lte: new Date(to)
            };
        }

        const logs = await prisma.timelog.findMany({
            where,
            orderBy: { date: 'desc' },
            include: { admin: true }
        });

        return NextResponse.json(logs);
    } catch (error) {
        console.error("GET time-logs error:", error);
        return NextResponse.json({ error: 'Error fetching time logs' }, { status: 500 });
    }
}

// POST /api/time-logs (Create Log / Clock In / Manual Entry)
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { adminId, action, date, timeIn, timeOut, lunchStart, lunchEnd, mileage } = body;

        if (!adminId) {
            return NextResponse.json({ error: 'Admin ID required' }, { status: 400 });
        }

        // Manual Entry (Full Object)
        if (!action && date && timeIn) {
            const newLog = await prisma.timelog.create({
                data: {
                    adminId: parseInt(adminId),
                    date: new Date(date),
                    timeIn: new Date(timeIn),
                    timeOut: timeOut ? new Date(timeOut) : null,
                    lunchStart: lunchStart ? new Date(lunchStart) : null,
                    lunchEnd: lunchEnd ? new Date(lunchEnd) : null,
                    mileage: mileage !== undefined && mileage !== '' && mileage !== null ? parseFloat(mileage as string) : 0.0,
                },
            });
            return NextResponse.json(newLog);
        }

        // Legacy Action-based (Clock In)
        if (action === 'clock-in') {
            const timeLog = await prisma.timelog.create({
                data: {
                    adminId: parseInt(adminId),
                    timeIn: new Date(),
                    date: new Date()
                },
                include: { admin: true }
            });
            return NextResponse.json(timeLog);
        }

        // Actions on existing log
        const lastLog = await prisma.timelog.findFirst({
            where: { adminId: parseInt(adminId) },
            orderBy: { id: 'desc' },
        });

        if (!lastLog) {
            return NextResponse.json({ error: 'No active session found' }, { status: 400 });
        }

        let updateData = {};
        if (action === 'clock-out') updateData = { timeOut: new Date() };
        if (action === 'lunch-start') updateData = { lunchStart: new Date() };
        if (action === 'lunch-end') updateData = { lunchEnd: new Date() };

        const updatedLog = await prisma.timelog.update({
            where: { id: lastLog.id },
            data: updateData,
            include: { admin: true }
        });

        return NextResponse.json(updatedLog);

    } catch (error: any) {
        console.error('Error processing time log:', error);
        return NextResponse.json({ error: `Error processing time log: ${error.message}` }, { status: 500 });
    }
}

// PUT /api/time-logs (Update specific log)
export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, timeIn, timeOut, lunchStart, lunchEnd, mileage } = body;

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        const data: any = {};
        if (timeIn) data.timeIn = new Date(timeIn);
        if (timeOut !== undefined) data.timeOut = timeOut ? new Date(timeOut) : null;
        if (lunchStart !== undefined) data.lunchStart = lunchStart ? new Date(lunchStart) : null;
        if (lunchEnd !== undefined) data.lunchEnd = lunchEnd ? new Date(lunchEnd) : null;
        if (mileage !== undefined) data.mileage = mileage !== '' && mileage !== null ? parseFloat(mileage as string) : null;

        const updated = await prisma.timelog.update({
            where: { id: parseInt(id) },
            data,
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Error updating time log:', error);
        return NextResponse.json({ error: 'Error updating time log' }, { status: 500 });
    }
}
