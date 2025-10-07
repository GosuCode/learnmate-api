import { FastifyRequest, FastifyReply } from 'fastify';
import { GroupService } from '@/services/groupService';
import { CreateGroupSchema, UpdateGroupSchema } from '@/models/groupModel';

const groupService = new GroupService();

export const createGroup = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = (request as any).user?.userId;
    if (!userId) {
      return reply.status(401).send({ success: false, message: 'Unauthorized' });
    }

    const data = CreateGroupSchema.parse(request.body);
    const group = await groupService.createGroup(data, userId);

    return reply.status(201).send({
      success: true,
      group,
    });
  } catch (error) {
    console.error('Error creating group:', error);
    return reply.status(400).send({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create group',
    });
  }
};

export const getGroups = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = (request as any).user?.userId;
    if (!userId) {
      return reply.status(401).send({ success: false, message: 'Unauthorized' });
    }

    const { page = 1, limit = 10 } = request.query as { page?: string; limit?: string };
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 10;
    const result = await groupService.getGroupsWithContent(userId, pageNum, limitNum);

    return reply.send({
      success: true,
      groups: result.groups,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  } catch (error) {
    console.error('Error fetching groups:', error);
    return reply.status(500).send({
      success: false,
      message: 'Failed to fetch groups',
    });
  }
};

export const getGroupById = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = (request as any).user?.userId;
    if (!userId) {
      return reply.status(401).send({ success: false, message: 'Unauthorized' });
    }

    const { id } = request.params as { id: string };
    const group = await groupService.getGroupById(id, userId);

    if (!group) {
      return reply.status(404).send({
        success: false,
        message: 'Group not found',
      });
    }

    return reply.send({
      success: true,
      group,
    });
  } catch (error) {
    console.error('Error fetching group:', error);
    return reply.status(500).send({
      success: false,
      message: 'Failed to fetch group',
    });
  }
};

export const updateGroup = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = (request as any).user?.userId;
    if (!userId) {
      return reply.status(401).send({ success: false, message: 'Unauthorized' });
    }

    const { id } = request.params as { id: string };
    const data = UpdateGroupSchema.parse(request.body);
    const group = await groupService.updateGroup(id, data, userId);

    return reply.send({
      success: true,
      group,
    });
  } catch (error) {
    console.error('Error updating group:', error);
    return reply.status(400).send({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update group',
    });
  }
};

export const deleteGroup = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = (request as any).user?.userId;
    if (!userId) {
      return reply.status(401).send({ success: false, message: 'Unauthorized' });
    }

    const { id } = request.params as { id: string };
    await groupService.deleteGroup(id, userId);

    return reply.send({
      success: true,
      message: 'Group deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting group:', error);
    return reply.status(400).send({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to delete group',
    });
  }
};
