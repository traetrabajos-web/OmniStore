import pg from 'pg';

const connectionString = 'postgresql://postgres.hbxxwodvhqkzfktldkbi:Luz7Noche*2025@aws-0-us-east-1.pooler.supabase.com:5432/postgres';

async function findKeys() {
  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();

  try {
    const res = await client.query(`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_schema IN ('vault', 'pgsodium', 'auth', 'extensions')
      ORDER BY table_schema, table_name;
    `);
    console.log('Tables in schemas:', res.rows);
  } catch (e) {
    console.log('Error checking tables:', e.message);
  }

  try {
    const jwtRes = await client.query(`SHOW "app.settings.jwt_secret";`);
    console.log('jwt_secret setting:', jwtRes.rows);
  } catch (e) {
    console.log('Error jwt_secret setting:', e.message);
  }

  try {
    const res2 = await client.query(`SELECT name, setting FROM pg_settings WHERE name LIKE '%jwt%' OR name LIKE '%auth%';`);
    console.log('pg_settings auth:', res2.rows);
  } catch (e) {
    console.log('Error pg_settings:', e.message);
  }

  await client.end();
}

findKeys();
