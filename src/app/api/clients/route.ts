import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const clients = await prisma.client.findMany({
      include: {
        assignedTeam: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
                department: true,
              },
            },
          },
        },
        contentItems: {
          select: {
            id: true,
            status: true,
          },
        },
        invoices: {
          select: {
            id: true,
            amount: true,
            status: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(clients);
  } catch (error) {
    console.error('API Error /api/clients:', error);
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    let userId = (session?.user as any)?.id;
    if (!userId) {
      const firstUser = await prisma.user.findFirst();
      userId = firstUser?.id;
    }

    const body = await req.json();
    const { name, logo, color, servicePackage, packageTier, status, monthlyRetainer, startDate, billingCycleDay, assignedUserIds } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Client business name is required' }, { status: 400 });
    }

    const newClient = await prisma.client.create({
      data: {
        name: name.trim(),
        logo: logo || null,
        color: color || '#FF3B00',
        servicePackage: servicePackage || 'Social & Growth',
        packageTier: packageTier || 'Standard',
        status: status || 'ACTIVE',
        monthlyRetainer: parseFloat(monthlyRetainer) || 0,
        startDate: startDate ? new Date(startDate) : new Date(),
        billingCycleDay: parseInt(billingCycleDay) || 1,
        assignedTeam: {
          create: (assignedUserIds || []).map((userId: string) => ({
            userId,
          })),
        },
      },
      include: {
        assignedTeam: {
          include: {
            user: true,
          },
        },
      },
    });

    // Activity log
    if (userId) {
      await prisma.activityLog.create({
        data: {
          userId,
          action: 'CREATE',
          entityType: 'Client',
          entityId: newClient.id,
          details: `Created new client: ${newClient.name}`,
        },
      });
    }

    return NextResponse.json(newClient);
  } catch (error) {
    console.error('API Error POST /api/clients:', error);
    return NextResponse.json({ error: 'Failed to create client account' }, { status: 500 });
  }
}
