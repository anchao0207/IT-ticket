import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '../../../../prisma/generated/client';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search');
  const clientId = searchParams.get('clientId');
  const type = searchParams.get('type');

  const where: Prisma.assetWhereInput = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { serialNumber: { contains: search, mode: 'insensitive' } },
    ];
  }
  
  if (clientId) {
    where.clientId = parseInt(clientId);
  }

  if (type) {
    where.type = type;
  }

  try {
    const assets = await prisma.asset.findMany({
      where,
      include: { client: true },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(assets);
  } catch (error) {
    console.error('Error fetching assets:', error);
    return NextResponse.json({ error: 'Failed to fetch assets' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { serialNumber, name, type, status, purchaseDate, clientId, description } = body;
    
    if (!serialNumber || !name || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const asset = await prisma.asset.create({
      data: {
        serialNumber,
        name,
        type,
        description,
        status: status || 'In Storage',
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        clientId: clientId ? parseInt(clientId) : null,
      },
    });
    
    return NextResponse.json(asset);
  } catch (error) {
    console.error('Error creating asset:', error);
    return NextResponse.json({ error: 'Failed to create asset' }, { status: 500 });
  }
}
