const { createClient } = require('@libsql/client');

const url = 'libsql://cfb-predictions-rjosh3411.aws-us-east-1.turso.io';
const authToken = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODgyMzk4NjUsImlkIjoiMDFhMDViNjMtZTAwMS03ZmE2LThlYjUtZWM0NGEyN2E4MTc1Iiwia2lkIjoiMEdpYWpSSUlHWERCZ045eE9SOGdiOVZUUGRkdEJMSU9yWEFTeHdDb3NDOCIsInJpZCI6IjQ3MWNiZmFlLTNjYTMtNDM5Yi1hZTIwLTQyNGQ2OWQ1NGI3NyJ9.6i21bQqIJOu9BpFC2EZMGdq7IsUbda-UUH6tkK6smW8eRA3bAPlPAa2PjQRk6N2f8M31jInX7_hr2M1gJ47qAA';

const client = createClient({ url, authToken });

async function main() {
  console.log('Testing Turso connection...');
  const res = await client.execute('SELECT 1 as test');
  console.log('✓ Connected to Turso successfully! Result:', res.rows);
}

main().catch(console.error);
