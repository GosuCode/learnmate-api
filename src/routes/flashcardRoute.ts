import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { flashcardService } from '@/services/flashcardService';

// Request/Response schemas
const FlashcardRequestSchema = z.object({
    text: z.string().min(50, 'Text must be at least 50 characters long'),
    questions_per_chunk: z.number().int().min(1).max(10).default(3)
});

const MCQRequestSchema = z.object({
    text: z.string().min(50, 'Text must be at least 50 characters long'),
    questions_per_chunk: z.number().int().min(1).max(10).default(3)
});

type FlashcardRequest = z.infer<typeof FlashcardRequestSchema>;
type MCQRequest = z.infer<typeof MCQRequestSchema>;

export default async function flashcardRoutes(fastify: FastifyInstance) {
    // Health check
    fastify.get('/health', async () => {
        const fastapiServiceHealthy = await flashcardService.checkFastAPIServiceHealth();
        const serviceInfo = flashcardService.getServiceInfo();

        return {
            status: 'healthy',
            service: 'flashcards-mcq',
            flashcard_generator_ready: true,
            mcq_generator_ready: true,
            fastapi_service_healthy: fastapiServiceHealthy,
            service_info: serviceInfo
        };
    });

    // Get supported formats
    fastify.get('/supported-formats', async () => {
        const serviceInfo = flashcardService.getServiceInfo();

        return {
            input_formats: ['plain_text', 'long_text'],
            max_text_length: 'No limit (handled by chunking)',
            chunk_size: '400 words',
            chunk_overlap: '50 words',
            questions_per_chunk_range: [1, 10],
            default_questions_per_chunk: 3,
            features: serviceInfo.features,
            fastapi_service_enabled: serviceInfo.use_fastapi_service,
            fastapi_service_url: serviceInfo.fastapi_service_url
        };
    });

    // Generate flashcards
    fastify.post('/flashcards', async (request: FastifyRequest<{ Body: FlashcardRequest }>, reply: FastifyReply) => {
        try {
            const { text, questions_per_chunk } = request.body;

            if (!text || text.trim().length < 50) {
                return reply.status(400).send({
                    error: 'Text must be at least 50 characters long'
                });
            }

            const result = await flashcardService.generateFlashcards({
                text: text.trim(),
                total_questions: questions_per_chunk
            });

            return reply.send(result);
        } catch (error) {
            fastify.log.error('Error generating flashcards:', error);
            return reply.status(500).send({
                error: 'Failed to generate flashcards',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });

    // Generate MCQs
    fastify.post('/mcqs', async (request: FastifyRequest<{ Body: MCQRequest }>, reply: FastifyReply) => {
        try {
            const { text, questions_per_chunk } = request.body;

            if (!text || text.trim().length < 50) {
                return reply.status(400).send({
                    error: 'Text must be at least 50 characters long'
                });
            }

            const result = await flashcardService.generateMCQs({
                text: text.trim(),
                total_questions: questions_per_chunk
            });

            return reply.send(result);
        } catch (error) {
            fastify.log.error('Error generating MCQs:', error);
            return reply.status(500).send({
                error: 'Failed to generate MCQs',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });
}
