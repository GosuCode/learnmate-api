import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ContentService } from '@/services/contentService';
import { CreateContentRequest } from '@/types/content';
import { AIServiceRequest } from '@/types/ai';
import { authenticate } from '@/middleware/auth';

interface AuthenticatedRequest extends FastifyRequest {
    user?: {
        userId: string;
        email: string;
        name: string;
    };
}

export default async function contentRoutes(fastify: FastifyInstance) {
    // Apply authentication middleware to all content routes
    fastify.addHook('preHandler', authenticate);

    // Generate content using Gemini AI
    fastify.post('/generate', async (request: AuthenticatedRequest, reply: FastifyReply) => {
        try {
            const { content, type } = request.body as AIServiceRequest;

            if (!content || !type) {
                return reply.status(400).send({
                    success: false,
                    error: 'Content and type are required'
                });
            }

            const result = await ContentService.generateContentWithAI(content, type);

            if (!result.success) {
                return reply.status(500).send({
                    success: false,
                    error: result.error
                });
            }

            return reply.send({
                success: true,
                data: result.data
            });
        } catch (error) {
            console.error('Error generating content:', error);
            return reply.status(500).send({
                success: false,
                error: 'Failed to generate content'
            });
        }
    });

    // Create content manually
    fastify.post('/', async (request: AuthenticatedRequest, reply: FastifyReply) => {
        try {
            const contentData = request.body as CreateContentRequest;
            const userId = request.user!.userId;

            if (!contentData.title || !contentData.content || !contentData.type) {
                return reply.status(400).send({
                    success: false,
                    error: 'Title, content, and type are required'
                });
            }

            const content = await ContentService.createContent(userId, contentData);

            return reply.status(201).send({
                success: true,
                data: content
            });
        } catch (error) {
            console.error('Error creating content:', error);
            return reply.status(500).send({
                success: false,
                error: 'Failed to create content'
            });
        }
    });

    // Get all content for the authenticated user
    fastify.get('/', async (request: AuthenticatedRequest, reply: FastifyReply) => {
        try {
            const userId = request.user!.userId;
            const content = await ContentService.getUserContent(userId);

            return reply.send({
                success: true,
                data: content
            });
        } catch (error) {
            console.error('Error fetching user content:', error);
            return reply.status(500).send({
                success: false,
                error: 'Failed to fetch content'
            });
        }
    });

    // Get content by ID
    fastify.get('/:id', async (request: AuthenticatedRequest, reply: FastifyReply) => {
        try {
            const { id } = request.params as { id: string };
            const content = await ContentService.getContentById(id);

            if (!content) {
                return reply.status(404).send({
                    success: false,
                    error: 'Content not found'
                });
            }

            // Check if user owns the content
            if (content.userId !== request.user!.userId) {
                return reply.status(403).send({
                    success: false,
                    error: 'Access denied'
                });
            }

            return reply.send({
                success: true,
                data: content
            });
        } catch (error) {
            console.error('Error fetching content:', error);
            return reply.status(500).send({
                success: false,
                error: 'Failed to fetch content'
            });
        }
    });

    // Update content
    fastify.put('/:id', async (request: AuthenticatedRequest, reply: FastifyReply) => {
        try {
            const { id } = request.params as { id: string };
            const updates = request.body as Partial<CreateContentRequest>;
            const userId = request.user!.userId;

            const content = await ContentService.updateContent(id, userId, updates);

            return reply.send({
                success: true,
                data: content
            });
        } catch (error) {
            console.error('Error updating content:', error);
            return reply.status(500).send({
                success: false,
                error: 'Failed to update content'
            });
        }
    });

    // Delete content
    fastify.delete('/:id', async (request: AuthenticatedRequest, reply: FastifyReply) => {
        try {
            const { id } = request.params as { id: string };
            const userId = request.user!.userId;

            await ContentService.deleteContent(id, userId);

            return reply.send({
                success: true,
                message: 'Content deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting content:', error);
            return reply.status(500).send({
                success: false,
                error: 'Failed to delete content'
            });
        }
    });

    // Generate summary for existing content
    fastify.post('/:id/summary', async (request: AuthenticatedRequest, reply: FastifyReply) => {
        try {
            const { id } = request.params as { id: string };
            const userId = request.user!.userId;

            // Verify user owns the content
            const content = await ContentService.getContentById(id);
            if (!content || content.userId !== userId) {
                return reply.status(404).send({
                    success: false,
                    error: 'Content not found'
                });
            }

            const summary = await ContentService.generateSummary(id);

            return reply.send({
                success: true,
                data: summary
            });
        } catch (error) {
            console.error('Error generating summary:', error);
            return reply.status(500).send({
                success: false,
                error: 'Failed to generate summary'
            });
        }
    });

    // Generate quiz for existing content
    fastify.post('/:id/quiz', async (request: AuthenticatedRequest, reply: FastifyReply) => {
        try {
            const { id } = request.params as { id: string };
            const userId = request.user!.userId;

            // Verify user owns the content
            const content = await ContentService.getContentById(id);
            if (!content || content.userId !== userId) {
                return reply.status(404).send({
                    success: false,
                    error: 'Content not found'
                });
            }

            const quiz = await ContentService.generateQuiz(id);

            return reply.send({
                success: true,
                data: quiz
            });
        } catch (error) {
            console.error('Error generating quiz:', error);
            return reply.status(500).send({
                success: false,
                error: 'Failed to generate quiz'
            });
        }
    });

    // Categorize existing content
    fastify.post('/:id/categorize', async (request: AuthenticatedRequest, reply: FastifyReply) => {
        try {
            const { id } = request.params as { id: string };
            const userId = request.user!.userId;

            // Verify user owns the content
            const content = await ContentService.getContentById(id);
            if (!content || content.userId !== userId) {
                return reply.status(404).send({
                    success: false,
                    error: 'Content not found'
                });
            }

            const categories = await ContentService.categorizeContent(id);

            return reply.send({
                success: true,
                data: categories
            });
        } catch (error) {
            console.error('Error categorizing content:', error);
            return reply.status(500).send({
                success: false,
                error: 'Failed to categorize content'
            });
        }
    });
} 