export interface DatabaseConfig {
    url: string;
    maxConnections: number;
    idleTimeout: number;
    connectionTimeout: number;
}

export const getDatabaseConfig = (): DatabaseConfig => {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
        throw new Error('DATABASE_URL environment variable is required');
    }

    return {
        url: databaseUrl,
        maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20'),
        idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
        connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '10000'),
    };
};

// Session pooler specific configurations
export const getSessionPoolerConfig = () => {
    const config = getDatabaseConfig();

    return {
        ...config,
        // Common session pooler settings
        poolMode: process.env.DB_POOL_MODE || 'transaction', // 'transaction' or 'session'
        // For PgBouncer or similar poolers
        applicationName: 'learnmate-backend',
        // Connection string parameters for poolers
        connectionParams: {
            // Add any specific pooler parameters here
            // For example, for Neon with PgBouncer:
            // sslmode: 'require',
            // connect_timeout: config.connectionTimeout / 1000,
        },
    };
}; 