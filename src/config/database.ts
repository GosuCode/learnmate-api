export interface DatabaseConfig {
    url: string;
    maxConnections: number;
    idleTimeout: number;
    connectionTimeout: number;
    isLocal: boolean;
}

export const getDatabaseConfig = (): DatabaseConfig => {
    const nodeEnv = process.env.NODE_ENV || 'development';
    const isLocal = nodeEnv === 'development' && process.env.USE_LOCAL_DB === 'true';

    let databaseUrl: string;

    if (isLocal) {
        // Local PostgreSQL configuration
        databaseUrl = process.env.LOCAL_DATABASE_URL || 'postgresql://postgres:password@localhost:5432/learnmate';
        console.log('🔧 Using LOCAL PostgreSQL database');
    } else {
        // Supabase/Production configuration
        const supabaseUrl = process.env.DATABASE_URL;
        if (!supabaseUrl) {
            throw new Error('DATABASE_URL environment variable is required for production/Supabase');
        }
        databaseUrl = supabaseUrl;
        console.log('☁️ Using SUPABASE/Production database');
    }

    return {
        url: databaseUrl,
        maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20'),
        idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
        connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '10000'),
        isLocal,
    };
};

// Session pooler specific configurations (for Supabase)
export const getSessionPoolerConfig = () => {
    const config = getDatabaseConfig();

    if (config.isLocal) {
        // Local database doesn't need session pooler config
        return config;
    }

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