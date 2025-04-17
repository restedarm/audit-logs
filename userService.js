import dotenv from 'dotenv';
import * as db from './db.js';

dotenv.config();

const SENSITIVE_FIELDS_ARRAY = (process.env.SENSITIVE_FIELDS).split(',');
const SENSITIVE_FIELDS = new Set(SENSITIVE_FIELDS_ARRAY);

function normalizeValue(value) {
    if (value === null || value === undefined) {
        return null;
    }

    const stringValue = String(value).trim();

    if (stringValue === '') {
        return null;
    }

    const numValue = Number(stringValue);
    if (!isNaN(numValue) && String(numValue) === stringValue) {
        return numValue;
    }

    return stringValue;
}

function identifyChanges(currentUser, changes) {
    const updates = [];
    const values = [];
    const sensitiveChanges = [];
    let paramCount = 1;

    for (const [field, newValue] of Object.entries(changes)) {
        if (field in currentUser) {
            const oldValue = currentUser[field];
            const normalizedOldValue = normalizeValue(oldValue);
            const normalizedNewValue = normalizeValue(newValue);

            if (normalizedOldValue != normalizedNewValue) {
                updates.push(`${field} = $${paramCount}`);
                values.push(newValue);
                paramCount++;

                if (SENSITIVE_FIELDS.has(field)) {
                    sensitiveChanges.push({
                        field,
                        oldValue,
                        newValue
                    });
                    console.log(`Sensitive field "${field}" will be logged`);
                }
            }
        } else {
            console.warn(`Warning: Field "${field}" does not exist in user record`);
        }
    }

    return { updates, values, sensitiveChanges };
}

export async function updateUser(userId, changes, changedBy) {
    if (!userId || !changes || !changedBy) {
        throw new Error('Missing required parameters: userId, changes, or changedBy');
    }



    return db.executeInTransaction(async (client) => {
        const changedByUser = await db.getUserById(client, changedBy);

        if (!changedByUser) {
            throw new Error(`User with ID ${changedBy} not found`);
        }

        if (!changedByUser.is_admin) {
            throw new Error(`User with ID ${changedBy} is not an admin`);
        }

        const currentUser = await db.getUserById(client, userId);

        if (!currentUser) {
            throw new Error(`User with ID ${userId} not found`);
        }

        const { updates, values, sensitiveChanges } = identifyChanges(currentUser, changes);

        if (updates.length === 0) {
            console.log('No changes to apply');
            return null;
        }

        const updatedUser = await db.updateUser(client, userId, updates, values);

        if (sensitiveChanges.length > 0) {
            await db.createAuditLogs(client, userId, changedBy, sensitiveChanges);
        }

        return updatedUser;
    });
}
