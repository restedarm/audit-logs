import pool from './db.js'
import { readFileSync } from 'fs'
import path from 'path'

const schemaPath = path.resolve('./schema.sql');
const schema = readFileSync(schemaPath, 'utf-8');

async function createSchema() {
    await pool.query(schema);
    console.log('Schema created successfully');
}

createSchema();
