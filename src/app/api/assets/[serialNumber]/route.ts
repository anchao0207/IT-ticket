import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

interface RouteProps {
  params: Promise<{
    serialNumber: string;
  }>;
}

export async function GET(req: NextRequest, { params }: RouteProps) {
  const { serialNumber } = await params;
  
  try {
    // Decoding serialNumber in case it has special characters, though usually params are decoded
    // But safe to just use it. 
    // Wait, serialNumber in URL might be URL encoded.
    const decodedSerial = decodeURIComponent(serialNumber);

    const asset = await prisma.asset.findUnique({
      where: { serialNumber: decodedSerial },
      include: { client: true, tickets: true },
    });

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    return NextResponse.json(asset);
  } catch (error) {
    console.error('Error fetching asset:', error);
    return NextResponse.json({ error: 'Failed to fetch asset' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: RouteProps) {
  const { serialNumber } = await params;
  const decodedSerial = decodeURIComponent(serialNumber);
  
  try {
    const body = await req.json();
    const { name, type, status, purchaseDate, clientId, description } = body;

    const asset = await prisma.asset.update({
      where: { serialNumber: decodedSerial },
      data: {
        name,
        type,
        description,
        status,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
        clientId: clientId ? parseInt(clientId) : undefined,
      },
    });

    return NextResponse.json(asset);
  } catch (error) {
    console.error('Error updating asset:', error);
    return NextResponse.json({ error: 'Failed to update asset' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteProps) {
  const { serialNumber } = await params;
  const decodedSerial = decodeURIComponent(serialNumber);

  try {
    await prisma.asset.delete({
      where: { serialNumber: decodedSerial },
    });

    return NextResponse.json({ message: 'Asset deleted' });
  } catch (error) {
    console.error('Error deleting asset:', error);
    return NextResponse.json({ error: 'Failed to delete asset' }, { status: 500 });
  }
}
