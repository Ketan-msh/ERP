import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { invoiceId, amountReceived, paymentDate, notes } = body;

    if (!invoiceId || !amountReceived) {
      return NextResponse.json({ error: 'Invoice ID and Amount required' }, { status: 400 });
    }

    const payment = await prisma.payment.create({
      data: {
        invoiceId,
        amountReceived: parseFloat(amountReceived),
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        recordedById: (session.user as any).id,
        notes: notes || null,
      },
    });

    // Check total payments vs invoice amount
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { payments: true, client: true },
    });

    if (invoice) {
      const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amountReceived, 0);
      let newStatus = invoice.status;
      if (totalPaid >= invoice.amount) {
        newStatus = 'PAID';
      }

      await prisma.invoice.update({
        where: { id: invoiceId },
        data: { status: newStatus },
      });

      await prisma.activityLog.create({
        data: {
          userId: (session.user as any).id,
          action: 'UPDATE',
          entityType: 'Invoice',
          entityId: invoice.id,
          details: `Recorded payment of NPR ${payment.amountReceived} for invoice ${invoice.invoiceNumber}`,
        },
      });
    }

    return NextResponse.json(payment);
  } catch (error) {
    console.error('API Error POST /api/invoices/payment:', error);
    return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 });
  }
}
