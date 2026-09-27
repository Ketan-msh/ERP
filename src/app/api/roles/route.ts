import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const roles = await prisma.role.findMany({
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(roles);
  } catch (error) {
    console.error('API Error GET /api/roles:', error);
    return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, permissions, isCustom } = body;

    const role = await prisma.role.create({
      data: {
        name,
        isCustom: isCustom !== undefined ? isCustom : true,
        permissions: typeof permissions === 'string' ? permissions : JSON.stringify(permissions || {}),
      },
    });

    return NextResponse.json(role);
  } catch (error) {
    console.error('API Error POST /api/roles:', error);
    return NextResponse.json({ error: 'Failed to create role' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, name, permissions } = body;

    if (!id) return NextResponse.json({ error: 'Role ID required' }, { status: 400 });

    const role = await prisma.role.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(permissions !== undefined && {
          permissions: typeof permissions === 'string' ? permissions : JSON.stringify(permissions),
        }),
      },
    });

    return NextResponse.json(role);
  } catch (error) {
    console.error('API Error PUT /api/roles:', error);
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
  }
}
