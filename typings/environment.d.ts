declare global {
    namespace NodeJS {
        interface ProcessEnv {
            DATABASE_URL: string;
            NODE_ENV: "development" | "production";
            DISCORD_TOKEN: string;
            SENTRY_DSN?: string;
            DATADOG_API_KEY?: string;
        }
    }
}

export {};

