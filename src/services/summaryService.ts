import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateSummaryData {
    title: string;
    originalText: string;
    summary: string;
    wordCount: number;
    processingMethod: string;
    userId: string;
}

export interface UpdateSummaryData {
    title?: string;
    summary?: string;
}

export class SummaryService {
    async createSummary(data: CreateSummaryData) {
        return await prisma.summary.create({
            data,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
    }

    async getSummaryById(id: string, userId: string) {
        return await prisma.summary.findFirst({
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
            },
        });
    }

    async getUserSummaries(userId: string, page: number = 1, limit: number = 10) {
        const skip = (page - 1) * limit;

        const [summaries, total] = await Promise.all([
            prisma.summary.findMany({
                where: { userId },
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
                },
            }),
            prisma.summary.count({
                where: { userId },
            }),
        ]);

        return {
            summaries,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async updateSummary(id: string, userId: string, data: UpdateSummaryData) {
        return await prisma.summary.updateMany({
            where: {
                id,
                userId,
            },
            data,
        });
    }

    async deleteSummary(id: string, userId: string) {
        return await prisma.summary.deleteMany({
            where: {
                id,
                userId,
            },
        });
    }

    async searchSummaries(userId: string, query: string, page: number = 1, limit: number = 10) {
        const skip = (page - 1) * limit;

        const [summaries, total] = await Promise.all([
            prisma.summary.findMany({
                where: {
                    userId,
                    OR: [
                        { title: { contains: query, mode: 'insensitive' } },
                        { summary: { contains: query, mode: 'insensitive' } },
                        { originalText: { contains: query, mode: 'insensitive' } },
                    ],
                },
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
                },
            }),
            prisma.summary.count({
                where: {
                    userId,
                    OR: [
                        { title: { contains: query, mode: 'insensitive' } },
                        { summary: { contains: query, mode: 'insensitive' } },
                        { originalText: { contains: query, mode: 'insensitive' } },
                    ],
                },
            }),
        ]);

        return {
            summaries,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
}

export const summaryService = new SummaryService();
