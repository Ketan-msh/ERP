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
    const { clientId, items } = body;

    if (!clientId || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const createdItems = await prisma.$transaction(
      items.map((item: any) =>
        prisma.contentItem.create({
          data: {
            clientId,
            type: item.type || 'STATIC_POST',
            title: item.title,
            description: item.description || null,
            platform: item.platform || 'INSTAGRAM',
            scheduledDate: new Date(item.scheduledDate),
            status: item.status || 'PLANNED',
            assigneeId: item.assigneeId || null,
          },
          include: {
            client: true,
            assignee: true,
          },
        })
      )
    );

    const client = await prisma.client.findUnique({ where: { id: clientId } });

    await prisma.activityLog.create({
      data: {
        userId: (session.user as any).id,
        action: 'CREATE',
        entityType: 'ContentItem',
        entityId: clientId,
        details: `Planning Wizard: Created ${createdItems.length} content items for ${client?.name || 'Client'}`,
      },
    });

    return NextResponse.json(createdItems);
  } catch (error) {
    console.error('API Error POST /api/content/bulk:', error);
    return NextResponse.json({ error: 'Failed to bulk create content items' }, { status: 500 });
  }
}
