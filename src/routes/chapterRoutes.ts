import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { chapterController } from '@/controllers/chapterController';
import { CreateChapterInput, UpdateChapterInput } from '@/models/chapterModel';

export default async function chapterRoutes(app: FastifyInstance) {
    app.post('/', async (request: FastifyRequest<{ Body: CreateChapterInput }>, reply: FastifyReply) => {
        return chapterController.createChapter(request, reply);
    });

    app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
        return chapterController.getAllChapters(request, reply);
    });

    app.get('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        return chapterController.getChapterById(request, reply);
    });

    app.put('/:id', async (request: FastifyRequest<{ Params: { id: string }, Body: UpdateChapterInput }>, reply: FastifyReply) => {
        return chapterController.updateChapter(request, reply);
    });

    app.delete('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        return chapterController.deleteChapter(request, reply);
    });

    app.log.info('Chapter routes registered');
    return app;
}
