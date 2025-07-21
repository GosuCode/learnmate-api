import { FastifyRequest, FastifyReply } from "fastify";
import { ChapterService } from "../services/chapterService";
import { ApiResponse } from "../types/api";

const chapterService = new ChapterService();

export const chapterController = {
    async createChapter(request: FastifyRequest<{ Body: { courseId: string; chapterNumber: number; slug: string; title: string; content: string } }>, reply: FastifyReply) {
        try {
            const { courseId, chapterNumber, slug, title, content } = request.body;

            if (!courseId || !chapterNumber || !slug || !title || !content) {
                return reply.status(400).send({
                    success: false,
                    error: "Validation error",
                    message: "All fields are required",
                });
            }

            const chapter = await chapterService.create({ courseId, chapterNumber, slug, title, content });

            const response: ApiResponse = {
                success: true,
                data: chapter,
                message: "Chapter created successfully",
            };

            return reply.status(201).send(response);
        } catch (error: any) {
            if (error.message.includes("Unique constraint")) {
                return reply.status(409).send({
                    success: false,
                    error: "Conflict",
                    message: "Chapter number or slug already exists for this course",
                });
            }
            return reply.status(500).send({
                success: false,
                error: "Internal server error",
                message: "Failed to create chapter",
            });
        }
    },

    async getAllChapters(_: FastifyRequest, reply: FastifyReply) {
        try {
            const chapters = await chapterService.getAll();
            return reply.send({
                success: true,
                data: chapters,
                message: 'All chapters retrieved successfully',
            });
        } catch {
            return reply.status(500).send({
                success: false,
                error: 'Internal server error',
                message: 'Failed to get all chapters',
            });
        }
    },

    async getChapterById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        try {
            const { id } = request.params;
            const chapter = await chapterService.getById(id);
            if (!chapter) {
                return reply.status(404).send({
                    success: false,
                    error: 'Not found',
                    message: 'Chapter not found',
                });
            }
            return reply.send({
                success: true,
                data: chapter,
                message: 'Chapter retrieved successfully',
            });
        } catch {
            return reply.status(500).send({
                success: false,
                error: 'Internal server error',
                message: 'Failed to get chapter',
            });
        }
    },

    async getAllByCourse(request: FastifyRequest<{ Params: { courseId: string } }>, reply: FastifyReply) {
        try {
            const { courseId } = request.params;
            const chapters = await chapterService.getAllByCourse(courseId);
            return reply.send({
                success: true,
                data: chapters,
                message: "Chapters retrieved successfully",
            });
        } catch {
            return reply.status(500).send({
                success: false,
                error: "Internal server error",
                message: "Failed to get chapters",
            });
        }
    },

    async getByCourseAndNumber(request: FastifyRequest<{ Params: { courseSlug: string; chapterNumber: string } }>, reply: FastifyReply) {
        try {
            const { courseSlug, chapterNumber } = request.params;
            const chapter = await chapterService.getByCourseSlugAndNumber(courseSlug, Number(chapterNumber));
            if (!chapter) {
                return reply.status(404).send({
                    success: false,
                    error: "Not found",
                    message: "Chapter not found",
                });
            }
            return reply.send({
                success: true,
                data: chapter,
                message: "Chapter retrieved successfully",
            });
        } catch {
            return reply.status(500).send({
                success: false,
                error: "Internal server error",
                message: "Failed to get chapter",
            });
        }
    },

    async updateChapter(request: FastifyRequest<{ Params: { id: string }; Body: { chapterNumber?: number; slug?: string; title?: string; content?: string } }>, reply: FastifyReply) {
        try {
            const { id } = request.params;
            const updates = request.body;

            const updatedChapter = await chapterService.updateById(id, updates);

            if (!updatedChapter) {
                return reply.status(404).send({
                    success: false,
                    error: "Not found",
                    message: "Chapter not found",
                });
            }

            return reply.send({
                success: true,
                data: updatedChapter,
                message: "Chapter updated successfully",
            });
        } catch {
            return reply.status(500).send({
                success: false,
                error: "Internal server error",
                message: "Failed to update chapter",
            });
        }
    },

    async deleteChapter(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        try {
            const { id } = request.params;
            const deleted = await chapterService.deleteById(id);

            if (!deleted) {
                return reply.status(404).send({
                    success: false,
                    error: "Not found",
                    message: "Chapter not found",
                });
            }

            return reply.send({
                success: true,
                message: "Chapter deleted successfully",
            });
        } catch {
            return reply.status(500).send({
                success: false,
                error: "Internal server error",
                message: "Failed to delete chapter",
            });
        }
    },
};
