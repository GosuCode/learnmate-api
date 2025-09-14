import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { GoogleAuthService } from '@/services/googleAuthService';
import { ApiResponse } from '@/types/api';

const googleAuthService = new GoogleAuthService();

export default async function authRoutes(app: FastifyInstance) {
    app.get('/google/login', {
        schema: {
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        data: {
                            type: 'object',
                            properties: {
                                authUrl: { type: 'string' },
                            },
                        },
                        message: { type: 'string' },
                    },
                },
                500: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        error: { type: 'string' },
                        message: { type: 'string' },
                    },
                },
            },
        },
        handler: async (_request: FastifyRequest, reply: FastifyReply) => {
            try {
                const authUrl = await googleAuthService.getGoogleAuthUrl();

                const response: ApiResponse<{ authUrl: string }> = {
                    success: true,
                    data: { authUrl },
                    message: 'Google OAuth URL generated successfully',
                };

                return reply.send(response);
            } catch (error) {
                return reply.status(500).send({
                    success: false,
                    error: 'Internal server error',
                    message: 'Failed to generate Google OAuth URL',
                });
            }
        },
    });

    app.get('/google/callback', {
        schema: {
            querystring: {
                type: 'object',
                properties: {
                    code: { type: 'string' },
                },
                required: ['code'],
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        data: {
                            type: 'object',
                            properties: {
                                user: {
                                    type: 'object',
                                    properties: {
                                        id: { type: 'string' },
                                        email: { type: 'string' },
                                        name: { type: 'string' },
                                        avatar: { type: 'string' },
                                        authProvider: { type: 'string' },
                                        emailVerified: { type: 'boolean' },
                                        createdAt: { type: 'string' },
                                        updatedAt: { type: 'string' },
                                    },
                                },
                                token: { type: 'string' },
                            },
                        },
                        message: { type: 'string' },
                    },
                },
                400: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        error: { type: 'string' },
                        message: { type: 'string' },
                    },
                },
                500: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        error: { type: 'string' },
                        message: { type: 'string' },
                    },
                },
            },
        },
        handler: async (request: FastifyRequest<{ Querystring: { code: string } }>, reply: FastifyReply) => {
            try {
                const { code } = request.query;

                if (!code) {
                    return reply.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/redirect?error=no_code`);
                }

                const authResult = await googleAuthService.handleGoogleCallback(code);

                const params = new URLSearchParams({
                    success: 'true',
                    user: JSON.stringify(authResult.user),
                    token: authResult.token,
                });

                return reply.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/redirect?${params.toString()}`);
            } catch (error: any) {
                return reply.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/redirect?error=auth_failed&message=${encodeURIComponent(error.message || 'Google authentication failed')}`);
            }
        },
    });

    app.log.info('Auth routes registered');

    return app;
} 