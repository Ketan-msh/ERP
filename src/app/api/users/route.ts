import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      include: {
        role: true,
        assignedClients: {
          include: {
            client: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Mask passwords
    const safeUsers = users.map((u) => {
      const { password, ...rest } = u;
      return rest;
    });

    return NextResponse.json(safeUsers);
  } catch (error) {
    console.error('API Error GET /api/users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, email, password, department, roleId, avatar, active, assignedClientIds } = body;

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (existing) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password || 'password123', 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        department: department || 'Social Media',
        roleId: roleId || null,
        avatar: avatar || null,
        active: active !== undefined ? active : true,
        assignedClients: {
          create: (assignedClientIds || []).map((cId: string) => ({
            clientId: cId,
          })),
        },
      },
      include: {
        role: true,
        assignedClients: { include: { client: true } },
      },
    });

    const { password: _, ...safeUser } = newUser;
    return NextResponse.json(safeUser);
  } catch (error) {
    console.error('API Error POST /api/users:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, name, email, password, department, roleId, avatar, active, assignedClientIds } = body;

    if (!id) return NextResponse.json({ error: 'User ID required' }, { status: 400 });

    if (assignedClientIds) {
      await prisma.clientAssignment.deleteMany({ where: { userId: id } });
      await prisma.clientAssignment.createMany({
        data: assignedClientIds.map((cId: string) => ({
          userId: id,
          clientId: cId,
        })),
      });
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email.toLowerCase().trim();
    if (department) updateData.department = department;
    if (roleId) updateData.roleId = roleId;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (active !== undefined) updateData.active = active;
    if (password) updateData.password = await bcrypt.hash(password, 10);

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        role: true,
        assignedClients: { include: { client: true } },
      },
    });

    const { password: _, ...safeUser } = updatedUser;
    return NextResponse.json(safeUser);
  } catch (error) {
    console.error('API Error PUT /api/users:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
