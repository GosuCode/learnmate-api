import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { subjectController } from '@/controllers/subjectController';
import { CreateSubjectInput, UpdateSubjectInput } from '@/models/subjectModel';

export default async function subjectRoutes(app: FastifyInstance) {

    // Create a subject
    app.post(
        '/',
        async (request: FastifyRequest<{ Body: CreateSubjectInput }>, reply: FastifyReply) => {
            return subjectController.create(request, reply);
        }
    );

    // Get all subjects
    app.get(
        '/',
        async (request: FastifyRequest, reply: FastifyReply) => {
            return subjectController.getAll(request, reply);
        }
    );

    // Get single subject by ID
    app.get(
        '/:id',
        async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
            return subjectController.getById(request, reply);
        }
    );

    // Update subject
    app.put(
        '/:id',
        async (request: FastifyRequest<{ Params: { id: string }, Body: UpdateSubjectInput }>, reply: FastifyReply) => {
            return subjectController.update(request, reply);
        }
    );

    // Delete subject
    app.delete(
        '/:id',
        async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
            return subjectController.delete(request, reply);
        }
    );

    app.log.info('Subject routes registered');
    return app;
}
