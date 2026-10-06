// ==============================================================================
// OmniStore - Direct Supabase PostgreSQL Product Catalog Seeder & Injector
// ==============================================================================

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const connectionString = 'postgresql://postgres.hbxxwodvhqkzfktldkbi:Luz7Noche*2025@aws-0-us-east-1.pooler.supabase.com:5432/postgres';

async function injectAllProducts() {
  console.log('🚀 Iniciando inyección masiva de productos a Supabase PostgreSQL...');

  const client = new pg.Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ Conexión establecida con éxito con Supabase PostgreSQL.');

    // 1. Read store-data.js to extract INITIAL_CATALOG
    const storeDataPath = path.resolve(__dirname, '../src-modern/scripts/utils/store-data.js');
    const storeDataCode = fs.readFileSync(storeDataPath, 'utf8');

    // Dynamically evaluate INITIAL_CATALOG
    const match = storeDataCode.match(/export const INITIAL_CATALOG = (\[[\s\S]*?\n\];)/);
    if (!match) {
      throw new Error('No se pudo encontrar INITIAL_CATALOG en store-data.js');
    }

    // eslint-disable-next-line no-eval
    const initialCatalog = eval(match[1]);
    console.log(`📦 Se encontraron ${initialCatalog.length} productos en el catálogo oficial.`);

    // 2. Ensure categories 1 through 8 exist
    const categoriesQuery = `
      INSERT INTO public.categories (id, name, slug, icon, description, item_count)
      VALUES
      (1, 'Tecnología & Gadgets', 'electronics', 'bi-laptop', 'Smartphones, laptops, smartwatches y tecnología en Cartagena', 42),
      (2, 'Audio & Sonido', 'audio', 'bi-headphones', 'Auriculares bluetooth, altavoces portátiles y sonido Hi-Res', 28),
      (3, 'Gaming & Videojuegos', 'gaming', 'bi-controller', 'Consolas PS5, teclados mecánicos, ratones gamer y periféricos', 35),
      (4, 'Hogar Inteligente & Cocina', 'home', 'bi-house-heart', 'Electrodomésticos, freidoras de aire, purificadores y smarthome', 50),
      (5, 'Calzado & Zapatillas', 'shoes', 'bi-lightning-charge', 'Zapatillas running, sneakers hype y calzado deportivo', 31),
      (6, 'Moda & Ropa Urbana', 'clothing', 'bi-bag-check', 'Chaquetas de cuero, hoodies streetwear y prendas denim', 48),
      (7, 'Belleza & Cuidado Personal', 'beauty', 'bi-stars', 'Perfumes de lujo, cuidado facial y estilismo profesional', 26),
      (8, 'Herramientas & Bricolaje', 'tools', 'bi-tools', 'Taladros inalámbricos, maletines de brocas y herramientas', 19)
      ON CONFLICT (id) DO UPDATE SET 
          name = EXCLUDED.name,
          slug = EXCLUDED.slug,
          icon = EXCLUDED.icon;
    `;
    await client.query(categoriesQuery);
    console.log('✅ Categorías 1 a 8 verificadas e insertadas en Supabase.');

    // 3. Clear existing old products to prevent SKU/ID conflicts and re-seed cleanly
    console.log('🔄 Limpiando registros antiguos y sembrando catálogo oficial completo...');
    // Delete cart_items referencing old products if any
    await client.query('DELETE FROM public.cart_items WHERE product_id NOT IN (SELECT id FROM public.products);').catch(() => {});
    
    // Upsert each product using ON CONFLICT (id)
    const categoryMap = {
      electronics: { id: 1, label: 'Tecnología & Gadgets' },
      audio: { id: 2, label: 'Audio & Sonido Pro' },
      gaming: { id: 3, label: 'Gaming & Consolas' },
      home: { id: 4, label: 'Hogar Inteligente & Cocina' },
      shoes: { id: 5, label: 'Calzado & Zapatillas' },
      clothing: { id: 6, label: 'Moda & Ropa Urbana' },
      beauty: { id: 7, label: 'Belleza & Cuidado Personal' },
      tools: { id: 8, label: 'Herramientas & Bricolaje' }
    };

    let processedCount = 0;

    for (const prod of initialCatalog) {
      const catInfo = categoryMap[prod.category] || { id: 1, label: 'General' };
      const catId = prod.categoryId || catInfo.id;
      const catSlug = prod.category || 'electronics';
      const catLabel = prod.categoryLabel || catInfo.label;
      const brand = prod.brand || (prod.name.split(' ')[0] || 'OmniStore');
      const price = parseFloat(prod.price) || 0;
      const origPrice = parseFloat(prod.originalPrice) || (price * 1.3);
      const costPrice = Math.round(price * 0.7);
      const discount = prod.discountPercent || Math.round(((origPrice - price) / origPrice) * 100);
      const stock = parseInt(prod.stock, 10) || 15;
      const stockLeft = prod.stockLeft || Math.min(stock, Math.round(stock * 0.35));
      const stockTotal = prod.stockTotal || (stock + 20);
      const status = prod.status || 'published';
      const rating = parseFloat(prod.rating) || 4.9;
      const reviewsCount = parseInt(prod.reviewsCount, 10) || 120;
      const salesCount = parseInt(prod.salesCount, 10) || 450;
      const isFlashDeal = Boolean(prod.isFlashDeal);
      const isBestSeller = Boolean(prod.isBestSeller);
      const hasFreeShipping = prod.hasFreeShipping !== undefined ? Boolean(prod.hasFreeShipping) : true;
      const badgeText = prod.badgeText || (isFlashDeal ? 'OFERTA FLASH' : 'DESTACADO');
      const image = prod.image || './assets/images/product-placeholder.svg';
      const colorsJson = JSON.stringify(prod.colors || ['Predeterminado']);
      const sizesJson = JSON.stringify(prod.sizes || []);
      const tagsJson = JSON.stringify(prod.tags || ['omnistore', 'cartagena']);
      const desc = prod.description || 'Producto disponible en OmniStore Colombia con envío rápido en Cartagena.';

      // Check if product with this ID or SKU exists
      const existing = await client.query('SELECT id, sku FROM public.products WHERE id = $1 OR sku = $2;', [prod.id, prod.sku]);
      
      if (existing.rows.length > 0) {
        // Update
        const targetId = existing.rows[0].id;
        const updateSql = `
          UPDATE public.products SET
            name = $1,
            sku = $2,
            category_id = $3,
            category_slug = $4,
            category_label = $5,
            brand = $6,
            price = $7,
            original_price = $8,
            cost_price = $9,
            discount_percent = $10,
            stock = $11,
            stock_left = $12,
            stock_total = $13,
            status = $14,
            rating = $15,
            reviews_count = $16,
            sales_count = $17,
            is_flash_deal = $18,
            is_best_seller = $19,
            has_free_shipping = $20,
            badge_text = $21,
            image = $22,
            colors = $23::jsonb,
            sizes = $24::jsonb,
            description = $25,
            tags = $26::jsonb,
            updated_at = NOW()
          WHERE id = $27;
        `;
        await client.query(updateSql, [
          prod.name,
          prod.sku,
          catId,
          catSlug,
          catLabel,
          brand,
          price,
          origPrice,
          costPrice,
          discount,
          stock,
          stockLeft,
          stockTotal,
          status,
          rating,
          reviewsCount,
          salesCount,
          isFlashDeal,
          isBestSeller,
          hasFreeShipping,
          badgeText,
          image,
          colorsJson,
          sizesJson,
          desc,
          tagsJson,
          targetId
        ]);
      } else {
        // Insert
        const insertSql = `
          INSERT INTO public.products (
            id, name, sku, category_id, category_slug, category_label, brand,
            price, original_price, cost_price, discount_percent, stock, stock_left, stock_total,
            status, rating, reviews_count, sales_count, is_flash_deal, is_best_seller,
            has_free_shipping, badge_text, image, colors, sizes, description, tags,
            created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7,
            $8, $9, $10, $11, $12, $13, $14,
            $15, $16, $17, $18, $19, $20,
            $21, $22, $23, $24::jsonb, $25::jsonb, $26, $27::jsonb,
            NOW(), NOW()
          );
        `;
        await client.query(insertSql, [
          prod.id,
          prod.name,
          prod.sku,
          catId,
          catSlug,
          catLabel,
          brand,
          price,
          origPrice,
          costPrice,
          discount,
          stock,
          stockLeft,
          stockTotal,
          status,
          rating,
          reviewsCount,
          salesCount,
          isFlashDeal,
          isBestSeller,
          hasFreeShipping,
          badgeText,
          image,
          colorsJson,
          sizesJson,
          desc,
          tagsJson
        ]);
      }

      processedCount++;
    }

    // 4. Update categories item_count
    await client.query(`
      UPDATE public.categories c
      SET item_count = (
        SELECT COUNT(*) FROM public.products p WHERE p.category_id = c.id
      );
    `);

    // 5. Verification count in Supabase
    const finalCountRes = await client.query('SELECT COUNT(*) FROM public.products;');
    const count = parseInt(finalCountRes.rows[0].count, 10);

    console.log(`\n🎉 ¡Inyección completada exitosamente!`);
    console.log(`📊 Total de productos procesados: ${processedCount}`);
    console.log(`✅ Total de productos activos en la tabla public.products de Supabase: ${count}`);

    // List categories and product count per category in DB
    const breakdownRes = await client.query(`
      SELECT category_slug, COUNT(*) as count 
      FROM public.products 
      GROUP BY category_slug 
      ORDER BY count DESC;
    `);
    console.log('\n📊 Desglose por categoría en Supabase:');
    breakdownRes.rows.forEach(r => {
      console.log(`  • ${r.category_slug}: ${r.count} productos`);
    });

  } catch (err) {
    console.error('❌ Error inyectando productos en Supabase:', err);
  } finally {
    await client.end();
  }
}

injectAllProducts();
