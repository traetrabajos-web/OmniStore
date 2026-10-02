import pg from 'pg';

const connectionString = 'postgresql://postgres.hbxxwodvhqkzfktldkbi:Luz7Noche*2025@aws-0-us-east-1.pooler.supabase.com:5432/postgres';

async function checkSecrets() {
  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    // Check vault
    try {
      const res = await client.query('SELECT * FROM vault.decrypted_secrets;');
      console.log('Vault secrets:', res.rows);
    } catch (e) {
      console.log('Vault check:', e.message);
    }

  } catch (e) {
    console.error(e);
  } finally {
    await client.end();
  }
}

checkSecrets();
