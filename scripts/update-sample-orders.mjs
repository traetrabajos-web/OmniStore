import pg from 'pg';

const connectionString = 'postgresql://postgres.hbxxwodvhqkzfktldkbi:Luz7Noche*2025@aws-0-us-east-1.pooler.supabase.com:5432/postgres';

async function updateOrders() {
  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    await client.query(`
      UPDATE public.orders SET
        customer_name = 'Carlos Mendoza (Cliente VIP)',
        customer_email = 'cliente@omnistore.com',
        customer_phone = '+57 312 345 6789',
        shipping_address = 'Cra 15 # 93-45, Chicó Norte',
        shipping_city = 'Bogotá D.C.',
        shipping_zip = '110221',
        shipping_country = 'Colombia',
        payment_method = 'PSE',
        subtotal = 1478000,
        total = 1478000,
        status = 'processing',
        items = '[{"name":"Apple AirPods Pro 2da Generación con Estuche MagSafe USB-C","price":999000,"quantity":1},{"name":"Ratón Inalámbrico Ergonómico Logitech MX Master 3S","price":479000,"quantity":1}]'
      WHERE id = 1;
    `);

    await client.query(`
      UPDATE public.orders SET
        customer_name = 'Mariana Restrepo',
        customer_email = 'mariana.restrepo@ejemplo.com',
        customer_phone = '+57 300 987 6543',
        shipping_address = 'Calle 10 # 43E-22, El Poblado',
        shipping_city = 'Medellín (Antioquia)',
        shipping_zip = '050021',
        shipping_country = 'Colombia',
        payment_method = 'Nequi',
        subtotal = 3699000,
        total = 3699000,
        status = 'shipped',
        tracking_number = 'SERVI-CO-998822',
        items = '[{"name":"PlayStation 5 Pro Console 2TB SSD 4K 120Hz Ray Tracing PSSR","price":3699000,"quantity":1}]'
      WHERE id = 2;
    `);

    await client.query(`
      UPDATE public.orders SET
        customer_name = 'Andrés Felipe Caicedo',
        customer_email = 'andres.caicedo@ejemplo.com',
        customer_phone = '+57 315 432 1098',
        shipping_address = 'Av. San Joaquín # 14-80, Ciudad Jardín',
        shipping_city = 'Cali (Valle del Cauca)',
        shipping_zip = '760032',
        shipping_country = 'Colombia',
        payment_method = 'Daviplata',
        subtotal = 1298000,
        total = 1298000,
        status = 'delivered',
        tracking_number = 'COORD-CO-554411',
        items = '[{"name":"Altavoz Bluetooth Portátil JBL Charge 5 Resistente al Agua IP67","price":649000,"quantity":2}]'
      WHERE id = 3;
    `);

    console.log('✅ PostgreSQL sample orders updated to Colombian COP data.');
  } catch (err) {
    console.error('Error updating orders:', err);
  } finally {
    await client.end();
  }
}

updateOrders();
