import { prisma } from '@/lib/prisma';
import { CreateSubjectInput, UpdateSubjectInput } from '@/models/subjectModel';

export class SubjectService {
    async createSubject(data: CreateSubjectInput) {
        const { name, code, semesterId } = data;

        const existing = await prisma.subject.findFirst({
            where: {
                OR: [{ name }, { code }],
            },
        });

        if (existing) {
            throw new Error('Subject with the same name or code already exists');
        }

        return await prisma.subject.create({
            data: {
                name,
                code,
                semesterId,
            },
        });
    }

    async getAllSubjects() {
        return await prisma.subject.findMany({
            orderBy: { createdAt: 'desc' },
            include: { semester: true },
        });
    }

    async getSubjectById(id: string) {
        return await prisma.subject.findUnique({
            where: { id },
            include: { semester: true, contents: true },
        });
    }

    async updateSubject(id: string, data: UpdateSubjectInput) {
        if (data.name || data.code) {
            const existing = await prisma.subject.findFirst({
                where: {
                    OR: [
                        { name: data.name },
                        { code: data.code },
                    ],
                    NOT: { id },
                },
            });

            if (existing) {
                throw new Error('Another subject with the same name or code exists');
            }
        }

        return await prisma.subject.update({
            where: { id },
            data,
        });
    }

    async deleteSubject(id: string) {
        return await prisma.subject.delete({
            where: { id },
        });
    }
}
