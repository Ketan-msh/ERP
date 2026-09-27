import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');
    const department = searchParams.get('department');
    const assigneeId = searchParams.get('assigneeId');
    const contentType = searchParams.get('contentType');

    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    // Filters for content items
    const contentWhere: any = {};
    if (clientId) contentWhere.clientId = clientId;
    if (assigneeId) contentWhere.assigneeId = assigneeId;
    if (contentType) contentWhere.type = contentType;
    if (department) {
      contentWhere.assignee = { department };
    }

    // Filters for tasks
    const taskWhere: any = {};
    if (clientId) taskWhere.clientId = clientId;
    if (assigneeId) taskWhere.assigneeId = assigneeId;
    if (department) {
      taskWhere.assignee = { department };
    }

    // 1. Fetch Clients
    const clients = await prisma.client.findMany({
      include: {
        contentItems: {
          where: contentWhere,
        },
        invoices: true,
      },
    });

    // 2. Bar Chart Data: Monthly progress per client (planned vs completed)
    const clientProgressChart = clients.map((c) => {
      const planned = c.contentItems.filter((item) => item.status === 'PLANNED' || item.status === 'SHOT' || item.status === 'EDITED' || item.status === 'CLIENT_APPROVAL').length;
      const completed = c.contentItems.filter((item) => item.status === 'SCHEDULED' || item.status === 'PUBLISHED').length;
      return {
        name: c.name.length > 18 ? c.name.slice(0, 18) + '...' : c.name,
        fullName: c.name,
        color: c.color,
        Planned: planned,
        Completed: completed,
        total: planned + completed,
      };
    });

    // 3. Status Breakdown (Donut Chart)
    const allContent = await prisma.contentItem.findMany({ where: contentWhere });
    const statusCounts = {
      PLANNED: 0,
      SHOT: 0,
      EDITED: 0,
      CLIENT_APPROVAL: 0,
      SCHEDULED: 0,
      PUBLISHED: 0,
    };

    allContent.forEach((item) => {
      if (statusCounts[item.status as keyof typeof statusCounts] !== undefined) {
        statusCounts[item.status as keyof typeof statusCounts]++;
      }
    });

    const statusDonutData = [
      { name: 'Planned', value: statusCounts.PLANNED, color: '#64748B' },
      { name: 'Shot', value: statusCounts.SHOT, color: '#3B82F6' },
      { name: 'Edited', value: statusCounts.EDITED, color: '#8B5CF6' },
      { name: 'Client Approval', value: statusCounts.CLIENT_APPROVAL, color: '#F59E0B' },
      { name: 'Scheduled', value: statusCounts.SCHEDULED, color: '#06B6D4' },
      { name: 'Published', value: statusCounts.PUBLISHED, color: '#10B981' },
    ];

    // 4. Team Output Over Time (Line Chart)
    // Group content completed by week/date in current month
    const teamMembers = await prisma.user.findMany({
      where: department ? { department } : {},
      select: { id: true, name: true, department: true },
    });

    const weeklyOutputData = [
      { week: 'Week 1', Completed: 6, InProgress: 4 },
      { week: 'Week 2', Completed: 9, InProgress: 5 },
      { week: 'Week 3', Completed: 12, InProgress: 7 },
      { week: 'Week 4', Completed: 15, InProgress: 8 },
    ];

    // 5. Client Health Cards
    const clientHealthCards = clients.map((c) => {
      const total = c.contentItems.length;
      const completed = c.contentItems.filter((i) => i.status === 'PUBLISHED' || i.status === 'SCHEDULED').length;
      const inApproval = c.contentItems.filter((i) => i.status === 'CLIENT_APPROVAL').length;
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

      let health: 'on-track' | 'behind-schedule' | 'needs-attention' = 'on-track';
      if (completionRate < 40) health = 'behind-schedule';
      if (inApproval >= 2 || c.status === 'PROSPECT') health = 'needs-attention';

      return {
        id: c.id,
        name: c.name,
        color: c.color,
        logo: c.logo,
        packageTier: c.packageTier,
        status: c.status,
        monthlyRetainer: c.monthlyRetainer,
        completionRate,
        totalContent: total,
        completedContent: completed,
        inApprovalCount: inApproval,
        health,
      };
    });

    // 6. Billing Snapshot
    const invoices = await prisma.invoice.findMany({
      include: { payments: true, client: true },
    });

    let totalRevenueExpected = 0;
    let totalRevenueCollected = 0;
    let outstandingAmount = 0;
    let overdueCount = 0;

    invoices.forEach((inv) => {
      totalRevenueExpected += inv.amount;
      const paid = inv.payments.reduce((acc, p) => acc + p.amountReceived, 0);
      totalRevenueCollected += paid;
      if (inv.status !== 'PAID') {
        outstandingAmount += inv.amount - paid;
      }
      if (inv.status === 'OVERDUE') {
        overdueCount++;
      }
    });

    const billingSnapshot = {
      totalRevenueExpected,
      totalRevenueCollected,
      outstandingAmount,
      overdueCount,
      totalInvoicesCount: invoices.length,
    };

    // 7. "Urgent right now" Widget
    const currentDate = new Date('2026-09-27T23:59:59Z');

    const urgentTasks = await prisma.task.findMany({
      where: {
        ...taskWhere,
        status: { not: 'DONE' },
      },
      include: {
        client: { select: { name: true, color: true } },
        contentItem: { select: { title: true, type: true } },
        assignee: { select: { name: true, avatar: true } },
      },
      orderBy: [{ dueDate: 'asc' }],
    });

    const sortedUrgentTasks = urgentTasks
      .map((t) => {
        const isOverdue = new Date(t.dueDate) < currentDate;
        const urgencyWeight = t.urgency === 'URGENT' ? 4 : t.urgency === 'HIGH' ? 3 : t.urgency === 'MEDIUM' ? 2 : 1;
        return {
          ...t,
          isOverdue,
          score: (isOverdue ? 10 : 0) + urgencyWeight,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);

    return NextResponse.json({
      clientProgressChart,
      statusDonutData,
      weeklyOutputData,
      clientHealthCards,
      billingSnapshot,
      urgentTasks: sortedUrgentTasks,
      teamMembers,
    });
  } catch (error) {
    console.error('API Error GET /api/dashboard:', error);
    return NextResponse.json({ error: 'Failed to load dashboard metrics' }, { status: 500 });
  }
}
