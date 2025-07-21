import { FastifyRequest, FastifyReply } from "fastify";
import { CourseService } from "../services/courseService";
import { ApiResponse } from "../types/api";

const courseService = new CourseService();

export const courseController = {
    async createCourse(request: FastifyRequest<{ Body: { slug: string; name: string; semester: number; description?: string } }>, reply: FastifyReply) {
        try {
            const { slug, name, semester, description } = request.body;

            if (!slug || !name || !semester) {
                return reply.status(400).send({
                    success: false,
                    error: "Validation error",
                    message: "Slug, name, and semester are required",
                });
            }

            const course = await courseService.create({ slug, name, semester, description });

            const response: ApiResponse = {
                success: true,
                data: course,
                message: "Course created successfully",
            };

            return reply.status(201).send(response);
        } catch (error: any) {
            if (error.message.includes("Unique constraint")) {
                return reply.status(409).send({
                    success: false,
                    error: "Conflict",
                    message: "Course with this slug already exists",
                });
            }
            return reply.status(500).send({
                success: false,
                error: "Internal server error",
                message: "Failed to create course",
            });
        }
    },

    async getAllCourses(_request: FastifyRequest, reply: FastifyReply) {
        try {
            const courses = await courseService.getAll();
            return reply.send({
                success: true,
                data: courses,
                message: "Courses retrieved successfully",
            });
        } catch {
            return reply.status(500).send({
                success: false,
                error: "Internal server error",
                message: "Failed to get courses",
            });
        }
    },

    async getCourseById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        try {
            const { id } = request.params;
            const course = await courseService.getById(id);
            if (!course) {
                return reply.status(404).send({
                    success: false,
                    error: "Not found",
                    message: "Course not found",
                });
            }
            return reply.send({
                success: true,
                data: course,
                message: "Course retrieved successfully",
            });
        } catch {
            return reply.status(500).send({
                success: false,
                error: "Internal server error",
                message: "Failed to get course",
            });
        }
    },

    async updateCourse(request: FastifyRequest<{ Params: { id: string }; Body: { name?: string; semester?: number; description?: string } }>, reply: FastifyReply) {
        try {
            const { id } = request.params;
            const updates = request.body;

            const updatedCourse = await courseService.updateById(id, updates);

            if (!updatedCourse) {
                return reply.status(404).send({
                    success: false,
                    error: "Not found",
                    message: "Course not found",
                });
            }

            return reply.send({
                success: true,
                data: updatedCourse,
                message: "Course updated successfully",
            });
        } catch {
            return reply.status(500).send({
                success: false,
                error: "Internal server error",
                message: "Failed to update course",
            });
        }
    },

    async deleteCourse(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        try {
            const { id } = request.params;
            const deleted = await courseService.deleteById(id);

            if (!deleted) {
                return reply.status(404).send({
                    success: false,
                    error: "Not found",
                    message: "Course not found",
                });
            }

            return reply.send({
                success: true,
                message: "Course deleted successfully",
            });
        } catch {
            return reply.status(500).send({
                success: false,
                error: "Internal server error",
                message: "Failed to delete course",
            });
        }
    },
};
