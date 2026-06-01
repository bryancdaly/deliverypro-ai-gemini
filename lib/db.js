let cachedSql = null;

export async function getSql() {
    if (!cachedSql) {
        const postgres = await import("@vercel/postgres");
        cachedSql = postgres.sql;
    }
    return cachedSql;
}

export function hasDatabaseUrl() {
    return Boolean(process.env.POSTGRES_URL || process.env.DATABASE_URL);
}
