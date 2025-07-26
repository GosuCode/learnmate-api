import { prisma } from '@/lib/prisma';
import { CreateSemesterRequest } from '@/types/semester';

export class SemesterService {
  async createSemester(data: CreateSemesterRequest) {
    const { name, code } = data;
    return await prisma.semester.create({
      data: {
        name,
        code
      }
    });
  }

  async getAllSemesters() {
    return await prisma.semester.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSemesterById(id: string) {
    return await prisma.semester.findUnique({
      where: { id },
    });
  }

  async updateSemester(id: string, data: Partial<CreateSemesterRequest>) {
    const existing = await prisma.semester.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Semester not found');
    }

    if (data.name && data.name !== existing.name) {
      const nameTaken = await this.isSemesterNameTaken(data.name);
      if (nameTaken) {
        throw new Error('Semester name already taken');
      }
    }

    if (data.code && data.code !== existing.code) {
      const codeTaken = await prisma.semester.findFirst({
        where: { code: data.code, NOT: { id } },
      });
      if (codeTaken) {
        throw new Error('Semester code already taken');
      }
    }

    return await prisma.semester.update({
      where: { id },
      data,
    });
  }

  async deleteSemester(id: string) {
    return await prisma.semester.delete({
      where: { id },
    });
  }

  async isSemesterNameTaken(name: string): Promise<boolean> {
    const existing = await prisma.semester.findFirst({
      where: { name },
    });
    return !!existing;
  }
}
