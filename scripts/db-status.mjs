// Script to verify Supabase PostgreSQL table contents and health across all tables
import pg from 'pg';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres.hbxxwodvhqkzfktldkbi:Luz7Noche*2025@aws-0-us-east-1.pooler.supabase.com:5432/postgres';

async function checkStatus() {
  console.log('🔄 Conectando a Supabase PostgreSQL...');
  
  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Conexión exitosa a Supabase PostgreSQL (AWS us-east-1).');

    // 1. Users
    const usersRes = await client.query('SELECT COUNT(*) FROM public.users;');
    console.log(`\n👥 Usuarios registrados: ${usersRes.rows[0].count}`);
    const sampleUsers = await client.query('SELECT id, name, email, role, status FROM public.users ORDER BY id ASC;');
    sampleUsers.rows.forEach(u => {
      console.log(`  • [${u.role.toUpperCase()}] ${u.name} (${u.email}) - Estado: ${u.status}`);
    });

    // 2. Categories
    const catRes = await client.query('SELECT COUNT(*) FROM public.categories;');
    console.log(`\n📂 Categorías registradas: ${catRes.rows[0].count}`);

    // 3. Products
    const prodRes = await client.query('SELECT COUNT(*) FROM public.products;');
    console.log(`\n📦 Catálogo de Productos: ${prodRes.rows[0].count}`);
    const sampleProducts = await client.query('SELECT id, name, sku, price, stock, status FROM public.products ORDER BY id DESC LIMIT 5;');
    sampleProducts.rows.forEach(p => {
      console.log(`  • [ID: ${p.id}] ${p.name} | SKU: ${p.sku} | $${p.price} | Stock: ${p.stock} | Estado: ${p.status}`);
    });

    // 4. Coupons
    const coupRes = await client.query('SELECT COUNT(*) FROM public.coupons;');
    console.log(`\n🎟️ Cupones de descuento activos: ${coupRes.rows[0].count}`);
    const sampleCoupons = await client.query('SELECT code, discount_type, discount_value, is_active FROM public.coupons;');
    sampleCoupons.rows.forEach(c => {
      console.log(`  • Cupón [${c.code}] -> Tipo: ${c.discount_type}, Valor: ${c.discount_value}, Activo: ${c.is_active}`);
    });

    // 5. Orders
    const ordRes = await client.query('SELECT COUNT(*) FROM public.orders;');
    console.log(`\n📋 Pedidos registrados: ${ordRes.rows[0].count}`);
    const sampleOrders = await client.query('SELECT id, order_number, customer_name, total, status FROM public.orders ORDER BY id DESC LIMIT 3;');
    sampleOrders.rows.forEach(o => {
      console.log(`  • [${o.order_number}] Cliente: ${o.customer_name} | Total: $${o.total} | Estado: ${o.status}`);
    });

    // 6. Reviews
    const revRes = await client.query('SELECT COUNT(*) FROM public.reviews;');
    console.log(`\n⭐ Reseñas de productos: ${revRes.rows[0].count}`);

    console.log('\n======================================================');
    console.log('🎉 ¡Todas las tablas y datos reales están 100% operativos!');
    console.log('======================================================\n');

  } catch (err) {
    console.error('❌ Error de conexión:', err.message);
  } finally {
    await client.end();
  }
}

checkStatus();
