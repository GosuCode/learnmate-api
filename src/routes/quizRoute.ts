import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { quizService } from "@/services/quizService";
import { authPreHandler } from "@/middleware/auth";

export default async function quizRoutes(app: FastifyInstance) {
    app.get("/", {
        preHandler: [authPreHandler],
        handler: async (request: FastifyRequest, reply: FastifyReply) => {
            try {
                const user = (request as any).user;
                const page = parseInt((request.query as any).page) || 1;
                const limit = parseInt((request.query as any).limit) || 10;

                const result = await quizService.getUserQuizzes(user.userId, page, limit);

                return reply.send({
                    success: true,
                    data: result,
                    message: "Quizzes retrieved successfully"
                });
            } catch (error) {
                app.log.error('Error fetching user quizzes:', error);
                return reply.status(500).send({
                    success: false,
                    error: 'Failed to fetch quizzes',
                    message: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
    });

    app.get("/:id", {
        preHandler: [authPreHandler],
        handler: async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
            try {
                const user = (request as any).user;
                const { id } = request.params;

                const quiz = await quizService.getQuizById(id, user.userId);

                if (!quiz) {
                    return reply.status(404).send({
                        success: false,
                        error: 'Quiz not found',
                        message: 'Quiz not found or you do not have permission to view it'
                    });
                }

                return reply.send({
                    success: true,
                    data: quiz,
                    message: "Quiz retrieved successfully"
                });
            } catch (error) {
                app.log.error('Error fetching quiz:', error);
                return reply.status(500).send({
                    success: false,
                    error: 'Failed to fetch quiz',
                    message: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
    });

    app.post("/", {
        preHandler: [authPreHandler],
        handler: async (request: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
            try {
                const user = (request as any).user;
                const quizData = {
                    ...(request.body as any),
                    userId: user.userId
                };

                const quiz = await quizService.createQuiz(quizData);

                return reply.status(201).send({
                    success: true,
                    data: quiz,
                    message: "Quiz created successfully"
                });
            } catch (error) {
                app.log.error('Error creating quiz:', error);
                return reply.status(500).send({
                    success: false,
                    error: 'Failed to create quiz',
                    message: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
    });

    app.put("/:id", {
        preHandler: [authPreHandler],
        handler: async (request: FastifyRequest<{ Params: { id: string }, Body: any }>, reply: FastifyReply) => {
            try {
                const user = (request as any).user;
                const { id } = request.params;

                const result = await quizService.updateQuiz(id, user.userId, request.body as any);

                if (result.count === 0) {
                    return reply.status(404).send({
                        success: false,
                        error: 'Quiz not found',
                        message: 'Quiz not found or you do not have permission to update it'
                    });
                }

                return reply.send({
                    success: true,
                    message: "Quiz updated successfully"
                });
            } catch (error) {
                app.log.error('Error updating quiz:', error);
                return reply.status(500).send({
                    success: false,
                    error: 'Failed to update quiz',
                    message: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
    });

    app.delete("/:id", {
        preHandler: [authPreHandler],
        handler: async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
            try {
                const user = (request as any).user;
                const { id } = request.params;

                const result = await quizService.deleteQuiz(id, user.userId);

                if (result.count === 0) {
                    return reply.status(404).send({
                        success: false,
                        error: 'Quiz not found',
                        message: 'Quiz not found or you do not have permission to delete it'
                    });
                }

                return reply.send({
                    success: true,
                    message: "Quiz deleted successfully"
                });
            } catch (error) {
                app.log.error('Error deleting quiz:', error);
                return reply.status(500).send({
                    success: false,
                    error: 'Failed to delete quiz',
                    message: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
    });

    app.get("/search", {
        preHandler: [authPreHandler],
        handler: async (request: FastifyRequest<{ Querystring: { q: string, page?: string, limit?: string } }>, reply: FastifyReply) => {
            try {
                const user = (request as any).user;
                const { q, page = "1", limit = "10" } = request.query;

                if (!q) {
                    return reply.status(400).send({
                        success: false,
                        error: 'Query parameter is required',
                        message: 'Search query is required'
                    });
                }

                const result = await quizService.searchQuizzes(user.userId, q, parseInt(page), parseInt(limit));

                return reply.send({
                    success: true,
                    data: result,
                    message: "Search completed successfully"
                });
            } catch (error) {
                app.log.error('Error searching quizzes:', error);
                return reply.status(500).send({
                    success: false,
                    error: 'Failed to search quizzes',
                    message: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
    });

    app.log.info('Quiz routes registered');
    return app;
}
