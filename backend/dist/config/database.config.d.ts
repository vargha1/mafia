export declare const databaseConfig: {
    validateConfig(): void;
    getTypeOrmConfig(): {
        type: string;
        host: string;
        port: number;
        username: string;
        password: string;
        database: string;
        ssl: boolean | {
            rejectUnauthorized: boolean;
        };
        logging: boolean;
        synchronize: boolean;
        entities: string[];
        migrations: string[];
        cli: {
            migrationsDir: string;
        };
        pool: {
            min: number;
            max: number;
            acquireTimeoutMillis: number;
            createTimeoutMillis: number;
            destroyTimeoutMillis: number;
            idleTimeoutMillis: number;
            reapIntervalMillis: number;
            createRetryIntervalMillis: number;
        };
        extra: {
            max: number;
            connectionTimeoutMillis: number;
            idleTimeoutMillis: number;
        };
    };
};
