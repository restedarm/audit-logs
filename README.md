# User Audit Logging System

A robust system for tracking changes to sensitive user data in PostgreSQL. This system creates an audit trail for sensitive field changes, providing accountability and security compliance.

## Configuration

Set sensitive fields in your `.env` file:

```
SENSITIVE_FIELDS=email,phone,address
DATABASE_URL=postgres://user:password@localhost:5432/mydb
```

### Create Schema

Run script to create schema

```bash
npm run create-schema
```

### Assumptions

Create users

### CLI Usage

Update a user with the CLI tool:

```bash
node update-user.js <userId> '<changes_json>' <changedBy>
```

Example:

```bash
node update-user.js 1 '{"email":"new@example.com", "phone":"123-456-7890"}' 999
```
