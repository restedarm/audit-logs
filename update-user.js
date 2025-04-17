import { updateUser } from './userService.js';

const [, , userIdArg, updateFieldsArg, changedByArg] = process.argv;

function validateInput() {
    if (!userIdArg || !updateFieldsArg || !changedByArg) {
        console.error('Missing required arguments');
        console.error('Usage: node update-user.js <userId> <changes_json> <changedBy>');
        console.error('Example: node update-user.js 1 \'{"email":"new@example.com"}\' 999');
        return false;
    }

    const userId = parseInt(userIdArg);
    if (isNaN(userId) || userId <= 0) {
        console.error('Error: userId must be a positive number');
        return false;
    }

    let changes;
    try {
        changes = JSON.parse(updateFieldsArg);
        if (typeof changes !== 'object' || changes === null || Array.isArray(changes)) {
            throw new Error('Changes must be a non-null object');
        }
        if (Object.keys(changes).length === 0) {
            console.error('Error: No fields to update');
            return false;
        }
    } catch (error) {
        console.error(`Error parsing changes JSON: ${error.message}`);
        console.error('Changes must be a valid JSON object');
        return false;
    }

    const changedBy = parseInt(changedByArg);
    if (isNaN(changedBy) || changedBy <= 0) {
        console.error('Error: changedBy must be a positive number');
        return false;
    }

    return true;
}

async function main() {
    if (!validateInput()) {
        process.exit(1);
    }

    try {
        const userId = parseInt(userIdArg);
        const changes = JSON.parse(updateFieldsArg);
        const changedBy = parseInt(changedByArg);

        console.log(`Updating user ${userId} with changes:`, changes);

        const updatedUser = await updateUser(userId, changes, changedBy);

        if (updatedUser) {
            console.log('User updated successfully:');
            console.log(updatedUser);
        } else {
            console.log('No changes were applied');
        }
    } catch (error) {
        console.error('Error updating user:', error.message);
        process.exit(1);
    }
}

main(); 