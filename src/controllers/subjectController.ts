import { FastifyRequest, FastifyReply } from 'fastify';
import { SubjectService } from '@/services/subjectService';
import { CreateSubjectInput, UpdateSubjectInput } from '@/models/subjectModel';
import { ApiResponse } from '@/types/api';

const subjectService = new SubjectService();

export const subjectController = {
    async create(
        req: FastifyRequest<{ Body: CreateSubjectInput }>,
        reply: FastifyReply
    ) {
        try {
            const { name, code, semesterId } = req.body;

            if (!name || !code || !semesterId) {
                return reply.status(400).send({
                    success: false,
                    error: 'Validation error',
                    message: 'name, code, and semesterId are required',
                });
            }

            const subject = await subjectService.createSubject(req.body);

            const response: ApiResponse = {
                success: true,
                data: subject,
                message: 'Subject created successfully',
            };

            return reply.status(201).send(response);
        } catch (error: any) {
            if (error.message.includes('Unique constraint')) {
                return reply.status(409).send({
                    success: false,
                    error: 'Conflict',
                    message: 'Subject with this name or code already exists',
                });
            }

            return reply.status(500).send({
                success: false,
                error: 'Internal server error',
                message: 'Failed to create subject',
                details: error,
            });
        }
    },

    async getAll(_req: FastifyRequest, reply: FastifyReply) {
        try {
            const subjects = await subjectService.getAllSubjects();

            const response: ApiResponse = {
                success: true,
                data: subjects,
                message: 'Subjects retrieved successfully',
            };

            return reply.send(response);
        } catch (error) {
            return reply.status(500).send({
                success: false,
                error: 'Internal server error',
                message: 'Failed to fetch subjects',
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
            const subject = await subjectService.getSubjectById(id);

            if (!subject) {
                return reply.status(404).send({
                    success: false,
                    error: 'Not found',
                    message: 'Subject not found',
                });
            }

            const response: ApiResponse = {
                success: true,
                data: subject,
                message: 'Subject retrieved successfully',
            };

            return reply.send(response);
        } catch (error) {
            return reply.status(500).send({
                success: false,
                error: 'Internal server error',
                message: 'Failed to fetch subject',
                details: error,
            });
        }
    },

    async update(
        req: FastifyRequest<{ Params: { id: string }; Body: UpdateSubjectInput }>,
        reply: FastifyReply
    ) {
        try {
            const { id } = req.params;
            const updates = req.body;

            const updatedSubject = await subjectService.updateSubject(id, updates);

            const response: ApiResponse = {
                success: true,
                data: updatedSubject,
                message: 'Subject updated successfully',
            };

            return reply.send(response);
        } catch (error) {
            return reply.status(500).send({
                success: false,
                error: 'Internal server error',
                message: 'Failed to update subject',
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
            const deleted = await subjectService.deleteSubject(id);

            if (!deleted) {
                return reply.status(404).send({
                    success: false,
                    error: 'Not found',
                    message: 'Subject not found',
                });
            }

            return reply.status(204).send({
                success: true,
                message: 'Subject deleted successfully',
            });
        } catch (error) {
            return reply.status(500).send({
                success: false,
                error: 'Internal server error',
                message: 'Failed to delete subject',
                details: error,
            });
        }
    },
};
