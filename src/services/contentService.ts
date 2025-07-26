import { prisma } from '@/lib/prisma';
import { CreateContentInput } from '@/models/contentModel';

export class ContentService {
    async createContent(data: CreateContentInput) {
        const { slug } = data;
        const existing = await prisma.content.findUnique({
            where: { slug },
        });

        if (existing) {
            throw new Error('Content with this slug already exists');
        }

        return await prisma.content.create({
            data,
        });
    }

    async getAllContents() {
        return await prisma.content.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }

    async getContentById(id: string) {
        return await prisma.content.findUnique({
            where: { id },
        });
    }

    async updateContent(id: string, data: Partial<CreateContentInput>) {
        const existing = await prisma.content.findUnique({ where: { id } });
        if (!existing) {
            throw new Error('Content not found');
        }

        if (data.slug && data.slug !== existing.slug) {
            const slugTaken = await prisma.content.findFirst({
                where: { slug: data.slug, NOT: { id } },
            });
            if (slugTaken) {
                throw new Error('Content slug already taken');
            }
        }

        return await prisma.content.update({
            where: { id },
            data,
        });
    }

    async deleteContent(id: string) {
        return await prisma.content.delete({
            where: { id },
        });
    }
}
