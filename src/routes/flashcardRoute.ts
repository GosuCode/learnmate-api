import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { flashcardService } from '@/services/flashcardService';
import { sm2Service } from '@/services/sm2Service';
import { prisma } from '@/lib/prisma';
import { authenticate } from '@/middleware/auth';

// Request/Response schemas
const FlashcardRequestSchema = z.object({
    text: z.string().min(50, 'Text must be at least 50 characters long'),
    total_questions: z.number().int().min(1).max(10).default(3)
});

const MCQRequestSchema = z.object({
    text: z.string().min(50, 'Text must be at least 50 characters long'),
    total_questions: z.number().int().min(1).max(10).default(3)
});

const ReviewRequestSchema = z.object({
    qualityScore: z.number().int().min(0).max(5, 'Quality score must be between 0 and 5')
});

const CreateFlashcardSchema = z.object({
    front: z.string().min(1, 'Front text is required'),
    back: z.string().min(1, 'Back text is required')
});

type FlashcardRequest = z.infer<typeof FlashcardRequestSchema>;
type MCQRequest = z.infer<typeof MCQRequestSchema>;
type ReviewRequest = z.infer<typeof ReviewRequestSchema>;
type CreateFlashcard = z.infer<typeof CreateFlashcardSchema>;

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
    fastify.post('/flashcards', { preHandler: authenticate }, async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const { text, total_questions, userId } = request.body as FlashcardRequest & { userId?: string };

            if (!text || text.trim().length < 50) {
                return reply.status(400).send({
                    error: 'Text must be at least 50 characters long'
                });
            }

            const authenticatedUserId = userId || (request as any).user?.userId;
            if (!authenticatedUserId) {
                return reply.status(401).send({
                    error: 'Authentication required'
                });
            }

            const result = await flashcardService.generateFlashcards({
                text: text.trim(),
                total_questions
            });

            // Save generated flashcards to database
            const savedFlashcards = [];
            for (const flashcard of result.flashcards) {
                try {
                    const savedFlashcard = await sm2Service.createFlashcard({
                        front: flashcard.question,
                        back: flashcard.answer,
                        userId: authenticatedUserId
                    });
                    savedFlashcards.push(savedFlashcard);
                } catch (saveError) {
                    fastify.log.error('Error saving flashcard:', saveError);
                    // Continue with other flashcards even if one fails
                }
            }

            return reply.send({
                ...result,
                saved_flashcards: savedFlashcards,
                total_saved: savedFlashcards.length,
                message: `Generated ${result.total_flashcards} flashcards and saved ${savedFlashcards.length} to database`
            });
        } catch (error) {
            fastify.log.error('Error generating flashcards:', error);
            return reply.status(500).send({
                error: 'Failed to generate flashcards',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });

    // Generate and save flashcards (recommended workflow)
    fastify.post('/generate-and-save', async (request: FastifyRequest<{ Body: FlashcardRequest }>, reply: FastifyReply) => {
        try {
            const { text, total_questions } = request.body;

            if (!text || text.trim().length < 50) {
                return reply.status(400).send({
                    error: 'Text must be at least 50 characters long'
                });
            }

            // Get user ID from auth
            const authenticatedUserId = (request as any).user?.userId;
            if (!authenticatedUserId) {
                return reply.status(401).send({
                    error: 'Authentication required'
                });
            }

            const result = await flashcardService.generateFlashcards({
                text: text.trim(),
                total_questions
            });

            // Save generated flashcards to database
            const savedFlashcards = [];
            for (const flashcard of result.flashcards) {
                try {
                    const savedFlashcard = await sm2Service.createFlashcard({
                        front: flashcard.question,
                        back: flashcard.answer,
                        userId: authenticatedUserId
                    });
                    savedFlashcards.push(savedFlashcard);
                } catch (saveError) {
                    fastify.log.error('Error saving flashcard:', saveError);
                    // Continue with other flashcards even if one fails
                }
            }

            return reply.send({
                success: true,
                data: {
                    generated_flashcards: result.flashcards,
                    saved_flashcards: savedFlashcards,
                    total_generated: result.total_flashcards,
                    total_saved: savedFlashcards.length,
                    processing_method: result.processing_method
                },
                message: `Generated ${result.total_flashcards} flashcards and saved ${savedFlashcards.length} to database`
            });
        } catch (error) {
            fastify.log.error('Error generating and saving flashcards:', error);
            return reply.status(500).send({
                success: false,
                data: null,
                error: 'Failed to generate and save flashcards',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });

    // Generate MCQs
    fastify.post('/mcqs', async (request: FastifyRequest<{ Body: MCQRequest }>, reply: FastifyReply) => {
        try {
            const { text, total_questions } = request.body;

            if (!text || text.trim().length < 50) {
                return reply.status(400).send({
                    error: 'Text must be at least 50 characters long'
                });
            }

            const result = await flashcardService.generateMCQs({
                text: text.trim(),
                total_questions
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

    // Create a new flashcard
    fastify.post('/create', { preHandler: authenticate }, async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const { front, back } = request.body as CreateFlashcard;

            // Get user ID from auth (assuming you have auth middleware)
            const userId = (request as any).user?.userId;
            if (!userId) {
                return reply.status(401).send({
                    error: 'Authentication required'
                });
            }

            const flashcard = await sm2Service.createFlashcard({
                front,
                back,
                userId
            });

            return reply.send({
                success: true,
                data: flashcard,
                error: null
            });
        } catch (error) {
            fastify.log.error('Error creating flashcard:', error);
            return reply.status(500).send({
                success: false,
                data: null,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });

    // Review a flashcard (SM2 algorithm)
    fastify.post('/review/:id', { preHandler: authenticate }, async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const { id } = request.params as { id: string };
            const { qualityScore } = request.body as ReviewRequest;

            // Get user ID from auth
            const userId = (request as any).user?.userId;
            if (!userId) {
                return reply.status(401).send({
                    success: false,
                    data: null,
                    error: 'Authentication required'
                });
            }

            const updatedFlashcard = await sm2Service.reviewFlashcard(id, qualityScore);

            return reply.send({
                success: true,
                data: updatedFlashcard,
                error: null
            });
        } catch (error) {
            fastify.log.error('Error reviewing flashcard:', error);
            return reply.status(500).send({
                success: false,
                data: null,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });

    // Get flashcards due for review
    fastify.get('/due', { preHandler: authenticate }, async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            // Get user ID from auth
            const userId = (request as any).user?.userId;
            if (!userId) {
                return reply.status(401).send({
                    success: false,
                    data: null,
                    error: 'Authentication required'
                });
            }

            const dueFlashcards = await sm2Service.getDueFlashcards(userId);

            return reply.send({
                success: true,
                data: dueFlashcards,
                error: null
            });
        } catch (error) {
            fastify.log.error('Error getting due flashcards:', error);
            return reply.status(500).send({
                success: false,
                data: null,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });

    // Get all flashcards for a user
    fastify.get('/user-flashcards', { preHandler: authenticate }, async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            // Get user ID from auth
            const userId = (request as any).user?.userId;
            if (!userId) {
                return reply.status(401).send({
                    success: false,
                    data: null,
                    error: 'Authentication required'
                });
            }

            const flashcards = await prisma.flashcard.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' }
            });

            return reply.send({
                success: true,
                data: flashcards,
                total: flashcards.length
            });
        } catch (error) {
            fastify.log.error('Error fetching user flashcards:', error);
            return reply.status(500).send({
                success: false,
                data: null,
                error: 'Failed to fetch flashcards',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });

    // Get flashcard statistics
    fastify.get('/stats', { preHandler: authenticate }, async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            // Get user ID from auth
            const userId = (request as any).user?.userId;
            if (!userId) {
                return reply.status(401).send({
                    success: false,
                    data: null,
                    error: 'Authentication required'
                });
            }

            const stats = await sm2Service.getFlashcardStats(userId);

            return reply.send({
                success: true,
                data: stats,
                error: null
            });
        } catch (error) {
            fastify.log.error('Error getting flashcard stats:', error);
            return reply.status(500).send({
                success: false,
                data: null,
                error: 'Failed to get flashcard stats',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });

    fastify.delete('/:id', { preHandler: authenticate }, async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const { id } = request.params as { id: string };
            const userId = (request as any).user?.userId;

            if (!userId) {
                return reply.status(401).send({
                    success: false,
                    error: 'Authentication required'
                });
            }

            const flashcard = await prisma.flashcard.findFirst({
                where: { id, userId }
            });

            if (!flashcard) {
                return reply.status(404).send({
                    success: false,
                    error: 'Flashcard not found or access denied'
                });
            }

            await prisma.flashcard.delete({
                where: { id }
            });

            return reply.send({
                success: true,
                message: 'Flashcard deleted successfully'
            });
        } catch (error) {
            fastify.log.error('Error deleting flashcard:', error);
            return reply.status(500).send({
                success: false,
                error: 'Failed to delete flashcard',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });
}
