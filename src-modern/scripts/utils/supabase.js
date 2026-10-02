// ==============================================================================
// OmniStore - Supabase PostgreSQL Database Integration & Realtime Sync
// ==============================================================================

import { createClient } from '@supabase/supabase-js';

const STORAGE_CONFIG_KEY = 'omnistore_supabase_config';

let supabaseClient = null;
let realtimeChannel = null;

/**
 * Get current Supabase credentials from localStorage or Vite environment variables
 */
export function getSupabaseConfig() {
  try {
    const stored = localStorage.getItem(STORAGE_CONFIG_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.url && parsed.anonKey) {
        return {
          url: parsed.url.trim(),
          anonKey: parsed.anonKey.trim(),
          source: 'localStorage'
        };
      }
    }
  } catch (e) {
    console.warn('Error reading Supabase config from storage:', e);
  }

  // Fallback to Vite environment variables or default project URL
  const defaultProjectUrl = 'https://hbxxwodvhqkzfktldkbi.supabase.co';
  const envUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL ? import.meta.env.VITE_SUPABASE_URL.trim() : '') || defaultProjectUrl;
  const envKey = typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY ? import.meta.env.VITE_SUPABASE_ANON_KEY.trim() : '';

  if (envUrl && envKey && envUrl !== 'https://tu-proyecto.supabase.co' && !envUrl.includes('your-project')) {
    return {
      url: envUrl,
      anonKey: envKey,
      source: 'env'
    };
  }

  return { url: envUrl || defaultProjectUrl, anonKey: envKey, source: envKey ? 'env' : 'none' };
}

/**
 * Save Supabase credentials to localStorage and re-initialize client
 */
export function saveSupabaseConfig(url, anonKey) {
  try {
    const cleanUrl = (url || '').trim();
    const cleanKey = (anonKey || '').trim();

    if (!cleanUrl || !cleanKey) {
      localStorage.removeItem(STORAGE_CONFIG_KEY);
      supabaseClient = null;
      window.dispatchEvent(new CustomEvent('omnistore:supabase-status', { detail: { connected: false, mode: 'local' } }));
      return { success: true, connected: false };
    }

    localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify({ url: cleanUrl, anonKey: cleanKey }));
    initSupabaseClient(cleanUrl, cleanKey);
    window.dispatchEvent(new CustomEvent('omnistore:supabase-status', { detail: { connected: true, mode: 'supabase' } }));
    return { success: true, connected: true };
  } catch (e) {
    console.error('Error saving Supabase config:', e);
    return { success: false, error: e.message };
  }
}

/**
 * Remove Supabase configuration and revert to local storage mode
 */
export function disconnectSupabase() {
  localStorage.removeItem(STORAGE_CONFIG_KEY);
  supabaseClient = null;
  if (realtimeChannel) {
    realtimeChannel.unsubscribe();
    realtimeChannel = null;
  }
  window.dispatchEvent(new CustomEvent('omnistore:supabase-status', { detail: { connected: false, mode: 'local' } }));
}

/**
 * Initialize or get active Supabase client instance
 */
export function getSupabaseClient() {
  if (supabaseClient) return supabaseClient;
  const config = getSupabaseConfig();
  if (config.url && config.anonKey) {
    return initSupabaseClient(config.url, config.anonKey);
  }
  return null;
}

function initSupabaseClient(url, key) {
  try {
    supabaseClient = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    });
    return supabaseClient;
  } catch (e) {
    console.error('Failed to initialize Supabase client:', e);
    supabaseClient = null;
    return null;
  }
}

export function isSupabaseConnected() {
  const config = getSupabaseConfig();
  return Boolean(config.url && config.anonKey);
}

/**
 * Test connectivity against Supabase PostgreSQL
 */
export async function testSupabaseConnection(url, anonKey) {
  try {
    const testClient = createClient(url, anonKey);
    const { data, error } = await testClient.from('products').select('id').limit(1);
    if (error) {
      // Check if table missing
      if (error.code === '42P01') {
        return {
          success: false,
          error: 'Conectado a Supabase pero la tabla "products" no existe. Debes ejecutar el script supabase-schema.sql en el SQL Editor de Supabase.'
        };
      }
      return { success: false, error: error.message };
    }
    return { success: true, count: data ? data.length : 0 };
  } catch (e) {
    return { success: false, error: e.message || 'Error de red al conectar con Supabase' };
  }
}

// ==============================================================================
// Model Transformers (PostgreSQL snake_case <-> Frontend camelCase)
// ==============================================================================

export function mapProductFromDb(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    sku: row.sku,
    category: row.category,
    categoryLabel: row.category_label || row.category,
    price: parseFloat(row.price) || 0,
    originalPrice: row.original_price ? parseFloat(row.original_price) : null,
    discountPercent: row.discount_percent || 0,
    stock: row.stock !== undefined ? parseInt(row.stock, 10) : 0,
    stockLeft: row.stock_left !== undefined ? parseInt(row.stock_left, 10) : (row.stock || 0),
    stockTotal: row.stock_total !== undefined ? parseInt(row.stock_total, 10) : ((row.stock || 0) + 10),
    status: row.status || 'published',
    created: row.created_at ? row.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
    rating: parseFloat(row.rating) || 4.8,
    reviewsCount: row.reviews_count || 0,
    salesCount: row.sales_count || 0,
    isFlashDeal: Boolean(row.is_flash_deal),
    isBestSeller: Boolean(row.is_best_seller),
    hasFreeShipping: row.has_free_shipping !== undefined ? Boolean(row.has_free_shipping) : true,
    isFullShipping: row.is_full_shipping !== undefined ? Boolean(row.is_full_shipping) : true,
    badgeText: row.badge_text || '',
    image: row.image || './assets/images/product-placeholder.svg',
    colors: Array.isArray(row.colors) ? row.colors : (typeof row.colors === 'string' ? JSON.parse(row.colors) : ['Predeterminado']),
    sizes: Array.isArray(row.sizes) ? row.sizes : (typeof row.sizes === 'string' ? JSON.parse(row.sizes) : []),
    description: row.description || '',
    tags: Array.isArray(row.tags) ? row.tags : (typeof row.tags === 'string' ? JSON.parse(row.tags) : ['omnistore'])
  };
}

export function mapProductToDb(prod) {
  return {
    name: prod.name,
    sku: prod.sku,
    category: prod.category || 'electronics',
    category_label: prod.categoryLabel || prod.category || 'General',
    price: parseFloat(prod.price) || 0,
    original_price: prod.originalPrice ? parseFloat(prod.originalPrice) : null,
    discount_percent: prod.discountPercent || 0,
    stock: parseInt(prod.stock, 10) || 0,
    stock_left: prod.stockLeft !== undefined ? parseInt(prod.stockLeft, 10) : (parseInt(prod.stock, 10) || 0),
    stock_total: prod.stockTotal !== undefined ? parseInt(prod.stockTotal, 10) : ((parseInt(prod.stock, 10) || 0) + 15),
    status: prod.status || 'published',
    rating: parseFloat(prod.rating) || 4.8,
    reviews_count: prod.reviewsCount || 0,
    sales_count: prod.salesCount || 0,
    is_flash_deal: Boolean(prod.isFlashDeal),
    is_best_seller: Boolean(prod.isBestSeller),
    has_free_shipping: prod.hasFreeShipping !== undefined ? Boolean(prod.hasFreeShipping) : true,
    is_full_shipping: prod.isFullShipping !== undefined ? Boolean(prod.isFullShipping) : true,
    badge_text: prod.badgeText || '',
    image: prod.image || './assets/images/product-placeholder.svg',
    colors: prod.colors || ['Predeterminado'],
    sizes: prod.sizes || [],
    description: prod.description || '',
    tags: prod.tags || ['omnistore']
  };
}

export function mapOrderFromDb(row) {
  if (!row) return null;
  return {
    id: row.id,
    orderNumber: row.order_number,
    customer: {
      name: row.customer_name,
      email: row.customer_email,
      phone: row.customer_phone || '',
      avatar: row.customer_avatar || './assets/images/avatar-placeholder.svg'
    },
    items: Array.isArray(row.items) ? row.items : (typeof row.items === 'string' ? JSON.parse(row.items) : []),
    itemCount: row.item_count || 1,
    total: parseFloat(row.total) || 0,
    status: row.status || 'pending',
    orderDate: row.order_date || (row.created_at ? row.created_at.split('T')[0] : new Date().toISOString().split('T')[0]),
    shippingAddress: row.shipping_address || ''
  };
}

export function mapOrderToDb(order) {
  return {
    order_number: order.orderNumber,
    customer_name: order.customer?.name || 'Cliente',
    customer_email: order.customer?.email || 'cliente@ejemplo.com',
    customer_phone: order.customer?.phone || '',
    customer_avatar: order.customer?.avatar || './assets/images/avatar-placeholder.svg',
    shipping_address: order.shippingAddress || 'No especificada',
    shipping_city: order.shippingCity || 'Madrid',
    shipping_zip: order.shippingZip || '',
    payment_method: order.paymentMethod || 'card',
    item_count: order.itemCount || 1,
    total: parseFloat(order.total) || 0,
    status: order.status || 'pending',
    items: order.items || []
  };
}

// ==============================================================================
// Database Queries & Realtime Operations
// ==============================================================================

/**
 * Fetch products from Supabase PostgreSQL
 */
export async function fetchProductsSupabase() {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('products')
      .select('*')
      .order('id', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapProductFromDb);
  } catch (e) {
    console.error('Supabase fetchProducts error:', e);
    return null;
  }
}

/**
 * Insert or update product in Supabase
 */
export async function upsertProductSupabase(productData) {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const dbPayload = mapProductToDb(productData);
    if (productData.id && typeof productData.id === 'number') {
      const { data, error } = await client
        .from('products')
        .update(dbPayload)
        .eq('id', productData.id)
        .select()
        .single();
      if (error) throw error;
      return mapProductFromDb(data);
    } else {
      const { data, error } = await client
        .from('products')
        .insert([dbPayload])
        .select()
        .single();
      if (error) throw error;
      return mapProductFromDb(data);
    }
  } catch (e) {
    console.error('Supabase upsertProduct error:', e);
    throw e;
  }
}

/**
 * Delete product in Supabase
 */
export async function deleteProductSupabase(id) {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client
      .from('products')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  } catch (e) {
    console.error('Supabase deleteProduct error:', e);
    return false;
  }
}

/**
 * Fetch orders from Supabase PostgreSQL
 */
export async function fetchOrdersSupabase() {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('orders')
      .select('*')
      .order('id', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapOrderFromDb);
  } catch (e) {
    console.error('Supabase fetchOrders error:', e);
    return null;
  }
}

/**
 * Insert order into Supabase
 */
export async function insertOrderSupabase(orderData) {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const dbPayload = mapOrderToDb(orderData);
    const { data, error } = await client
      .from('orders')
      .insert([dbPayload])
      .select()
      .single();

    if (error) throw error;
    return mapOrderFromDb(data);
  } catch (e) {
    console.error('Supabase insertOrder error:', e);
    throw e;
  }
}

/**
 * Update order status in Supabase
 */
export async function updateOrderStatusSupabase(orderId, newStatus) {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;
    return mapOrderFromDb(data);
  } catch (e) {
    console.error('Supabase updateOrderStatus error:', e);
    return null;
  }
}

/**
 * Upload entire local catalog to Supabase if PostgreSQL tables are empty
 */
export async function syncLocalToSupabase(localProducts, localOrders) {
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'No conectado a Supabase' };

  try {
    // 1. Sync Products
    const productsPayload = (localProducts || []).map(p => {
      const mapped = mapProductToDb(p);
      return mapped;
    });

    if (productsPayload.length > 0) {
      const { error: pError } = await client
        .from('products')
        .upsert(productsPayload, { onConflict: 'sku' });
      if (pError) throw pError;
    }

    // 2. Sync Orders
    const ordersPayload = (localOrders || []).map(o => mapOrderToDb(o));
    if (ordersPayload.length > 0) {
      const { error: oError } = await client
        .from('orders')
        .upsert(ordersPayload, { onConflict: 'order_number' });
      if (oError) throw oError;
    }

    return { success: true, productsCount: productsPayload.length, ordersCount: ordersPayload.length };
  } catch (e) {
    console.error('Error syncing local data to Supabase:', e);
    return { success: false, error: e.message };
  }
}

/**
 * Setup Realtime WebSockets subscriptions on Supabase PostgreSQL
 */
export function initSupabaseRealtime(onCatalogUpdate, onOrdersUpdate) {
  const client = getSupabaseClient();
  if (!client) return null;

  if (realtimeChannel) {
    realtimeChannel.unsubscribe();
  }

  realtimeChannel = client
    .channel('omnistore-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, async () => {
      if (onCatalogUpdate) {
        const freshProducts = await fetchProductsSupabase();
        if (freshProducts) onCatalogUpdate(freshProducts);
      }
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, async () => {
      if (onOrdersUpdate) {
        const freshOrders = await fetchOrdersSupabase();
        if (freshOrders) onOrdersUpdate(freshOrders);
      }
    })
    .subscribe();

  return realtimeChannel;
}
