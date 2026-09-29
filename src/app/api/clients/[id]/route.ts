import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        assignedTeam: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                department: true,
                role: {
                  select: { name: true },
                },
              },
            },
          },
        },
        contentItems: {
          include: {
            assignee: {
              select: { id: true, name: true, avatar: true },
            },
          },
          orderBy: { scheduledDate: 'desc' },
        },
        tasks: {
          include: {
            assignee: {
              select: { id: true, name: true, avatar: true },
            },
          },
          orderBy: { dueDate: 'asc' },
        },
        invoices: {
          include: {
            payments: true,
          },
          orderBy: { issueDate: 'desc' },
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json(client);
  } catch (error) {
    console.error('API Error GET /api/clients/[id]:', error);
    return NextResponse.json({ error: 'Failed to fetch client' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    let userId = (session?.user as any)?.id;
    if (!userId) {
      const firstUser = await prisma.user.findFirst();
      userId = firstUser?.id;
    }

    const existingClient = await prisma.client.findUnique({
      where: { id },
      include: { assignedTeam: true },
    });

    if (!existingClient) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const body = await req.json();
    const { name, logo, color, servicePackage, packageTier, status, monthlyRetainer, startDate, billingCycleDay, assignedUserIds } = body;

    // First update assignments if provided
    if (assignedUserIds) {
      await prisma.clientAssignment.deleteMany({
        where: { clientId: id },
      });
      await prisma.clientAssignment.createMany({
        data: assignedUserIds.map((uId: string) => ({
          clientId: id,
          userId: uId,
        })),
      });
    }

    const updated = await prisma.client.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(logo !== undefined && { logo }),
        ...(color && { color }),
        ...(servicePackage && { servicePackage }),
        ...(packageTier && { packageTier }),
        ...(status && { status }),
        ...(monthlyRetainer !== undefined && { monthlyRetainer: parseFloat(monthlyRetainer) }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(billingCycleDay !== undefined && { billingCycleDay: parseInt(billingCycleDay) }),
      },
      include: {
        assignedTeam: {
          include: { user: true },
        },
      },
    });

    if (userId) {
      await prisma.activityLog.create({
        data: {
          userId,
          action: 'UPDATE',
          entityType: 'Client',
          entityId: id,
          details: `Updated client account: ${updated.name}`,
          previousState: JSON.stringify(existingClient),
        },
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('API Error PUT /api/clients/[id]:', error);
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    let userId = (session?.user as any)?.id;
    if (!userId) {
      const firstUser = await prisma.user.findFirst();
      userId = firstUser?.id;
    }

    const client = await prisma.client.findUnique({
      where: { id },
      include: { assignedTeam: true },
    });
    if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

    // Cleanly delete dependent records to prevent SQLite foreign key constraint errors
    await prisma.clientAssignment.deleteMany({ where: { clientId: id } });

    const invoices = await prisma.invoice.findMany({ where: { clientId: id }, select: { id: true } });
    const invoiceIds = invoices.map((i) => i.id);
    if (invoiceIds.length > 0) {
      await prisma.payment.deleteMany({ where: { invoiceId: { in: invoiceIds } } });
      await prisma.invoice.deleteMany({ where: { clientId: id } });
    }

    const contentItems = await prisma.contentItem.findMany({ where: { clientId: id }, select: { id: true } });
    const contentIds = contentItems.map((c) => c.id);
    if (contentIds.length > 0) {
      await prisma.task.updateMany({ where: { contentItemId: { in: contentIds } }, data: { contentItemId: null } });
      await prisma.contentItem.deleteMany({ where: { clientId: id } });
    }

    await prisma.task.updateMany({ where: { clientId: id }, data: { clientId: null } });

    await prisma.client.delete({ where: { id } });

    if (userId) {
      await prisma.activityLog.create({
        data: {
          userId,
          action: 'DELETE',
          entityType: 'Client',
          entityId: id,
          details: `Deleted client account: ${client.name}`,
          previousState: JSON.stringify(client),
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Error DELETE /api/clients/[id]:', error);
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 });
  }
}
