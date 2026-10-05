import pg from 'pg';

const connectionString = 'postgresql://postgres.hbxxwodvhqkzfktldkbi:Luz7Noche*2025@aws-0-us-east-1.pooler.supabase.com:5432/postgres';

const PRODUCT_IMAGES = {
  'APPLE-MBP-M3-14': {
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=80',
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=600&auto=format&fit=crop&q=80'
    ])
  },
  'AUDIO-TWS-PRO': {
    image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop&q=80',
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?w=600&auto=format&fit=crop&q=80'
    ])
  },
  'LOGI-G502-HERO': {
    image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=600&auto=format&fit=crop&q=80',
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&auto=format&fit=crop&q=80'
    ])
  },
  'WATCH-ULTRA-GPS': {
    image: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=600&auto=format&fit=crop&q=80',
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80'
    ])
  },
  'SONY-PS5-SLIM-1TB': {
    image: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=600&auto=format&fit=crop&q=80',
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80'
    ])
  },
  'SONY-WH1000XM5-BLK': {
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80',
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&auto=format&fit=crop&q=80'
    ])
  }
};

async function main() {
  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to Supabase PostgreSQL!');

    for (const [sku, imgData] of Object.entries(PRODUCT_IMAGES)) {
      const res = await client.query(
        'UPDATE public.products SET image = $1, images = $2::jsonb WHERE sku = $3 RETURNING id, name, sku, image',
        [imgData.image, imgData.images, sku]
      );
      if (res.rows.length > 0) {
        console.log(` Updated ${sku}: ${res.rows[0].name} -> ${res.rows[0].image}`);
      }
    }

    // Verify all products
    const all = await client.query('SELECT id, name, sku, image FROM public.products ORDER BY id ASC');
    console.log('\nAll Products currently in DB:');
    all.rows.forEach(p => console.log(` - [${p.sku}] ${p.name}: ${p.image}`));

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

main();
