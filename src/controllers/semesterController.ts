import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateSemesterInput } from '@/models/semesterModel';
import { ApiResponse } from '@/types/api';
import { SemesterService } from '@/services/semesterService';
import { CreateSemesterRequest } from '@/types/semester';

const semesterService = new SemesterService()

export const semesterController = {
  async create(
    req: FastifyRequest<{ Body: CreateSemesterRequest }>,
    reply: FastifyReply
  ) {
    try {
      const { name, code } = req.body;

      if (!name || !code) {
        return reply.status(400).send({
          success: false,
          error: "Validation error",
          message: "name and code are required"
        })
      }
      const semester = await semesterService.createSemester({ name, code });

      const response: ApiResponse = {
        success: true,
        data: semester,
        message: 'Semester created successfully',
      };

      return reply.status(201).send(response);
    } catch (error: any) {
      if (error.message.includes("Unique constraint")) {
        return reply.status(409).send({
          success: false,
          error: "Conflict",
          message: "Semester with this code already exists",
        });
      }
      return reply.status(500).send({
        success: false,
        error: 'Internal server error',
        message: 'Failed to create semester',
        details: error,
      });
    }
  },

  async getAll(_req: FastifyRequest, reply: FastifyReply) {
    try {
      const semesters = await semesterService.getAllSemesters();

      const response: ApiResponse = {
        success: true,
        data: semesters,
        message: 'Semesters retrieved successfully',
      };

      return reply.send(response);
    } catch (error) {
      return reply.status(500).send({
        success: false,
        error: 'Internal server error',
        message: 'Failed to fetch semesters',
        details: error,
      });
    }
  },

  async getById(
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const { id } = req.params;
      const semester = await semesterService.getSemesterById(id);

      if (!semester) {
        return reply.status(404).send({
          success: false,
          error: 'Not found',
          message: 'Semester not found',
        });
      }

      const response: ApiResponse = {
        success: true,
        data: semester,
        message: 'Semester retrieved successfully',
      };

      return reply.send(response);
    } catch (error) {
      return reply.status(500).send({
        success: false,
        error: 'Internal server error',
        message: 'Failed to fetch semester',
        details: error,
      });
    }
  },

  async update(
    req: FastifyRequest<{ Params: { id: string }; Body: Partial<CreateSemesterInput> }>,
    reply: FastifyReply
  ) {
    try {
      const { id } = req.params;
      const updates = req.body;
      const updatedSemester = await semesterService.updateSemester(id, updates);

      const response: ApiResponse = {
        success: true,
        data: updatedSemester,
        message: 'Semester updated successfully',
      };

      return reply.send(response);
    } catch (error) {
      return reply.status(500).send({
        success: false,
        error: 'Internal server error',
        message: 'Failed to update semester',
        details: error,
      });
    }
  },

  async delete(
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const { id } = req.params
      const deleted = await semesterService.deleteSemester(id);

      if (!deleted) {
        return reply.status(404).send({
          success: false,
          error: "Not found",
          message: "Semester not found",
        });
      }
      return reply.status(204).send({
        success: true,
        message: "Semester deleted successfully",
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        error: 'Internal server error',
        message: 'Failed to delete semester',
        details: error,
      });
    }
  },
};
