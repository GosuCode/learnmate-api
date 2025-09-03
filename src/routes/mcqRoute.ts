import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { mcqService } from "@/services/mcqService";

const MCQRequestSchema = z.object({
    text: z.string().min(50, 'Text must be at least 50 characters long'),
    num_questions: z.number().int().min(1).max(10).default(5)
});

type MCQRequest = z.infer<typeof MCQRequestSchema>;

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
}
