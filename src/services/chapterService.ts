import { prisma } from '@/lib/prisma';

export class ChapterService {
    async create(data: { courseId: string; chapterNumber: number; slug: string; title: string; content: string }) {
        return await prisma.chapter.create({ data });
    }

    async getAll() {
        return await prisma.chapter.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }

    async getById(id: string) {
        return await prisma.chapter.findUnique({
            where: { id },
        });
    }

    async getAllByCourse(courseId: string) {
        return await prisma.chapter.findMany({
            where: { courseId },
            orderBy: { chapterNumber: 'asc' },
        });
    }

    async getByCourseSlugAndNumber(courseSlug: string, chapterNumber: number) {
        return await prisma.chapter.findFirst({
            where: {
                chapterNumber,
                course: { slug: courseSlug },
            },
            include: { course: true },
        });
    }

    async updateById(id: string, updates: Partial<{ chapterNumber: number; slug: string; title: string; content: string }>) {
        try {
            return await prisma.chapter.update({
                where: { id },
                data: updates,
            });
        } catch {
            return null;
        }
    }

    async deleteById(id: string) {
        try {
            await prisma.chapter.delete({ where: { id } });
            return true;
        } catch {
            return false;
        }
    }
}
