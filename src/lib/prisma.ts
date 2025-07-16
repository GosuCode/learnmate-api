import { PrismaClient } from '@prisma/client';
import { getSessionPoolerConfig } from '../config/database';

declare global {
    var __prisma: PrismaClient | undefined;
}

// Configure Prisma client with connection pooling settings
const prismaClientSingleton = () => {
    const dbConfig = getSessionPoolerConfig();

    return new PrismaClient({
        datasources: {
            db: {
                url: dbConfig.url,
            },
        },
        // Connection pooling configuration for session poolers
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
};

export const prisma = globalThis.__prisma || prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
    globalThis.__prisma = prisma;
}

// Graceful shutdown handling
process.on('beforeExit', async () => {
    await prisma.$disconnect();
});

process.on('SIGINT', async () => {
    await prisma.$disconnect();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    await prisma.$disconnect();
    process.exit(0);
}); 