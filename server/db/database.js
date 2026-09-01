const { createClient } = require('@libsql/client');
const dotenv = require('dotenv');

dotenv.config();

const TURSO_URL = process.env.TURSO_DATABASE_URL || 'libsql://cfb-predictions-rjosh3411.aws-us-east-1.turso.io';
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN || 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODgyMzk4NjUsImlkIjoiMDFhMDViNjMtZTAwMS03ZmE2LThlYjUtZWM0NGEyN2E4MTc1Iiwia2lkIjoiMEdpYWpSSUlHWERCZ045eE9SOGdiOVZUUGRkdEJMSU9yWEFTeHdDb3NDOCIsInJpZCI6IjQ3MWNiZmFlLTNjYTMtNDM5Yi1hZTIwLTQyNGQ2OWQ1NGI3NyJ9.6i21bQqIJOu9BpFC2EZMGdq7IsUbda-UUH6tkK6smW8eRA3bAPlPAa2PjQRk6N2f8M31jInX7_hr2M1gJ47qAA';

const client = createClient({
  url: TURSO_URL,
  authToken: TURSO_TOKEN
});

const db = {
  client,
  async execute(sql, args = []) {
    return await client.execute({ sql, args });
  },
  async batch(statements) {
    return await client.batch(statements);
  },
  prepare(sql) {
    return {
      async get(...args) {
        let flatArgs = args;
        if (args.length === 1 && typeof args[0] === 'object' && !Array.isArray(args[0]) && args[0] !== null) {
          flatArgs = args[0];
        } else if (args.length === 1 && Array.isArray(args[0])) {
          flatArgs = args[0];
        }
        const res = await client.execute({ sql, args: flatArgs });
        return res.rows[0] || null;
      },
      async all(...args) {
        let flatArgs = args;
        if (args.length === 1 && typeof args[0] === 'object' && !Array.isArray(args[0]) && args[0] !== null) {
          flatArgs = args[0];
        } else if (args.length === 1 && Array.isArray(args[0])) {
          flatArgs = args[0];
        }
        const res = await client.execute({ sql, args: flatArgs });
        return res.rows || [];
      },
      async run(...args) {
        let flatArgs = args;
        if (args.length === 1 && typeof args[0] === 'object' && !Array.isArray(args[0]) && args[0] !== null) {
          flatArgs = args[0];
        } else if (args.length === 1 && Array.isArray(args[0])) {
          flatArgs = args[0];
        }
        const res = await client.execute({ sql, args: flatArgs });
        return {
          changes: res.rowsAffected,
          lastInsertRowid: res.lastInsertRowid
        };
      }
    };
  }
};

module.exports = db;
