import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');
    const status = searchParams.get('status');

    const where: any = {};
    if (clientId) where.clientId = clientId;
    if (status) where.status = status;

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            color: true,
            logo: true,
          },
        },
        payments: {
          include: {
            recordedBy: {
              select: { name: true },
            },
          },
          orderBy: { paymentDate: 'desc' },
        },
      },
      orderBy: { issueDate: 'desc' },
    });

    return NextResponse.json(invoices);
  } catch (error) {
    console.error('API Error GET /api/invoices:', error);
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { clientId, invoiceNumber, amount, issueDate, dueDate, status, billingPeriod, paymentNotes } = body;

    const invoice = await prisma.invoice.create({
      data: {
        clientId,
        invoiceNumber,
        amount: parseFloat(amount),
        issueDate: new Date(issueDate),
        dueDate: new Date(dueDate),
        status: status || 'DRAFT',
        billingPeriod,
        paymentNotes: paymentNotes || null,
      },
      include: {
        client: true,
        payments: true,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: (session.user as any).id,
        action: 'CREATE',
        entityType: 'Invoice',
        entityId: invoice.id,
        details: `Created invoice ${invoice.invoiceNumber} (NPR ${invoice.amount}) for ${invoice.client.name}`,
      },
    });

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('API Error POST /api/invoices:', error);
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, status, paymentNotes, amount, dueDate, issueDate, billingPeriod } = body;

    if (!id) return NextResponse.json({ error: 'Invoice ID required' }, { status: 400 });

    const updated = await prisma.invoice.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(paymentNotes !== undefined && { paymentNotes }),
        ...(amount !== undefined && { amount: parseFloat(amount) }),
        ...(dueDate && { dueDate: new Date(dueDate) }),
        ...(issueDate && { issueDate: new Date(issueDate) }),
        ...(billingPeriod && { billingPeriod }),
      },
      include: { client: true, payments: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('API Error PUT /api/invoices:', error);
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 });
  }
}
