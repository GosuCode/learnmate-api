import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { flashcardService } from "@/services/flashcardService";

// Request schema - maintain backward compatibility
const MCQRequestSchema = z.object({
    text: z.string().min(50, 'Text must be at least 50 characters long'),
    num_questions: z.number().int().min(1).max(10).default(5)
});

type MCQRequest = z.infer<typeof MCQRequestSchema>;

export default async function mcqRoutes(app: FastifyInstance) {
    // Generate MCQs using the unified flashcard service
    app.post("/", async (request: FastifyRequest<{ Body: MCQRequest }>, reply: FastifyReply) => {
        try {
            const { text, num_questions } = request.body;

            if (!text || text.trim().length < 50) {
                return reply.status(400).send({
                    error: "Text must be at least 50 characters long"
                });
            }

            // Pass total_questions directly instead of chunking
            const result = await flashcardService.generateMCQs({
                text: text.trim(),
                total_questions: num_questions // New parameter
            });

            // Transform response to match existing API format for backward compatibility
            const transformedMcqs = result.mcqs.slice(0, num_questions).map(mcq => ({
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

    // Health check - now checks the unified service
    app.get("/health", async () => {
        try {
            const fastapiServiceHealthy = await flashcardService.checkFastAPIServiceHealth();
            const serviceInfo = flashcardService.getServiceInfo();

            return {
                status: "healthy",
                service: "Fastify MCQ Service (FastAPI Integration)",
                flashcard_service: "available",
                fastapi_service_healthy: fastapiServiceHealthy,
                service_info: serviceInfo
            };
        } catch (err: any) {
            return {
                status: "degraded",
                flashcard_service: "available",
                python_service: "unavailable",
                fallback_service: "available",
                service: "Fastify MCQ Service (Unified) - Fallback Mode"
            };
        }
    });
}
