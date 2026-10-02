import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import { INITIAL_CATALOG } from '../src-modern/scripts/utils/store-data.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const connectionString = 'postgresql://postgres.hbxxwodvhqkzfktldkbi:Luz7Noche*2025@aws-0-us-east-1.pooler.supabase.com:5432/postgres';

function escapeSql(str) {
  if (str === null || str === undefined) return 'NULL';
  return "'" + String(str).replace(/'/g, "''") + "'";
}

async function run() {
  console.log(`📦 Preparando ${INITIAL_CATALOG.length} productos reales de tecnología para Supabase PostgreSQL...`);

  // Build SQL inserts for products
  const productValues = INITIAL_CATALOG.map(p => {
    return `(
      ${p.id},
      ${escapeSql(p.name)},
      ${escapeSql(p.sku)},
      ${escapeSql(p.category)},
      ${escapeSql(p.categoryLabel)},
      ${p.categoryId || 1},
      ${p.price},
      ${p.originalPrice || p.price},
      ${p.discountPercent || 0},
      ${p.stock},
      ${p.stockLeft || p.stock},
      ${p.stockTotal || p.stock},
      ${escapeSql(p.status || 'published')},
      ${p.rating || 4.8},
      ${p.reviewsCount || 0},
      ${p.salesCount || 0},
      ${Boolean(p.isFlashDeal)},
      ${Boolean(p.isBestSeller)},
      ${Boolean(p.hasFreeShipping)},
      ${Boolean(p.isFullShipping)},
      ${escapeSql(p.badgeText)},
      ${escapeSql(p.image)},
      ${escapeSql(JSON.stringify(p.colors || []))}::jsonb,
      ${escapeSql(JSON.stringify(p.sizes || []))}::jsonb,
      ${escapeSql(p.description)},
      ${escapeSql(JSON.stringify(p.tags || []))}::jsonb
    )`;
  }).join(',\n');

  const productsInsertSql = `
    INSERT INTO public.products 
    (id, name, sku, category, category_label, category_id, price, original_price, discount_percent, stock, stock_left, stock_total, status, rating, reviews_count, sales_count, is_flash_deal, is_best_seller, has_free_shipping, is_full_shipping, badge_text, image, colors, sizes, description, tags)
    VALUES
    ${productValues}
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      sku = EXCLUDED.sku,
      category = EXCLUDED.category,
      category_label = EXCLUDED.category_label,
      category_id = EXCLUDED.category_id,
      price = EXCLUDED.price,
      original_price = EXCLUDED.original_price,
      discount_percent = EXCLUDED.discount_percent,
      stock = EXCLUDED.stock,
      stock_left = EXCLUDED.stock_left,
      stock_total = EXCLUDED.stock_total,
      status = EXCLUDED.status,
      rating = EXCLUDED.rating,
      reviews_count = EXCLUDED.reviews_count,
      sales_count = EXCLUDED.sales_count,
      is_flash_deal = EXCLUDED.is_flash_deal,
      is_best_seller = EXCLUDED.is_best_seller,
      has_free_shipping = EXCLUDED.has_free_shipping,
      is_full_shipping = EXCLUDED.is_full_shipping,
      badge_text = EXCLUDED.badge_text,
      image = EXCLUDED.image,
      colors = EXCLUDED.colors,
      sizes = EXCLUDED.sizes,
      description = EXCLUDED.description,
      tags = EXCLUDED.tags;
  `;

  // Read current schema file and replace Section 13
  const schemaPath = path.resolve(__dirname, '../supabase-schema.sql');
  let currentSchema = fs.readFileSync(schemaPath, 'utf8');

  const section13Index = currentSchema.indexOf('-- 13. DATOS REALES: CATÁLOGO DE PRODUCTOS');
  const section14Index = currentSchema.indexOf('-- 14. DATOS REALES: RESEÑAS Y OPINIONES');

  if (section13Index !== -1 && section14Index !== -1) {
    const updatedSchema = currentSchema.substring(0, section13Index) +
      `-- 13. DATOS REALES: CATÁLOGO DE PRODUCTOS (${INITIAL_CATALOG.length} PRODUCTOS TECNOLÓGICOS REALES)\n-- ==============================================================================\n` +
      productsInsertSql + '\n\n' +
      currentSchema.substring(section14Index);

    fs.writeFileSync(schemaPath, updatedSchema, 'utf8');
    console.log('✅ Archivo supabase-schema.sql actualizado con catálogo real de tecnología.');
  }

  // Connect to Supabase PostgreSQL and execute
  console.log('🔄 Sincronizando con base de datos Supabase PostgreSQL...');
  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Conexión establecida con Supabase.');
    
    // Execute products insert
    await client.query(productsInsertSql);
    console.log('✅ Catálogo de productos reales insertado/actualizado con éxito en Supabase.');

    const countRes = await client.query('SELECT COUNT(*) FROM public.products');
    console.log(`🎉 Total de productos en la base de datos: ${countRes.rows[0].count}`);
  } catch (err) {
    console.error('❌ Error conectando a PostgreSQL:', err);
  } finally {
    await client.end();
  }
}

run();
