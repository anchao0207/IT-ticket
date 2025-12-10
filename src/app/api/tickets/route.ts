import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (id) {
            const ticket = await prisma.ticket.findUnique({
                where: { id: parseInt(id) },
                include: { admin: true },
            });

            if (!ticket) {
                return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
            }

            return NextResponse.json(ticket);
        }

        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const skip = (page - 1) * limit;

        const search = searchParams.get('search') || '';
        const status = searchParams.get('status');
        const adminId = searchParams.get('adminId');
        const date = searchParams.get('date');
        const sort = searchParams.get('sort') || 'desc'; // 'asc' or 'desc'
        const sortBy = searchParams.get('sortBy') || 'date'; // 'id', 'company', 'issue', 'assignee', 'status', 'date'

        const where: any = {};

        if (search) {
            where.OR = [
                { company: { contains: search, mode: 'insensitive' } },
                { issue: { contains: search, mode: 'insensitive' } },
                { person: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (status && status !== 'All') {
            where.status = status;
        }

        if (adminId) {
            where.adminId = parseInt(adminId);
        }

        if (date === 'today') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            where.startedTime = {
                gte: today,
                lt: tomorrow
            };
        }

        let orderBy: any = {};
        if (sortBy === 'id') orderBy = { id: sort === 'asc' ? 'asc' : 'desc' };
        else if (sortBy === 'company') orderBy = { company: sort === 'asc' ? 'asc' : 'desc' };
        else if (sortBy === 'issue') orderBy = { issue: sort === 'asc' ? 'asc' : 'desc' };
        else if (sortBy === 'status') orderBy = { status: sort === 'asc' ? 'asc' : 'desc' };
        else if (sortBy === 'assignee') orderBy = { admin: { name: sort === 'asc' ? 'asc' : 'desc' } };
        else orderBy = { date: sort === 'asc' ? 'asc' : 'desc' };

        const [tickets, total] = await Promise.all([
            prisma.ticket.findMany({
                where,
                orderBy,
                include: {
                    admin: true, // Fetch assigned admin details
                },
                skip,
                take: limit,
            }),
            prisma.ticket.count({ where }),
        ]);

        return NextResponse.json({
            tickets,
            metadata: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Error fetching tickets:', error);
        return NextResponse.json({ error: 'Error fetching tickets' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const ticket = await prisma.ticket.create({
            data: {
                startedTime: new Date(body.startedTime),
                company: body.company,
                location: body.location,
                person: body.person,
                issue: body.issue,
                status: body.adminId ? 'Assigned' : 'Unassigned',
                admin: body.adminId ? { connect: { id: parseInt(body.adminId) } } : undefined,
            },
        });
        console.log('API Created Ticket:', ticket);
        return NextResponse.json(ticket);
    } catch (error) {
        console.error('Error creating ticket:', error);
        return NextResponse.json({ error: 'Error creating ticket' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const {
            id,
            status,
            adminId,
            resolution,
            comments,
            company,
            // admin, // REMOVED
            location,
            person,
            issue,
            startedTime,
            timeEnd
        } = body;

        const data: any = {};
        if (status) data.status = status;
        if (adminId !== undefined) data.adminId = adminId ? parseInt(adminId) : null;
        if (resolution !== undefined) data.resolution = resolution;
        if (comments !== undefined) data.comments = comments;

        // editable fields
        if (company) data.company = company;
        // if (admin) data.admin = admin; // REMOVED
        if (location) data.location = location;
        if (person) data.person = person;
        if (issue) data.issue = issue;

        let newStartedTime = null;
        if (startedTime) {
            newStartedTime = new Date(startedTime);
            data.startedTime = newStartedTime;
        }

        if (timeEnd) { // 'timeEnd' from body (mapped to schema 'timeEnd')
            const end = new Date(timeEnd);
            data.timeEnd = end;

            // Calculate Total Time if we have a start time (either in update or db)
            let start = newStartedTime;
            if (!start) {
                // We need to fetch current ticket to get startedTime if not updating it
                const currentTicket = await prisma.ticket.findUnique({ where: { id: parseInt(id) } });
                if (currentTicket) start = currentTicket.startedTime;
            }

            if (start) {
                const diffMs = end.getTime() - start.getTime();
                const diffHours = diffMs / (1000 * 60 * 60);
                data.totalTime = parseFloat(diffHours.toFixed(2));
            }
        }

        const ticket = await prisma.ticket.update({
            where: { id: parseInt(id) },
            data,
            include: { admin: true }
        });
        return NextResponse.json(ticket);
    } catch (error) {
        console.error('Error updating ticket:', error);
        return NextResponse.json({ error: 'Error updating ticket' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Ticket ID required' }, { status: 400 });
        }

        await prisma.ticket.delete({
            where: { id: parseInt(id) }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting ticket:', error);
        return NextResponse.json({ error: 'Error deleting ticket' }, { status: 500 });
    }
}
