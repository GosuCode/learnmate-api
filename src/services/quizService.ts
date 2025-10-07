import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateQuizData {
    title: string;
    originalText: string;
    questions: any;
    totalQuestions: number;
    processingMethod: string;
    userId: string;
    groupId?: string;
}

export interface UpdateQuizData {
    title?: string;
    questions?: any;
}

export class QuizService {
    async createQuiz(data: CreateQuizData) {
        return await prisma.quiz.create({
            data,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                group: {
                    select: {
                        id: true,
                        name: true,
                        color: true,
                    },
                },
            },
        });
    }

    async getQuizById(id: string, userId: string) {
        return await prisma.quiz.findFirst({
            where: {
                id,
                userId,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                group: {
                    select: {
                        id: true,
                        name: true,
                        color: true,
                    },
                },
            },
        });
    }

    async getUserQuizzes(userId: string, page: number = 1, limit: number = 10, groupId?: string) {
        const skip = (page - 1) * limit;

        const whereClause: any = { userId };
        if (groupId) {
            whereClause.groupId = groupId;
        }

        const [quizzes, total] = await Promise.all([
            prisma.quiz.findMany({
                where: whereClause,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                    group: {
                        select: {
                            id: true,
                            name: true,
                            color: true,
                        },
                    },
                },
            }),
            prisma.quiz.count({
                where: whereClause,
            }),
        ]);

        return {
            quizzes,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async updateQuiz(id: string, userId: string, data: UpdateQuizData) {
        return await prisma.quiz.updateMany({
            where: {
                id,
                userId,
            },
            data,
        });
    }

    async deleteQuiz(id: string, userId: string) {
        return await prisma.quiz.deleteMany({
            where: {
                id,
                userId,
            },
        });
    }

    async searchQuizzes(userId: string, query: string, page: number = 1, limit: number = 10, groupId?: string) {
        const skip = (page - 1) * limit;

        const whereClause: any = {
            userId,
            OR: [
                { title: { contains: query, mode: 'insensitive' } },
                { originalText: { contains: query, mode: 'insensitive' } },
            ],
        };
        if (groupId) {
            whereClause.groupId = groupId;
        }

        const [quizzes, total] = await Promise.all([
            prisma.quiz.findMany({
                where: whereClause,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                    group: {
                        select: {
                            id: true,
                            name: true,
                            color: true,
                        },
                    },
                },
            }),
            prisma.quiz.count({
                where: whereClause,
            }),
        ]);

        return {
            quizzes,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
}

export const quizService = new QuizService();
