// Script to connect directly to Supabase PostgreSQL and run migrations
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const connectionString = 'postgresql://postgres.hbxxwodvhqkzfktldkbi:Luz7Noche*2025@aws-0-us-east-1.pooler.supabase.com:5432/postgres';

async function initDatabase() {
  console.log('🔄 Conectando a Supabase PostgreSQL...');
  
  const client = new pg.Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ Conexión establecida con éxito a PostgreSQL (Supabase Session Pooler).');

    // Read schema SQL
    const schemaPath = path.resolve(__dirname, '../supabase-schema.sql');
    const sqlContent = fs.readFileSync(schemaPath, 'utf8');

    console.log('🔄 Ejecutando supabase-schema.sql...');
    await client.query(sqlContent);
    console.log('✅ Tablas products y orders creadas y configuradas.');

    // Verify products count
    const productsRes = await client.query('SELECT COUNT(*) FROM public.products;');
    console.log(`📦 Total de productos en la tabla: ${productsRes.rows[0].count}`);

    // Verify orders count
    const ordersRes = await client.query('SELECT COUNT(*) FROM public.orders;');
    console.log(`📋 Total de pedidos en la tabla: ${ordersRes.rows[0].count}`);

    console.log('🎉 ¡Base de datos PostgreSQL inicializada con éxito!');
  } catch (err) {
    console.error('❌ Error durante la inicialización:', err);
  } finally {
    await client.end();
  }
}

initDatabase();
