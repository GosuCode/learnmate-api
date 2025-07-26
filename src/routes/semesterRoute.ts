import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { semesterController } from '@/controllers/semesterController';
import { CreateSemesterInput, UpdateSemesterInput } from '@/models/semesterModel';

export default async function semesterRoutes(app: FastifyInstance) {

  // Create a semester
  app.post(
    '/',
    async (request: FastifyRequest<{ Body: CreateSemesterInput }>, reply: FastifyReply) => {
      return semesterController.create(request, reply);
    }
  );

  // Get all semesters
  app.get(
    '/',
    async (request: FastifyRequest, reply: FastifyReply) => {
      return semesterController.getAll(request, reply);
    }
  );

  // Get single semester by ID
  app.get(
    '/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      return semesterController.getById(request, reply);
    }
  );

  // Update semester
  app.put(
    '/:id',
    async (request: FastifyRequest<{ Params: { id: string }, Body: UpdateSemesterInput }>, reply: FastifyReply) => {
      return semesterController.update(request, reply);
    }
  );

  // Delete semester
  app.delete(
    '/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      return semesterController.delete(request, reply);
    }
  );

  app.log.info('Semester routes registered');
  return app;
}
