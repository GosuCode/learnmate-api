import { prisma } from '@/lib/prisma';

export class CourseService {
    async create(data: { slug: string; name: string; semester: number; description?: string }) {
        return await prisma.course.create({ data });
    }

    async getAll() {
        return await prisma.course.findMany({ orderBy: { semester: 'asc' } });
    }

    async getById(id: string) {
        return await prisma.course.findUnique({ where: { id } });
    }

    async updateById(id: string, updates: Partial<{ name: string; semester: number; description?: string }>) {
        try {
            return await prisma.course.update({
                where: { id },
                data: updates,
            });
        } catch {
            return null;
        }
    }

    async deleteById(id: string) {
        try {
            await prisma.course.delete({ where: { id } });
            return true;
        } catch {
            return false;
        }
    }
}
