import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { flashcardService } from '@/services/flashcardService';
import { sm2Service } from '@/services/sm2Service';
import { prisma } from '@/lib/prisma';
import { authenticate } from '@/middleware/auth';

const FlashcardRequestSchema = z.object({
    text: z.string().min(50, 'Text must be at least 50 characters long'),
    total_questions: z.number().int().min(1).max(10).default(3)
});

const ReviewRequestSchema = z.object({
    qualityScore: z.number().int().min(0).max(5, 'Quality score must be between 0 and 5')
});

const CreateFlashcardSchema = z.object({
    front: z.string().min(1, 'Front text is required'),
    back: z.string().min(1, 'Back text is required'),
    groupId: z.string().optional()
});

const UpdateFlashcardSchema = z.object({
    groupId: z.string().optional()
});

type FlashcardRequest = z.infer<typeof FlashcardRequestSchema>;
type ReviewRequest = z.infer<typeof ReviewRequestSchema>;
type CreateFlashcard = z.infer<typeof CreateFlashcardSchema>;
type UpdateFlashcard = z.infer<typeof UpdateFlashcardSchema>;

export default async function flashcardRoutes(fastify: FastifyInstance) {

    fastify.post('/', { preHandler: authenticate }, async (request: FastifyRequest, reply: FastifyReply) => {
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

    fastify.post('/create', { preHandler: authenticate }, async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const { front, back, groupId } = request.body as CreateFlashcard;

            const userId = (request as any).user?.userId;
            if (!userId) {
                return reply.status(401).send({
                    error: 'Authentication required'
                });
            }

            // Validate groupId if provided
            if (groupId) {
                const group = await prisma.group.findFirst({
                    where: { id: groupId, userId }
                });
                if (!group) {
                    return reply.status(400).send({
                        success: false,
                        error: 'Group not found or access denied'
                    });
                }
            }

            const flashcard = await sm2Service.createFlashcard({
                front,
                back,
                userId,
                groupId
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

    fastify.post('/review/:id', { preHandler: authenticate }, async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const { id } = request.params as { id: string };
            const { qualityScore } = request.body as ReviewRequest;

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

    fastify.get('/due', { preHandler: authenticate }, async (request: FastifyRequest, reply: FastifyReply) => {
        try {
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

    fastify.get('/user-flashcards', { preHandler: authenticate }, async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const userId = (request as any).user?.userId;
            if (!userId) {
                return reply.status(401).send({
                    success: false,
                    data: null,
                    error: 'Authentication required'
                });
            }

            const { groupId } = request.query as { groupId?: string };

            const whereClause: any = { userId };
            if (groupId) {
                whereClause.groupId = groupId;
            }

            const flashcards = await prisma.flashcard.findMany({
                where: whereClause,
                orderBy: { createdAt: 'desc' },
                include: {
                    group: {
                        select: {
                            id: true,
                            name: true,
                            color: true
                        }
                    }
                }
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

    fastify.get('/stats', { preHandler: authenticate }, async (request: FastifyRequest, reply: FastifyReply) => {
        try {
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

    // Update flashcard group assignment
    fastify.put('/:id', { preHandler: authenticate }, async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const { id } = request.params as { id: string };
            const { groupId } = request.body as UpdateFlashcard;
            const userId = (request as any).user?.userId;

            if (!userId) {
                return reply.status(401).send({
                    success: false,
                    error: 'Authentication required'
                });
            }

            // Verify flashcard belongs to user
            const flashcard = await prisma.flashcard.findFirst({
                where: { id, userId }
            });

            if (!flashcard) {
                return reply.status(404).send({
                    success: false,
                    error: 'Flashcard not found or access denied'
                });
            }

            // Update the flashcard
            const updatedFlashcard = await prisma.flashcard.update({
                where: { id },
                data: { groupId: groupId || null },
                include: {
                    group: true
                }
            });

            return reply.send({
                success: true,
                data: updatedFlashcard,
                message: 'Flashcard updated successfully'
            });
        } catch (error) {
            fastify.log.error('Error updating flashcard:', error);
            return reply.status(500).send({
                success: false,
                error: 'Failed to update flashcard'
            });
        }
    });
}
