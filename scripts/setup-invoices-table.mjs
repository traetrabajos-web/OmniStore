import pg from 'pg';

const connectionString = 'postgresql://postgres.hbxxwodvhqkzfktldkbi:Luz7Noche*2025@aws-0-us-east-1.pooler.supabase.com:5432/postgres';

async function main() {
  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to Supabase PostgreSQL!');

    const resCols = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'invoices'
      ORDER BY ordinal_position;
    `);

    console.log('Existing columns in invoices:');
    resCols.rows.forEach(r => console.log(`  - ${r.column_name} (${r.data_type})`));

    // Ensure all required DIAN columns exist
    const requiredCols = [
      'invoice_number TEXT',
      'order_id TEXT',
      'order_number TEXT',
      'cufe TEXT',
      'customer_name TEXT',
      'customer_doc_type TEXT DEFAULT \'CC\'',
      'customer_doc TEXT',
      'customer_email TEXT',
      'customer_phone TEXT',
      'customer_city TEXT DEFAULT \'Cartagena de Indias\'',
      'customer_address TEXT',
      'subtotal NUMERIC(15, 2) DEFAULT 0',
      'iva_amount NUMERIC(15, 2) DEFAULT 0',
      'discount_amount NUMERIC(15, 2) DEFAULT 0',
      'total NUMERIC(15, 2) DEFAULT 0',
      'payment_method TEXT DEFAULT \'PSE\'',
      'status TEXT DEFAULT \'approved\'',
      'dian_resolution TEXT DEFAULT \'Res. DIAN No. 18764000001 (Rango FE-1 a FE-50000)\'',
      'dian_environment TEXT DEFAULT \'PRODUCCIÓN\'',
      'items JSONB DEFAULT \'[]\'::jsonb',
      'xml_content TEXT',
      'qr_code_data TEXT'
    ];

    for (const colDef of requiredCols) {
      const colName = colDef.split(' ')[0];
      await client.query(`ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS ${colDef};`);
    }

    console.log('All DIAN columns verified/added!');

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

main();
