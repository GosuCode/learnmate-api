import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { courseController } from '@/controllers/courseController';
import { CreateCourseInput, UpdateCourseInput } from '@/models/courseModel';

export default async function courseRoutes(app: FastifyInstance) {
  app.post('/', async (request: FastifyRequest<{ Body: CreateCourseInput }>, reply: FastifyReply) => {
    return courseController.createCourse(request, reply);
  });

  app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    return courseController.getAllCourses(request, reply);
  });

  app.get('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    return courseController.getCourseById(request, reply);
  });

  app.put('/:id', async (request: FastifyRequest<{ Params: { id: string }, Body: UpdateCourseInput }>, reply: FastifyReply) => {
    return courseController.updateCourse(request, reply);
  });

  app.delete('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    return courseController.deleteCourse(request, reply);
  });

  app.log.info('Course routes registered');
  return app;
}
