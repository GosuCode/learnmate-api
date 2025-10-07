import { prisma } from '@/lib/prisma';
import { CreateGroupInput, UpdateGroupInput } from '@/models/groupModel';
import { Group, GroupWithCounts } from '@/types/group';

export class GroupService {
  async createGroup(data: CreateGroupInput, userId: string): Promise<Group> {
    return await prisma.group.create({
      data: {
        ...data,
        userId,
      },
      include: {
        flashcards: true,
        quizzes: true,
      },
    });
  }

  async getGroupsByUser(userId: string): Promise<GroupWithCounts[]> {
    const groups = await prisma.group.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            flashcards: true,
            quizzes: true,
          },
        },
      },
    });

    return groups.map(group => ({
      id: group.id,
      name: group.name,
      description: group.description,
      color: group.color,
      userId: group.userId,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
      flashcardCount: group._count.flashcards,
      quizCount: group._count.quizzes,
    }));
  }

  async getGroupById(id: string, userId: string): Promise<Group | null> {
    return await prisma.group.findFirst({
      where: { id, userId },
      include: {
        flashcards: {
          orderBy: { createdAt: 'desc' },
        },
        quizzes: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async updateGroup(id: string, data: UpdateGroupInput, userId: string): Promise<Group> {
    const existing = await prisma.group.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new Error('Group not found');
    }

    return await prisma.group.update({
      where: { id },
      data,
      include: {
        flashcards: true,
        quizzes: true,
      },
    });
  }

  async deleteGroup(id: string, userId: string): Promise<void> {
    const existing = await prisma.group.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new Error('Group not found');
    }

    // Move flashcards and quizzes to ungrouped (set groupId to null)
    await prisma.flashcard.updateMany({
      where: { groupId: id },
      data: { groupId: null },
    });

    await prisma.quiz.updateMany({
      where: { groupId: id },
      data: { groupId: null },
    });

    await prisma.group.delete({
      where: { id },
    });
  }

  async getGroupsWithContent(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [groups, total] = await Promise.all([
      prisma.group.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              flashcards: true,
              quizzes: true,
            },
          },
        },
      }),
      prisma.group.count({
        where: { userId },
      }),
    ]);

    return {
      groups: groups.map(group => ({
        id: group.id,
        name: group.name,
        description: group.description,
        color: group.color,
        userId: group.userId,
        createdAt: group.createdAt,
        updatedAt: group.updatedAt,
        flashcardCount: group._count.flashcards,
        quizCount: group._count.quizzes,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
