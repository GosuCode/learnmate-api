import { prisma } from '@/lib/prisma';

interface CreateFlashcardRequest {
    front: string;
    back: string;
    userId: string;
    groupId?: string;
}

interface FlashcardStats {
    totalCards: number;
    dueCards: number;
    newCards: number;
    learningCards: number;
    reviewCards: number;
}

export class SM2Service {
    async createFlashcard(data: CreateFlashcardRequest) {
        return await prisma.flashcard.create({
            data: {
                front: data.front,
                back: data.back,
                userId: data.userId,
                groupId: data.groupId,
                interval: 0,
                repetition: 0,
                easeFactor: 2.5,
                nextReview: new Date(),
                lastReviewed: new Date(),
                createdAt: new Date(),
                updatedAt: new Date()
            }
        });
    }

    async reviewFlashcard(id: string, qualityScore: number) {
        const flashcard = await prisma.flashcard.findUnique({
            where: { id }
        });

        if (!flashcard) {
            throw new Error('Flashcard not found');
        }

        // SM2 algorithm implementation
        let { interval, repetition, easeFactor } = flashcard;

        if (qualityScore >= 3) {
            // Successful recall
            if (repetition === 0) {
                interval = 1;
            } else if (repetition === 1) {
                interval = 6;
            } else {
                interval = Math.round(interval * easeFactor);
            }
            repetition += 1;
        } else {
            // Failed recall
            repetition = 0;
            interval = 1;
        }

        // Adjust ease factor
        easeFactor = easeFactor + (0.1 - (5 - qualityScore) * (0.08 + (5 - qualityScore) * 0.02));
        easeFactor = Math.max(1.3, easeFactor);

        // Calculate next review date
        const nextReview = new Date();
        nextReview.setDate(nextReview.getDate() + interval);

        return await prisma.flashcard.update({
            where: { id },
            data: {
                interval,
                repetition,
                easeFactor,
                nextReview,
                lastReviewed: new Date(),
                updatedAt: new Date()
            }
        });
    }

    async getDueFlashcards(userId: string) {
        const now = new Date();

        return await prisma.flashcard.findMany({
            where: {
                userId,
                nextReview: {
                    lte: now
                }
            },
            orderBy: {
                nextReview: 'asc'
            }
        });
    }

    async getFlashcardStats(userId: string): Promise<FlashcardStats> {
        const now = new Date();

        const [totalCards, dueCards, newCards, learningCards, reviewCards] = await Promise.all([
            prisma.flashcard.count({ where: { userId } }),
            prisma.flashcard.count({
                where: {
                    userId,
                    nextReview: { lte: now }
                }
            }),
            prisma.flashcard.count({
                where: {
                    userId,
                    repetition: 0
                }
            }),
            prisma.flashcard.count({
                where: {
                    userId,
                    repetition: { gt: 0, lt: 3 }
                }
            }),
            prisma.flashcard.count({
                where: {
                    userId,
                    repetition: { gte: 3 }
                }
            })
        ]);

        return {
            totalCards,
            dueCards,
            newCards,
            learningCards,
            reviewCards
        };
    }
}

export const sm2Service = new SM2Service();

