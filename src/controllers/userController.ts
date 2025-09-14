import { FastifyRequest, FastifyReply } from "fastify";
import { CreateUserRequest, LoginRequest, AuthResponse } from "../types/user";
import { ApiResponse } from "../types/api";
import { UserService } from "../services/userService";

const userService = new UserService();

export const userController = {
  async register(request: FastifyRequest<{ Body: CreateUserRequest }>, reply: FastifyReply) {
    try {
      const { email, name, password } = request.body;

      if (!email || !name || !password) {
        return reply.status(400).send({
          success: false,
          error: 'Validation error',
          message: 'Email, name, and password are required',
        });
      }

      if (password.length < 6) {
        return reply.status(400).send({
          success: false,
          error: 'Validation error',
          message: 'Password must be at least 6 characters long',
        });
      }

      const authResponse = await userService.register({ email, name, password });

      const response: ApiResponse<AuthResponse> = {
        success: true,
        data: authResponse,
        message: 'User registered successfully',
      };

      return reply.status(201).send(response);
    } catch (error: any) {
      if (error.message === 'User already exists with this email') {
        return reply.status(409).send({
          success: false,
          error: 'Conflict',
          message: error.message,
        });
      }

      return reply.status(500).send({
        success: false,
        error: 'Internal server error',
        message: 'Failed to register user',
      });
    }
  },

  async login(request: FastifyRequest<{ Body: LoginRequest }>, reply: FastifyReply) {
    try {
      const { email, password } = request.body;

      if (!email || !password) {
        return reply.status(400).send({
          success: false,
          error: 'Validation error',
          message: 'Email and password are required',
        });
      }

      const authResponse = await userService.login({ email, password });

      const response: ApiResponse<AuthResponse> = {
        success: true,
        data: authResponse,
        message: 'Login successful',
      };

      return reply.send(response);
    } catch (error: any) {
      if (error.message === 'Invalid email or password') {
        return reply.status(401).send({
          success: false,
          error: 'Unauthorized',
          message: error.message,
        });
      }

      return reply.status(500).send({
        success: false,
        error: 'Internal server error',
        message: 'Failed to login',
      });
    }
  },

  async getProfile(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = (request as any).user;

      if (!user) {
        return reply.status(401).send({
          success: false,
          error: 'Unauthorized',
          message: 'User not authenticated',
        });
      }

      const userData = await userService.getUserById(user.userId);

      if (!userData) {
        return reply.status(404).send({
          success: false,
          error: 'Not found',
          message: 'User not found',
        });
      }

      const response: ApiResponse = {
        success: true,
        data: {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          createdAt: userData.createdAt,
          updatedAt: userData.updatedAt,
        },
        message: 'Profile retrieved successfully',
      };

      return reply.send(response);
    } catch (error) {
      return reply.status(500).send({
        success: false,
        error: 'Internal server error',
        message: 'Failed to get profile',
      });
    }
  },

  async getAllUsers(_request: FastifyRequest, reply: FastifyReply) {
    try {
      const users = await userService.getAllUsers();

      const response: ApiResponse = {
        success: true,
        data: users,
        message: 'Users retrieved successfully',
      };

      return reply.send(response);
    } catch (error) {
      return reply.status(500).send({
        success: false,
        error: 'Internal server error',
        message: 'Failed to get users',
      });
    }
  },

};
