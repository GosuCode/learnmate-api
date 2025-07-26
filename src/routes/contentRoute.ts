import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { contentController } from '@/controllers/contentController';
import { CreateContentInput, UpdateContentInput } from '@/models/contentModel';

export default async function contentRoutes(app: FastifyInstance) {

    // Create content
    app.post(
        '/',
        async (request: FastifyRequest<{ Body: CreateContentInput }>, reply: FastifyReply) => {
            return contentController.create(request, reply);
        }
    );

    // Get all contents
    app.get(
        '/',
        async (request: FastifyRequest, reply: FastifyReply) => {
            return contentController.getAll(request, reply);
        }
    );

    // Get single content by ID
    app.get(
        '/:id',
        async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
            return contentController.getById(request, reply);
        }
    );

    // Update content
    app.put(
        '/:id',
        async (request: FastifyRequest<{ Params: { id: string }; Body: UpdateContentInput }>, reply: FastifyReply) => {
            return contentController.update(request, reply);
        }
    );

    // Delete content
    app.delete(
        '/:id',
        async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
            return contentController.delete(request, reply);
        }
    );

    app.log.info('Content routes registered');
    return app;
}
