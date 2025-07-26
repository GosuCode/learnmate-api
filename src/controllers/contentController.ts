import { FastifyRequest, FastifyReply } from 'fastify';
import { ContentService } from '@/services/contentService';
import { CreateContentInput, UpdateContentInput } from '@/models/contentModel';
import { ApiResponse } from '@/types/api';

const contentService = new ContentService();

export const contentController = {
    async create(
        req: FastifyRequest<{ Body: CreateContentInput }>,
        reply: FastifyReply
    ) {
        try {
            const { title, slug, type, subjectId, createdById } = req.body;

            if (!title || !slug || !type || !subjectId || !createdById) {
                return reply.status(400).send({
                    success: false,
                    error: 'Validation error',
                    message: 'title, slug, type, subjectId, and createdById are required',
                });
            }

            const content = await contentService.createContent(req.body);

            const response: ApiResponse = {
                success: true,
                data: content,
                message: 'Content created successfully',
            };

            return reply.status(201).send(response);
        } catch (error: any) {
            if (error.message.includes('already exists')) {
                return reply.status(409).send({
                    success: false,
                    error: 'Conflict',
                    message: 'Content with this slug already exists',
                });
            }

            return reply.status(500).send({
                success: false,
                error: 'Internal server error',
                message: 'Failed to create content',
                details: error,
            });
        }
    },

    async getAll(_req: FastifyRequest, reply: FastifyReply) {
        try {
            const contents = await contentService.getAllContents();

            const response: ApiResponse = {
                success: true,
                data: contents,
                message: 'Contents retrieved successfully',
            };

            return reply.send(response);
        } catch (error) {
            return reply.status(500).send({
                success: false,
                error: 'Internal server error',
                message: 'Failed to fetch contents',
                details: error,
            });
        }
    },

    async getById(
        req: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply
    ) {
        try {
            const { id } = req.params;
            const content = await contentService.getContentById(id);

            if (!content) {
                return reply.status(404).send({
                    success: false,
                    error: 'Not found',
                    message: 'Content not found',
                });
            }

            const response: ApiResponse = {
                success: true,
                data: content,
                message: 'Content retrieved successfully',
            };

            return reply.send(response);
        } catch (error) {
            return reply.status(500).send({
                success: false,
                error: 'Internal server error',
                message: 'Failed to fetch content',
                details: error,
            });
        }
    },

    async update(
        req: FastifyRequest<{ Params: { id: string }; Body: UpdateContentInput }>,
        reply: FastifyReply
    ) {
        try {
            const { id } = req.params;
            const updates = req.body;

            const updatedContent = await contentService.updateContent(id, updates);

            const response: ApiResponse = {
                success: true,
                data: updatedContent,
                message: 'Content updated successfully',
            };

            return reply.send(response);
        } catch (error) {
            return reply.status(500).send({
                success: false,
                error: 'Internal server error',
                message: 'Failed to update content',
                details: error,
            });
        }
    },

    async delete(
        req: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply
    ) {
        try {
            const { id } = req.params;
            const deleted = await contentService.deleteContent(id);

            if (!deleted) {
                return reply.status(404).send({
                    success: false,
                    error: 'Not found',
                    message: 'Content not found',
                });
            }

            return reply.status(204).send({
                success: true,
                message: 'Content deleted successfully',
            });
        } catch (error) {
            return reply.status(500).send({
                success: false,
                error: 'Internal server error',
                message: 'Failed to delete content',
                details: error,
            });
        }
    },
};
