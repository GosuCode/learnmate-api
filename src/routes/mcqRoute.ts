import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { mcqService } from "@/services/mcqService";
import { prisma } from "@/lib/prisma";
import { authPreHandler } from "@/middleware/auth";

const MCQRequestSchema = z.object({
    text: z.string().min(50, 'Text must be at least 50 characters long'),
    num_questions: z.number().int().min(1).max(10).default(5)
});

const CreateMCQSchema = z.object({
    question: z.string().min(1, 'Question is required'),
    options: z.array(z.string()).min(2, 'At least 2 options required').max(6, 'Maximum 6 options allowed'),
    correct_answer_index: z.number().int().min(0, 'Invalid correct answer index'),
    explanation: z.string().optional()
});

type MCQRequest = z.infer<typeof MCQRequestSchema>;
type CreateMCQRequest = z.infer<typeof CreateMCQSchema>;

export default async function mcqRoutes(app: FastifyInstance) {
    app.post("/", async (request: FastifyRequest<{ Body: MCQRequest }>, reply: FastifyReply) => {
        try {
            const { text, num_questions } = request.body;

            if (!text || text.trim().length < 50) {
                return reply.status(400).send({
                    error: "Text must be at least 50 characters long"
                });
            }

            const result = await mcqService.generateMCQs({
                text: text.trim(),
                total_questions: num_questions
            });

            const mcqs = result.mcqs || (result as any).questions || [];
            const transformedMcqs = mcqs.slice(0, num_questions).map(mcq => ({
                question: mcq.question,
                options: mcq.options,
                answer: mcq.correct_answer,
                correct_answer_index: mcq.correct_answer_index,
                explanation: mcq.explanation
            }));

            return reply.send({
                mcqs: transformedMcqs,
                total_questions: transformedMcqs.length,
                text_length: result.text_length,
                processing_method: result.processing_method,
                service: "Fastify MCQ Service (FastAPI Integration)"
            });

        } catch (error) {
            app.log.error('Error generating MCQs:', error);
            return reply.status(500).send({
                error: 'Failed to generate MCQs',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });

    // Manual MCQ creation endpoint
    app.post("/create", {
        preHandler: [authPreHandler],
        handler: async (request: FastifyRequest<{ Body: CreateMCQRequest }>, reply: FastifyReply) => {
            try {
                const { question, options, correct_answer_index, explanation } = request.body;
                const user = (request as any).user;

                if (!user?.userId) {
                    return reply.status(401).send({
                        error: "Authentication required"
                    });
                }

                // Validate correct answer index
                if (correct_answer_index < 0 || correct_answer_index >= options.length) {
                    return reply.status(400).send({
                        error: "Invalid correct answer index"
                    });
                }

                // Create the MCQ in the database
                const mcq = await prisma.quiz.create({
                    data: {
                        title: `Manual MCQ - ${question.substring(0, 50)}...`,
                        originalText: question,
                        questions: {
                            question,
                            options,
                            correct_answer_index,
                            explanation: explanation || null
                        },
                        totalQuestions: 1,
                        processingMethod: "manual",
                        userId: user.userId
                    }
                });

                return reply.send({
                    success: true,
                    data: {
                        id: mcq.id,
                        question,
                        options,
                        correct_answer_index,
                        explanation,
                        createdAt: mcq.createdAt
                    }
                });

            } catch (error) {
                app.log.error('Error creating manual MCQ:', error);
                return reply.status(500).send({
                    error: 'Failed to create MCQ',
                    details: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
    });
}
