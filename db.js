import pg from 'pg'
const { Pool } = pg
import dotenv from 'dotenv'
dotenv.config()

const connectionString = process.env.DATABASE_URL

const pool = new Pool({
    connectionString,
})

export async function getUserById(client, userId) {
    const query = {
        text: 'SELECT * FROM users WHERE id = $1',
        values: [userId]
    };
    const result = await client.query(query);
    return result.rows[0] || null;
}

export async function updateUser(client, userId, fieldUpdates, values) {
    const paramCount = values.length + 1;
    const query = {
        text: `
            UPDATE users 
            SET ${fieldUpdates.join(', ')}
            WHERE id = $${paramCount}
            RETURNING *
        `,
        values: [...values, userId]
    };
    const result = await client.query(query);
    return result.rows[0];
}

export async function createAuditLog(client, userId, field, oldValue, newValue, changedBy) {
    const query = {
        text: `
            INSERT INTO user_audit_logs 
            (user_id, field_name, old_value, new_value, changed_by)
            VALUES ($1, $2, $3, $4, $5)
        `,
        values: [userId, field, oldValue, newValue, changedBy]
    };
    return client.query(query);
}

export async function createAuditLogs(client, userId, changedBy, changes) {
    for (const change of changes) {
        await createAuditLog(
            client,
            userId,
            change.field,
            change.oldValue,
            change.newValue,
            changedBy
        );
    }
}

export async function executeInTransaction(callback) {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const result = await callback(client);

        await client.query('COMMIT');
        return result;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

export async function getClient() {
    return pool.connect();
}

export default pool