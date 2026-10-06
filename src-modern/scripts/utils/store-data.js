// ==========================================================================
// OmniStore Shared Central Data Store (Hybrid PostgreSQL & LocalStorage)
// Synchronizes Products Catalog and Orders between Admin Panel & Marketplace
// Powered by Supabase PostgreSQL with Realtime WebSockets sync
// ==========================================================================

import {
  isSupabaseConnected,
  fetchProductsSupabase,
  upsertProductSupabase,
  deleteProductSupabase,
  fetchOrdersSupabase,
  insertOrderSupabase,
  updateOrderStatusSupabase,
  initSupabaseRealtime
} from './supabase.js';

export const CATEGORY_DEFAULT_IMAGES = {
  electronics: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=80',
  audio: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80',
  gaming: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=600&auto=format&fit=crop&q=80',
  home: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600&auto=format&fit=crop&q=80',
  shoes: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80',
  clothing: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&auto=format&fit=crop&q=80',
  beauty: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&auto=format&fit=crop&q=80',
  tools: 'https://images.unsplash.com/photo-1581147036324-c17ac41dfa6c?w=600&auto=format&fit=crop&q=80',
  books: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80'
};

export function resolveProductImage(product) {
  if (!product) return CATEGORY_DEFAULT_IMAGES.electronics;
  if (product.image && typeof product.image === 'string' && !product.image.includes('placeholder') && (product.image.startsWith('http') || product.image.startsWith('data:'))) {
    return product.image;
  }
  const cat = (product.category || product.categorySlug || 'electronics').toLowerCase();
  return CATEGORY_DEFAULT_IMAGES[cat] || CATEGORY_DEFAULT_IMAGES.electronics;
}

export const INITIAL_CATALOG = [
  {
    id: 101,
    name: 'Apple iPhone 16 Pro Max 256GB Titanio Natural (Chip A18 Pro)',
    sku: 'APPLE-IPHONE-16PM-256',
    category: 'electronics',
    categoryLabel: 'Smartphones & Tech',
    categoryId: 1,
    price: 5899000,
    originalPrice: 6899000,
    discountPercent: 14,
    stock: 45,
    status: 'published',
    created: '2026-01-15',
    rating: 4.9,
    reviewsCount: 4890,
    salesCount: 16500,
    isFlashDeal: true,
    isBestSeller: true,
    hasFreeShipping: true,
    isFullShipping: true,
    stockLeft: 12,
    stockTotal: 100,
    badgeText: 'TOP 1 VENTAS',
    image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&auto=format&fit=crop&q=80',
    colors: ['Titanio Natural', 'Titanio Desierto', 'Titanio Negro', 'Titanio Blanco'],
    sizes: ['256 GB', '512 GB', '1 TB'],
    description: 'Chip A18 Pro con GPU de 6 núcleos y Ray Tracing por hardware. Pantalla Super Retina XDR OLED de 6.9" 120Hz ProMotion con bordes más finos. Cámara Fusion de 48 MP con zoom óptico 5x y nuevo botón de Control de Cámara.',
    tags: ['iphone', 'apple', 'smartphone', 'a18', 'titanio', 'celulares', 'colombia']
  },
  {
    id: 102,
    name: 'Samsung Galaxy S25 Ultra 512GB Galaxy AI Titanium Black',
    sku: 'SAMS-S25U-512-TI',
    category: 'electronics',
    categoryLabel: 'Smartphones & Tech',
    categoryId: 1,
    price: 5999000,
    originalPrice: 6999000,
    discountPercent: 14,
    stock: 38,
    status: 'published',
    created: '2026-01-20',
    rating: 4.9,
    reviewsCount: 3950,
    salesCount: 14200,
    isFlashDeal: true,
    isBestSeller: true,
    hasFreeShipping: true,
    isFullShipping: true,
    stockLeft: 8,
    stockTotal: 80,
    badgeText: 'GALAXY AI',
    image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600&auto=format&fit=crop&q=80',
    colors: ['Titanium Black', 'Titanium Gray', 'Titanium Silver', 'Titanium Violet'],
    sizes: ['256 GB', '512 GB', '1 TB'],
    description: 'Procesador Snapdragon 8 Elite con IA generativa Galaxy AI integrada. Pantalla Dynamic AMOLED 2X 6.8" 120Hz antirreflejos Corning Gorilla Armor. Cámara cuádruple 200MP con Space Zoom 100x y S-Pen integrado.',
    tags: ['samsung', 'galaxy', 's25', 'ai', 'smartphone', 'celulares']
  },
  {
    id: 103,
    name: 'Xiaomi 14 Ultra 512GB Leica Quad-Camera Master Edition',
    sku: 'XIAOMI-14U-512',
    category: 'electronics',
    categoryLabel: 'Smartphones & Tech',
    categoryId: 1,
    price: 4699000,
    originalPrice: 5499000,
    discountPercent: 15,
    stock: 28,
    status: 'published',
    created: '2026-02-01',
    rating: 4.8,
    reviewsCount: 2150,
    salesCount: 7800,
    isFlashDeal: false,
    isBestSeller: false,
    hasFreeShipping: true,
    isFullShipping: true,
    stockLeft: 14,
    stockTotal: 60,
    badgeText: 'LEICA OPTICS',
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=80',
    colors: ['Negro Cuero Vegano', 'Blanco Cerámica'],
    sizes: ['512 GB', '1 TB'],
    description: 'Sensor principal Sony LYT-900 de 1 pulgada con apertura variable continua f/1.63 a f/4.0. Óptica Leica Summilux en 4 cámaras de 50MP. Pantalla AMOLED WQHD+ 120Hz y carga ultra rápida HyperCharge 90W.',
    tags: ['xiaomi', 'leica', 'camara', 'smartphone', 'android']
  },
  {
    id: 104,
    name: 'Google Pixel 9 Pro XL 256GB Tensor G4 con Gemini Nano Pro',
    sku: 'GOOG-PIXEL9P-256',
    category: 'electronics',
    categoryLabel: 'Smartphones & Tech',
    categoryId: 1,
    price: 4299000,
    originalPrice: 4999000,
    discountPercent: 14,
    stock: 34,
    status: 'published',
    created: '2026-02-05',
    rating: 4.8,
    reviewsCount: 1890,
    salesCount: 6400,
    isFlashDeal: true,
    isBestSeller: false,
    hasFreeShipping: true,
    isFullShipping: true,
    stockLeft: 9,
    stockTotal: 50,
    badgeText: 'GEMINI IA',
    image: 'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=600&auto=format&fit=crop&q=80',
    colors: ['Obsidian', 'Porcelain', 'Hazel', 'Rose Quartz'],
    sizes: ['128 GB', '256 GB', '512 GB'],
    description: 'Procesador Google Tensor G4 optimizado para modelos multimodales Gemini en el dispositivo. Pantalla Super Actua OLED 6.8" 1-120Hz LTPO. Fotografía computacional líder con HDR+ avanzado y Magic Editor.',
    tags: ['google', 'pixel', 'gemini', 'ai', 'android']
  },
  {
    id: 105,
    name: 'Apple MacBook Pro 16" M3 Max 36GB RAM 1TB SSD Negro Espacial',
    sku: 'APPLE-MBP16-M3MAX',
    category: 'electronics',
    categoryLabel: 'Portátiles & Laptops',
    categoryId: 1,
    price: 15499000,
    originalPrice: 17299000,
    discountPercent: 10,
    stock: 18,
    status: 'published',
    created: '2026-01-10',
    rating: 5.0,
    reviewsCount: 1240,
    salesCount: 3890,
    isFlashDeal: false,
    isBestSeller: true,
    hasFreeShipping: true,
    isFullShipping: true,
    stockLeft: 4,
    stockTotal: 30,
    badgeText: 'PRO WORKSTATION',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=80',
    colors: ['Negro Espacial', 'Plata Clásica'],
    sizes: ['36GB / 1TB', '48GB / 1TB', '128GB / 2TB'],
    description: 'Potencia descomunal para renders 3D, desarrollo de software e inteligencia artificial. Pantalla Liquid Retina XDR de 16.2" con 1600 nits pico, sistema de 6 altavoces con audio espacial y hasta 22 horas de autonomía.',
    tags: ['macbook', 'apple', 'm3max', 'laptop', 'pro', 'computadores']
  },
  {
    id: 106,
    name: 'ASUS ROG Zephyrus G16 OLED Core Ultra 9 RTX 4080 32GB RAM',
    sku: 'ASUS-ROG-G16-4080',
    category: 'gaming',
    categoryLabel: 'Portátiles Gaming',
    categoryId: 3,
    price: 11899000,
    originalPrice: 13499000,
    discountPercent: 12,
    stock: 22,
    status: 'published',
    created: '2026-01-25',
    rating: 4.9,
    reviewsCount: 960,
    salesCount: 2950,
    isFlashDeal: true,
    isBestSeller: true,
    hasFreeShipping: true,
    isFullShipping: true,
    stockLeft: 6,
    stockTotal: 40,
    badgeText: 'GAMER PRO',
    image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600&auto=format&fit=crop&q=80',
    colors: ['Eclipse Gray', 'Platinum White'],
    sizes: ['1TB PCIe 4.0', '2TB PCIe 4.0'],
    description: 'Procesador Intel Core Ultra 9 185H con NPU para IA, tarjeta gráfica NVIDIA GeForce RTX 4080 12GB GDDR6, pantalla ROG Nebula OLED 2.5K 240Hz 0.2ms con G-SYNC y chasis de aluminio CNC ultrafino.',
    tags: ['asus', 'rog', 'rtx4080', 'gaming', 'laptop', 'gamer']
  },
  {
    id: 107,
    name: 'Dell XPS 15 InfinityEdge OLED Intel i9 32GB RAM 1TB SSD',
    sku: 'DELL-XPS15-9530',
    category: 'electronics',
    categoryLabel: 'Portátiles & Laptops',
    categoryId: 1,
    price: 8999000,
    originalPrice: 10499000,
    discountPercent: 14,
    stock: 26,
    status: 'published',
    created: '2026-02-12',
    rating: 4.7,
    reviewsCount: 840,
    salesCount: 2400,
    isFlashDeal: false,
    isBestSeller: false,
    hasFreeShipping: true,
    isFullShipping: true,
    stockLeft: 11,
    stockTotal: 45,
    badgeText: 'CREADORES',
    image: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&auto=format&fit=crop&q=80',
    colors: ['Plata Platino / Fibra de Carbono'],
    sizes: ['32GB RAM / 1TB SSD', '64GB RAM / 2TB SSD'],
    description: 'Intel Core i9-13900H de 14 núcleos, pantalla táctil OLED 3.5K (3456x2160) 100% DCI-P3 con bordes mínimos InfinityEdge, tarjeta gráfica NVIDIA GeForce RTX 4060 y teclado retroiluminado con lector de huellas.',
    tags: ['dell', 'xps', 'laptop', 'oled', 'ultrabook']
  },
  {
    id: 108,
    name: 'Sony WH-1000XM5 Auriculares Over-Ear Cancelación de Ruido Hi-Res',
    sku: 'SONY-WH1000XM5-BLK',
    category: 'audio',
    categoryLabel: 'Audio & Sonido',
    categoryId: 2,
    price: 1649000,
    originalPrice: 1899000,
    discountPercent: 13,
    stock: 55,
    status: 'published',
    created: '2026-01-18',
    rating: 4.9,
    reviewsCount: 6840,
    salesCount: 21500,
    isFlashDeal: true,
    isBestSeller: true,
    hasFreeShipping: true,
    isFullShipping: true,
    stockLeft: 14,
    stockTotal: 120,
    badgeText: 'BEST SOUND',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80',
    colors: ['Negro Mate', 'Plata Platino', 'Azul Medianoche'],
    sizes: ['Estuche Incluido'],
    description: 'Cancelación de ruido líder con 8 micrófonos y procesadores V1 y QN1 dedicados. Códec LDAC para audio en alta resolución inalámbrico, 30 horas de batería con carga rápida (3 min = 3 horas de uso) y modo Speak-to-Chat.',
    tags: ['sony', 'auriculares', 'anc', 'audio', 'bluetooth', 'musica']
  },
  {
    id: 109,
    name: 'Apple AirPods Pro 2da Generación con Estuche MagSafe USB-C',
    sku: 'APPLE-AIRPODS-PRO2',
    category: 'audio',
    categoryLabel: 'Audio & Sonido',
    categoryId: 2,
    price: 999000,
    originalPrice: 1249000,
    discountPercent: 20,
    stock: 64,
    status: 'published',
    created: '2026-02-02',
    rating: 4.8,
    reviewsCount: 8900,
    salesCount: 29800,
    isFlashDeal: true,
    isBestSeller: true,
    hasFreeShipping: true,
    isFullShipping: true,
    stockLeft: 19,
    stockTotal: 150,
    badgeText: 'SUPER OFERTA',
    image: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=600&auto=format&fit=crop&q=80',
    colors: ['Blanco Puro'],
    sizes: ['Almohadillas XS, S, M, L'],
    description: 'Chip H2 de Apple con Cancelación Activa de Ruido 2x más potente, modo Audio Adaptativo inteligente, Audio Espacial personalizado con seguimiento dinámico de cabeza, resistencia IP54 al polvo y agua y estuche USB-C con altavoz de localización.',
    tags: ['apple', 'airpods', 'tws', 'audio', 'bluetooth']
  },
  {
    id: 110,
    name: 'Bose QuietComfort Ultra Headphones con Audio Espacial Inmersivo',
    sku: 'BOSE-QC-ULTRA-BLK',
    category: 'audio',
    categoryLabel: 'Audio & Sonido',
    categoryId: 2,
    price: 1799000,
    originalPrice: 2049000,
    discountPercent: 12,
    stock: 35,
    status: 'published',
    created: '2026-02-14',
    rating: 4.8,
    reviewsCount: 2300,
    salesCount: 7100,
    isFlashDeal: false,
    isBestSeller: false,
    hasFreeShipping: true,
    isFullShipping: true,
    stockLeft: 10,
    stockTotal: 60,
    badgeText: 'AUDIO ESPACIAL',
    image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&auto=format&fit=crop&q=80',
    colors: ['Negro Intenso', 'Blanco Humo', 'Arenisca Lunar'],
    sizes: [],
    description: 'Tecnología Bose Immersive Audio pionera en audio espacial. Tecnología CustomTune que adapta el sonido a la acústica de tus oídos, modo Silencio, modo Consciente con ActiveSense y hasta 24 horas de batería.',
    tags: ['bose', 'quietcomfort', 'audio', 'auriculares', 'anc']
  },
  {
    id: 111,
    name: 'Altavoz Bluetooth Portátil JBL Charge 5 Resistente al Agua IP67',
    sku: 'JBL-CHARGE5-BLU',
    category: 'audio',
    categoryLabel: 'Audio & Sonido',
    categoryId: 2,
    price: 649000,
    originalPrice: 799000,
    discountPercent: 19,
    stock: 48,
    status: 'published',
    created: '2026-02-20',
    rating: 4.9,
    reviewsCount: 5410,
    salesCount: 18200,
    isFlashDeal: true,
    isBestSeller: true,
    hasFreeShipping: true,
    isFullShipping: true,
    stockLeft: 15,
    stockTotal: 90,
    badgeText: 'RESISTENTE IP67',
    image: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=600&auto=format&fit=crop&q=80',
    colors: ['Azul Océano', 'Negro Stealth', 'Rojo Fuego', 'Camuflaje'],
    sizes: [],
    description: 'Driver optimizado de gran amplitud, tweeter independiente y dos radiadores de bajos pasivos JBL. 20 horas de autonomía, función Powerbank integrada para cargar tu smartphone y PartyBoost para conectar múltiples altavoces.',
    tags: ['jbl', 'altavoz', 'bluetooth', 'musica', 'fiesta', 'ip67']
  },
  {
    id: 112,
    name: 'Micrófono Shure SM7B Cardioide Dinámico Profesional para Estudio',
    sku: 'SHURE-SM7B-STUDIO',
    category: 'audio',
    categoryLabel: 'Audio & Sonido',
    categoryId: 2,
    price: 1850000,
    originalPrice: 2350000,
    discountPercent: 21,
    stock: 20,
    status: 'published',
    created: '2026-02-25',
    rating: 5.0,
    reviewsCount: 3120,
    salesCount: 8900,
    isFlashDeal: false,
    isBestSeller: true,
    hasFreeShipping: true,
    isFullShipping: true,
    stockLeft: 5,
    stockTotal: 40,
    badgeText: 'ESTUDIO PRO',
    image: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=600&auto=format&fit=crop&q=80',
    colors: ['Negro Mate Estudio'],
    sizes: ['Con Filtro Antipop Incluido'],
    description: 'El micrófono de referencia mundial para podcasts, streaming, transmisiones de radio y voces profesionales. Blindaje electromagnético avanzado contra ruidos e interferencias de monitores de ordenador y suspensión interna por aire.',
    tags: ['shure', 'microfono', 'podcast', 'streaming', 'estudio', 'audio']
  },
  {
    id: 113,
    name: 'PlayStation 5 Pro Console 2TB SSD 4K 120Hz Ray Tracing PSSR',
    sku: 'SONY-PS5-PRO-2TB',
    category: 'gaming',
    categoryLabel: 'Consolas & Gaming',
    categoryId: 3,
    price: 3699000,
    originalPrice: 4199000,
    discountPercent: 12,
    stock: 30,
    status: 'published',
    created: '2026-01-08',
    rating: 4.9,
    reviewsCount: 7120,
    salesCount: 22400,
    isFlashDeal: true,
    isBestSeller: true,
    hasFreeShipping: true,
    isFullShipping: true,
    stockLeft: 7,
    stockTotal: 80,
    badgeText: 'NUEVA GENERACIÓN',
    image: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=600&auto=format&fit=crop&q=80',
    colors: ['Blanco & Negro Clásico'],
    sizes: ['2TB SSD'],
    description: 'GPU con 67% más de unidades de cálculo y tecnología PlayStation Spectral Super Resolution (PSSR con IA). Ray Tracing avanzado a 60/120 FPS estables, SSD NVMe de 2TB de ultra alta velocidad y mando inalámbrico DualSense con gatillos adaptativos.',
    tags: ['playstation', 'ps5', 'ps5pro', 'sony', 'gaming', 'consolas']
  },
  {
    id: 114,
    name: 'Nintendo Switch OLED Modelo Edición Mario Red',
    sku: 'NINT-SWITCH-OLED-RED',
    category: 'gaming',
    categoryLabel: 'Consolas & Gaming',
    categoryId: 3,
    price: 1599000,
    originalPrice: 1749000,
    discountPercent: 9,
    stock: 42,
    status: 'published',
    created: '2026-02-10',
    rating: 4.8,
    reviewsCount: 4500,
    salesCount: 16900,
    isFlashDeal: false,
    isBestSeller: true,
    hasFreeShipping: true,
    isFullShipping: true,
    stockLeft: 18,
    stockTotal: 90,
    badgeText: 'EDICIÓN ESPECIAL',
    image: 'https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=600&auto=format&fit=crop&q=80',
    colors: ['Mario Red Neón', 'Blanco OLED'],
    sizes: ['64GB Internos'],
    description: 'Pantalla OLED vibrante de 7 pulgadas con negros puros y colores intensos. Soporte ajustable ancho para modo sobremesa, base con puerto LAN Ethernet por cable, 64GB de almacenamiento interno y audio estéreo optimizado.',
    tags: ['nintendo', 'switch', 'mario', 'oled', 'gaming', 'portatil']
  },
  {
    id: 115,
    name: 'Consola Xbox Series X 1TB All-Digital Robot White',
    sku: 'MSFT-XBOX-SX-WHITE',
    category: 'gaming',
    categoryLabel: 'Consolas & Gaming',
    categoryId: 3,
    price: 2499000,
    originalPrice: 2799000,
    discountPercent: 11,
    stock: 25,
    status: 'published',
    created: '2026-02-18',
    rating: 4.8,
    reviewsCount: 3100,
    salesCount: 9200,
    isFlashDeal: true,
    isBestSeller: false,
    hasFreeShipping: true,
    isFullShipping: true,
    stockLeft: 8,
    stockTotal: 50,
    badgeText: '12 TFLOPS',
    image: 'https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=600&auto=format&fit=crop&q=80',
    colors: ['Robot White', 'Carbon Black'],
    sizes: ['1TB SSD'],
    description: '12 Teraflops de potencia de cálculo gráfico en arquitectura Xbox Velocity. Carga ultra rápida con Quick Resume para saltar entre múltiples juegos al instante, 4K nativo hasta 120 FPS y compatibilidad con miles de títulos de 4 generaciones.',
    tags: ['xbox', 'seriesx', 'microsoft', 'gaming', 'consolas', 'gamepass']
  },
  {
    id: 116,
    name: 'Consola Portátil ASUS ROG Ally X 1TB AMD Ryzen Z1 Extreme 24GB',
    sku: 'ASUS-ROG-ALLYX-1TB',
    category: 'gaming',
    categoryLabel: 'Consolas & Gaming',
    categoryId: 3,
    price: 3899000,
    originalPrice: 4199000,
    discountPercent: 7,
    stock: 20,
    status: 'published',
    created: '2026-02-22',
    rating: 4.9,
    reviewsCount: 1650,
    salesCount: 4300,
    isFlashDeal: false,
    isBestSeller: true,
    hasFreeShipping: true,
    isFullShipping: true,
    stockLeft: 4,
    stockTotal: 30,
    badgeText: 'HANDHELD TOP',
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80',
    colors: ['Negro Mate Gamer'],
    sizes: ['1TB SSD M.2 2280'],
    description: 'Procesador AMD Ryzen Z1 Extreme con gráficos RDNA 3, 24GB de memoria RAM LPDDR5X-7500, SSD NVMe de 1TB, batería descomunal de 80Wh (el doble de autonomía), pantalla Full HD 120Hz 500 nits con FreeSync Premium y Windows 11.',
    tags: ['asus', 'rogally', 'handheld', 'ryzen', 'pcgaming', 'portatil']
  },
  {
    id: 117,
    name: 'Apple Watch Ultra 2 Caja de Titanio 49mm GPS + Cellular',
    sku: 'APPLE-WATCH-ULTRA2',
    category: 'electronics',
    categoryLabel: 'Smartwatches & Tech',
    categoryId: 1,
    price: 3899000,
    originalPrice: 4199000,
    discountPercent: 7,
    stock: 35,
    status: 'published',
    created: '2026-01-12',
    rating: 4.9,
    reviewsCount: 3820,
    salesCount: 11200,
    isFlashDeal: true,
    isBestSeller: true,
    hasFreeShipping: true,
    isFullShipping: true,
    stockLeft: 9,
    stockTotal: 70,
    badgeText: 'TITANIO 49MM',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
    colors: ['Titanio Natural / Trail Loop Naranja', 'Titanio / Alpine Loop Verde', 'Titanio / Ocean Loop Azul'],
    sizes: ['49mm'],
    description: 'Caja de titanio de grado aeroespacial resistente a la corrosión con pantalla Always-On Retina de 3000 nits pico. Chip S9 SiP con gesto de doble toque, GPS de doble frecuencia y alta precisión, profundímetro para inmersiones hasta 40 metros y hasta 72 horas de batería.',
    tags: ['apple', 'watch', 'ultra2', 'smartwatch', 'fitness', 'gps']
  },
  {
    id: 118,
    name: 'Garmin Fenix 7 Pro Sapphire Solar GPS Multideporte Outdoor',
    sku: 'GARMIN-FENIX7P-SOLAR',
    category: 'electronics',
    categoryLabel: 'Smartwatches & Tech',
    categoryId: 1,
    price: 3499000,
    originalPrice: 3999000,
    discountPercent: 13,
    stock: 22,
    status: 'published',
    created: '2026-01-28',
    rating: 5.0,
    reviewsCount: 1950,
    salesCount: 5600,
    isFlashDeal: false,
    isBestSeller: false,
    hasFreeShipping: true,
    isFullShipping: true,
    stockLeft: 6,
    stockTotal: 40,
    badgeText: 'SOLAR CHARGE',
    image: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=600&auto=format&fit=crop&q=80',
    colors: ['Carbon Gray DLC Titanio', 'Titanio Mineral'],
    sizes: ['47mm', '51mm'],
    description: 'Lente de carga solar Power Sapphire ultrarresistente que ofrece hasta 37 días de autonomía en modo reloj inteligente. Linterna LED integrada, mapas TopoActive preinstalados, métricas avanzadas de entrenamiento y sensor de pulso óptico Gen 5 con ECG.',
    tags: ['garmin', 'fenix7', 'smartwatch', 'solar', 'trail', 'deportes']
  },
  {
    id: 119,
    name: 'Drone DJI Mini 4 Pro Fly More Combo con Mando DJI RC 2 4K HDR',
    sku: 'DJI-MINI4P-COMBO-RC2',
    category: 'electronics',
    categoryLabel: 'Drones & Cámaras',
    categoryId: 1,
    price: 4799000,
    originalPrice: 5399000,
    discountPercent: 11,
    stock: 24,
    status: 'published',
    created: '2026-02-08',
    rating: 4.9,
    reviewsCount: 2890,
    salesCount: 8400,
    isFlashDeal: true,
    isBestSeller: true,
    hasFreeShipping: true,
    isFullShipping: true,
    stockLeft: 7,
    stockTotal: 50,
    badgeText: '4K/60FPS HDR',
    image: 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=600&auto=format&fit=crop&q=80',
    colors: ['Gris Claro DJI'],
    sizes: ['Fly More Combo + 3 Baterías'],
    description: 'Menos de 249 gramos de peso (no requiere examen en la mayoría de países). Detección de obstáculos omnidireccional con sensores de visión infrarroja, grabación vertical nativa 4K/60fps HDR y cámara lenta 4K/100fps, transmisión de vídeo FHD DJI O4 a 20 km y 34 minutos por batería.',
    tags: ['dji', 'drone', 'mini4pro', 'camara', 'video', '4k']
  },
  {
    id: 120,
    name: 'Cámara Mirrorless Sony Alpha 7 IV Full Frame 33MP 4K/60p',
    sku: 'SONY-A7M4-BODY',
    category: 'electronics',
    categoryLabel: 'Drones & Cámaras',
    categoryId: 1,
    price: 10999000,
    originalPrice: 11999000,
    discountPercent: 8,
    stock: 15,
    status: 'published',
    created: '2026-02-11',
    rating: 4.9,
    reviewsCount: 1420,
    salesCount: 3900,
    isFlashDeal: false,
    isBestSeller: true,
    hasFreeShipping: true,
    isFullShipping: true,
    stockLeft: 3,
    stockTotal: 25,
    badgeText: 'CINEMA LINE',
    image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&auto=format&fit=crop&q=80',
    colors: ['Negro Mate Profesional'],
    sizes: ['Cuerpo Solo', 'Kit con Lente 28-70mm'],
    description: 'Sensor CMOS Exmor R retroiluminado de formato completo (Full-Frame) de 33 MP. Procesador BIONZ XR con IA para seguimiento de enfoque automático al ojo en humanos, aves y animales en tiempo real. Grabación 4K 60p en 10 bits 4:2:2 y estabilización óptica en el cuerpo de 5.5 pasos.',
    tags: ['sony', 'alpha', 'camara', 'mirrorless', 'fotografia', '4k']
  },
  {
    id: 121,
    name: 'Monitor Gamer LG UltraGear 27" OLED 240Hz 0.03ms QHD G-Sync',
    sku: 'LG-27GR95QE-OLED',
    category: 'electronics',
    categoryLabel: 'Monitores & Periféricos',
    categoryId: 1,
    price: 3799000,
    originalPrice: 4599000,
    discountPercent: 17,
    stock: 30,
    status: 'published',
    created: '2026-01-30',
    rating: 4.9,
    reviewsCount: 2180,
    salesCount: 6700,
    isFlashDeal: true,
    isBestSeller: true,
    hasFreeShipping: true,
    isFullShipping: true,
    stockLeft: 8,
    stockTotal: 60,
    badgeText: 'OLED 240HZ',
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&auto=format&fit=crop&q=80',
    colors: ['Negro / Iluminación RGB Hexagon'],
    sizes: ['27 Pulgadas QHD'],
    description: 'Panel OLED con resolución QHD (2560 x 1440) y un tiempo de respuesta récord de 0.03ms (GtG). Frecuencia de actualización vertiginosa de 240Hz, contraste infinito de 1,500,000:1, cobertura de color DCI-P3 98.5% y compatibilidad con NVIDIA G-SYNC y AMD FreeSync Premium Pro.',
    tags: ['monitor', 'lg', 'ultragear', 'oled', '240hz', 'gaming', 'pantalla']
  },
  {
    id: 122,
    name: 'Teclado Mecánico Custom Keychron Q1 Pro RGB Inalámbrico Hot-Swap',
    sku: 'KEYCHRON-Q1PRO-RGB',
    category: 'gaming',
    categoryLabel: 'Monitores & Periféricos',
    categoryId: 3,
    price: 949000,
    originalPrice: 1099000,
    discountPercent: 14,
    stock: 38,
    status: 'published',
    created: '2026-02-15',
    rating: 4.9,
    reviewsCount: 3450,
    salesCount: 11500,
    isFlashDeal: true,
    isBestSeller: true,
    hasFreeShipping: true,
    isFullShipping: true,
    stockLeft: 11,
    stockTotal: 70,
    badgeText: 'ALUMINIO CNC',
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80',
    colors: ['Carbon Black', 'Silver Grey', 'Shell White'],
    sizes: ['Red Linear Switch', 'Brown Tactile Switch', 'Banana Switch'],
    description: 'Chasis completo de aluminio CNC 6063 con diseño de doble junta amortiguadora (Double-Gasket Mount) para una acústica de pulsación prémium. Switches lubricados intercambiables en caliente (Hot-Swap), Bluetooth 5.1 + USB-C y programación total con QMK/VIA.',
    tags: ['teclado', 'keychron', 'mecanico', 'rgb', 'custom', 'perifericos']
  },
  {
    id: 123,
    name: 'Ratón Inalámbrico Ergonómico Logitech MX Master 3S 8K DPI USB-C',
    sku: 'LOGI-MXMASTER-3S',
    category: 'electronics',
    categoryLabel: 'Monitores & Periféricos',
    categoryId: 1,
    price: 479000,
    originalPrice: 569000,
    discountPercent: 16,
    stock: 58,
    status: 'published',
    created: '2026-02-19',
    rating: 4.9,
    reviewsCount: 9200,
    salesCount: 31000,
    isFlashDeal: true,
    isBestSeller: true,
    hasFreeShipping: true,
    isFullShipping: true,
    stockLeft: 17,
    stockTotal: 120,
    badgeText: 'TOP PRODUCTIVIDAD',
    image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=600&auto=format&fit=crop&q=80',
    colors: ['Grafito Oscuro', 'Gris Pálido', 'Negro Espacial'],
    sizes: [],
    description: 'Sensor óptico Darkfield de 8000 DPI con seguimiento sobre cualquier superficie (incluso cristal). Rueda electromagnética MagSpeed de precisión que desplaza hasta 1000 líneas por segundo, clics Quiet Clicks un 90% más silenciosos y batería de 70 días con carga rápida USB-C.',
    tags: ['logitech', 'mouse', 'raton', 'ergonomico', 'mxmaster', 'productividad']
  },
  {
    id: 124,
    name: 'Tarjeta Gráfica ASUS ROG Strix GeForce RTX 4090 24GB GDDR6X',
    sku: 'ASUS-ROG-RTX4090-24G',
    category: 'gaming',
    categoryLabel: 'Componentes PC & Hardware',
    categoryId: 3,
    price: 9899000,
    originalPrice: 11299000,
    discountPercent: 12,
    stock: 14,
    status: 'published',
    created: '2026-01-05',
    rating: 5.0,
    reviewsCount: 1680,
    salesCount: 4100,
    isFlashDeal: false,
    isBestSeller: true,
    hasFreeShipping: true,
    isFullShipping: true,
    stockLeft: 2,
    stockTotal: 20,
    badgeText: 'ULTRA POTENCIA',
    image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=600&auto=format&fit=crop&q=80',
    colors: ['Negro / Iluminación Aura Sync RGB'],
    sizes: ['24GB GDDR6X'],
    description: 'La GPU más potente del mundo para gaming en 4K/8K, entrenamiento de IA y renderizado profesional. Arquitectura NVIDIA Ada Lovelace con DLSS 3.5 con generación de fotogramas por IA, núcleos Ray Tracing de 3ra generación y cámara de vapor patentada con disipador masivo de 3.5 ranuras.',
    tags: ['nvidia', 'rtx4090', 'gpu', 'asus', 'rog', 'hardware', 'pcgamer']
  },
  {
    id: 125,
    name: 'SSD NVMe M.2 Samsung 990 PRO 2TB PCIe 4.0 7,450 MB/s',
    sku: 'SAMS-990PRO-2TB-HS',
    category: 'electronics',
    categoryLabel: 'Componentes PC & Hardware',
    categoryId: 1,
    price: 849000,
    originalPrice: 1190000,
    discountPercent: 29,
    stock: 52,
    status: 'published',
    created: '2026-02-16',
    rating: 4.9,
    reviewsCount: 4780,
    salesCount: 17400,
    isFlashDeal: true,
    isBestSeller: true,
    hasFreeShipping: true,
    isFullShipping: true,
    stockLeft: 13,
    stockTotal: 100,
    badgeText: '7450 MB/S',
    image: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=600&auto=format&fit=crop&q=80',
    colors: ['Negro con Disipador Térmico'],
    sizes: ['1 TB', '2 TB', '4 TB'],
    description: 'Rendimiento secuencial ultraveloz de hasta 7450 MB/s en lectura y 6900 MB/s en escritura. Controlador recubierto de níquel para una disipación térmica óptima, ideal para PlayStation 5, gaming competitivo y edición de vídeo 8K sin cuello de botella.',
    tags: ['samsung', 'ssd', 'nvme', 'm2', 'almacenamiento', 'ps5', 'pc']
  },
  {
    id: 126,
    name: 'Apple iPad Pro 13" M4 Pantalla Ultra Retina XDR OLED 256GB',
    sku: 'APPLE-IPADPRO-13-M4',
    category: 'electronics',
    categoryLabel: 'Smart Home & Tablets',
    categoryId: 1,
    price: 5899000,
    originalPrice: 6399000,
    discountPercent: 8,
    stock: 28,
    status: 'published',
    created: '2026-02-03',
    rating: 4.9,
    reviewsCount: 2640,
    salesCount: 8100,
    isFlashDeal: false,
    isBestSeller: true,
    hasFreeShipping: true,
    isFullShipping: true,
    stockLeft: 7,
    stockTotal: 50,
    badgeText: 'TANDEM OLED',
    image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&auto=format&fit=crop&q=80',
    colors: ['Negro Espacial', 'Plata'],
    sizes: ['256 GB', '512 GB', '1 TB', '2 TB'],
    description: 'Chip M4 de Apple con motor neuronal de 38 TOPS. Pantalla revolucionaria Ultra Retina XDR con tecnología Tandem OLED de 1000 nits de brillo sostenido en pantalla completa y 1600 nits pico. Chasis ultrafino de solo 5.1 mm y soporte para Apple Pencil Pro con respuesta háptica.',
    tags: ['apple', 'ipad', 'm4', 'oled', 'tablet', 'diseno']
  },
  {
    id: 127,
    name: 'Visor de Realidad Mixta Meta Quest 3 512GB con Mandos Touch Plus',
    sku: 'META-QUEST3-512GB',
    category: 'gaming',
    categoryLabel: 'Smart Home & VR',
    categoryId: 3,
    price: 2699000,
    originalPrice: 3299000,
    discountPercent: 18,
    stock: 32,
    status: 'published',
    created: '2026-02-17',
    rating: 4.8,
    reviewsCount: 3910,
    salesCount: 13500,
    isFlashDeal: true,
    isBestSeller: true,
    hasFreeShipping: true,
    isFullShipping: true,
    stockLeft: 8,
    stockTotal: 65,
    badgeText: 'REALIDAD MIXTA',
    image: 'https://images.unsplash.com/photo-1622979135225-d2ba269bc1df?w=600&auto=format&fit=crop&q=80',
    colors: ['Blanco Polar'],
    sizes: ['128 GB', '512 GB'],
    description: 'Procesador Snapdragon XR2 Gen 2 con el doble de potencia de procesamiento gráfico. Doble cámara RGB a todo color de alta resolución para pasar del mundo virtual a la realidad mixta sin esfuerzo, lentes ópticas Pancake 4K+ Infinite Display y audio espacial 3D inmersivo.',
    tags: ['meta', 'quest3', 'vr', 'realidadvirtual', 'gaming', 'metaverso']
  },
  {
    id: 128,
    name: 'Robot Aspirador y Fregador Roborock S8 Pro Ultra con Base Total',
    sku: 'ROBOROCK-S8PRO-ULTRA',
    category: 'home',
    categoryLabel: 'Smart Home & Robótica',
    categoryId: 4,
    price: 5699000,
    originalPrice: 7499000,
    discountPercent: 24,
    stock: 18,
    status: 'published',
    created: '2026-02-21',
    rating: 4.9,
    reviewsCount: 1840,
    salesCount: 5200,
    isFlashDeal: true,
    isBestSeller: false,
    hasFreeShipping: true,
    isFullShipping: true,
    stockLeft: 4,
    stockTotal: 30,
    badgeText: 'AUTOLIMPIEZA',
    image: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=600&auto=format&fit=crop&q=80',
    colors: ['Blanco Glaciar', 'Negro Elegance'],
    sizes: ['Base Todo en Uno Incluida'],
    description: 'Estación de acoplamiento todo en uno RockDock Ultra que vacía el polvo automáticamente, lava la mopa con agua caliente y la seca con aire caliente para evitar malos olores. Potente succión HyperForce de 6000 Pa, cepillo doble DuoRoller Riser y sistema de fregado sónico VibraRise 2.0.',
    tags: ['roborock', 'robot', 'aspiradora', 'smarthome', 'hogar', 'limpieza']
  },
  {
    id: 129,
    name: 'Zapatillas Nike Air Jordan 1 Retro High OG Chicago Lost & Found',
    sku: 'NIKE-AJ1-CHICAGO',
    category: 'shoes',
    categoryLabel: 'Calzado & Zapatillas',
    categoryId: 5,
    price: 989000,
    originalPrice: 1250000,
    discountPercent: 21,
    stock: 24,
    status: 'published',
    created: '2026-02-18',
    rating: 5.0,
    reviewsCount: 3420,
    salesCount: 11200,
    isFlashDeal: true,
    isBestSeller: true,
    hasFreeShipping: true,
    isFullShipping: true,
    stockLeft: 6,
    stockTotal: 40,
    badgeText: 'HYPE SNEAKER',
    image: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=600&auto=format&fit=crop&q=80',
    colors: ['Chicago Red / White / Black'],
    sizes: ['US 8 (39)', 'US 9 (40)', 'US 10 (41)', 'US 11 (42)', 'US 12 (43)'],
    description: 'La silueta legendaria con tratamiento vintage auténtico. Cuero premium de grano completo, unidad Air-Sole encapsulada en el talón para máxima amortiguación y caja original estilo años 80.',
    tags: ['nike', 'jordan', 'sneakers', 'zapatillas', 'moda', 'calzado', 'cartagena']
  },
  {
    id: 130,
    name: 'Zapatillas Running Adidas Ultraboost Light 2026 Continental',
    sku: 'ADIDAS-UB-LIGHT',
    category: 'shoes',
    categoryLabel: 'Calzado & Zapatillas',
    categoryId: 5,
    price: 699000,
    originalPrice: 850000,
    discountPercent: 18,
    stock: 32,
    status: 'published',
    created: '2026-02-22',
    rating: 4.9,
    reviewsCount: 2180,
    salesCount: 8400,
    isFlashDeal: false,
    isBestSeller: true,
    hasFreeShipping: true,
    isFullShipping: true,
    stockLeft: 10,
    stockTotal: 50,
    badgeText: 'BOOST RUNNING',
    image: 'https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?w=600&auto=format&fit=crop&q=80',
    colors: ['Core Black / Cloud White', 'Triple White', 'Solar Red'],
    sizes: ['US 7.5', 'US 8.5', 'US 9.5', 'US 10.5', 'US 11.5'],
    description: 'La entresuela Light BOOST un 30% más ligera que el Boost estándar. Parte superior de tejido Primeknit+ envolvente y suela de caucho Continental para máximo agarre en asfalto húmedo y seco.',
    tags: ['adidas', 'ultraboost', 'running', 'zapatillas', 'deporte', 'calzado']
  },
  {
    id: 131,
    name: 'Zapatillas New Balance 9060 Sea Salt White Unisex',
    sku: 'NB-9060-SEASALT',
    category: 'shoes',
    categoryLabel: 'Calzado & Zapatillas',
    categoryId: 5,
    price: 749000,
    originalPrice: 890000,
    discountPercent: 16,
    stock: 18,
    status: 'published',
    created: '2026-03-01',
    rating: 4.8,
    reviewsCount: 1450,
    salesCount: 5200,
    isFlashDeal: true,
    isBestSeller: true,
    hasFreeShipping: true,
    isFullShipping: true,
    stockLeft: 5,
    stockTotal: 30,
    badgeText: 'TENDENCIA 2026',
    image: 'https://images.unsplash.com/photo-1539185441755-769473a23570?w=600&auto=format&fit=crop&q=80',
    colors: ['Sea Salt / Rain Cloud', 'Castlerock Grey'],
    sizes: ['US 7', 'US 8', 'US 9', 'US 10', 'US 11'],
    description: 'Estética retrofuturista inspirada en la serie 99X de los años 2000. Amortiguación dual ABZORB y SBS con dispositivo CR translúcido en el talón para comodidad inigualable todo el día.',
    tags: ['newbalance', '9060', 'sneakers', 'lifestyle', 'moda', 'calzado']
  },
  {
    id: 132,
    name: 'Zapatillas Clásicas Puma Suede Classic XXI Ante Genuino',
    sku: 'PUMA-SUEDE-XXI',
    category: 'shoes',
    categoryLabel: 'Calzado & Zapatillas',
    categoryId: 5,
    price: 329000,
    originalPrice: 420000,
    discountPercent: 22,
    stock: 40,
    status: 'published',
    created: '2026-03-05',
    rating: 4.7,
    reviewsCount: 980,
    salesCount: 4100,
    isFlashDeal: false,
    isBestSeller: false,
    hasFreeShipping: true,
    isFullShipping: true,
    stockLeft: 15,
    stockTotal: 60,
    badgeText: 'CLÁSICO PUMA',
    image: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&auto=format&fit=crop&q=80',
    colors: ['Puma Black / White', 'Peacoat Blue', 'High Risk Red'],
    sizes: ['US 8', 'US 9', 'US 10', 'US 11'],
    description: 'El clásico atemporal de ante suave con plantilla acolchada para uso diario y suela de goma con agarre texturizado.',
    tags: ['puma', 'suede', 'clasico', 'zapatillas', 'urbano']
  },
  {
    id: 133,
    name: 'Chaqueta de Cuero Genuino Moto Biker Vintage Negra',
    sku: 'CLOTH-LEATHER-BIKER',
    category: 'clothing',
    categoryLabel: 'Moda & Ropa Urbana',
    categoryId: 6,
    price: 489000,
    originalPrice: 650000,
    discountPercent: 25,
    stock: 15,
    status: 'published',
    created: '2026-02-10',
    rating: 4.9,
    reviewsCount: 760,
    salesCount: 2300,
    isFlashDeal: true,
    isBestSeller: true,
    hasFreeShipping: true,
    isFullShipping: true,
    stockLeft: 4,
    stockTotal: 25,
    badgeText: 'CUERO 100%',
    image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&auto=format&fit=crop&q=80',
    colors: ['Negro Asfalto', 'Café Envejecido'],
    sizes: ['S', 'M', 'L', 'XL'],
    description: 'Cuero vacuno genuino seleccionado a mano, forro interior satinado térmico, cremalleras metálicas YKK de alta resistencia y bolsillos con solapa.',
    tags: ['cuero', 'chaqueta', 'biker', 'moda', 'ropa', 'hombre', 'estilo']
  },
  {
    id: 134,
    name: 'Buzo Hoodie Oversize Algodón Pesado 400 GSM Streetwear',
    sku: 'CLOTH-HOODIE-400GSM',
    category: 'clothing',
    categoryLabel: 'Moda & Ropa Urbana',
    categoryId: 6,
    price: 179000,
    originalPrice: 240000,
    discountPercent: 25,
    stock: 50,
    status: 'published',
    created: '2026-02-15',
    rating: 4.8,
    reviewsCount: 1620,
    salesCount: 6800,
    isFlashDeal: false,
    isBestSeller: true,
    hasFreeShipping: true,
    isFullShipping: true,
    stockLeft: 12,
    stockTotal: 70,
    badgeText: 'STREETWEAR',
    image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&auto=format&fit=crop&q=80',
    colors: ['Gris Jaspeado', 'Negro Charcoal', 'Verde Oliva', 'Beige Arena'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    description: 'Algodón perchado ultra grueso de 400 gramos por metro cuadrado, capucha doble forrada y corte relajado oversize sin cordones visibles.',
    tags: ['hoodie', 'buzo', 'streetwear', 'oversize', 'ropa', 'algodon']
  },
  {
    id: 135,
    name: 'Jeans Levi\'s 511 Slim Fit Stretch Denim Premium',
    sku: 'LEVIS-511-SLIM',
    category: 'clothing',
    categoryLabel: 'Moda & Ropa Urbana',
    categoryId: 6,
    price: 289000,
    originalPrice: 380000,
    discountPercent: 24,
    stock: 36,
    status: 'published',
    created: '2026-02-25',
    rating: 4.9,
    reviewsCount: 2310,
    salesCount: 8900,
    isFlashDeal: false,
    isBestSeller: true,
    hasFreeShipping: true,
    isFullShipping: true,
    stockLeft: 9,
    stockTotal: 50,
    badgeText: 'ORIGINAL LEVIS',
    image: 'https://images.unsplash.com/photo-1542272604-780c96856592?w=600&auto=format&fit=crop&q=80',
    colors: ['Azul Índigo Clásico', 'Azul Oscuro Lavado', 'Negro Puro'],
    sizes: ['30x32', '32x32', '34x32', '36x32'],
    description: 'El corte ajustado clásico pero no ceñido con tecnología de elastano Levi\'s Flex para máxima elasticidad, confort y durabilidad legendaria.',
    tags: ['levis', 'jeans', 'pantalones', 'denim', 'ropa', 'moda']
  },
  {
    id: 136,
    name: 'Camiseta Básica 100% Algodón Pima Peruano Cuello Redondo',
    sku: 'CLOTH-PIMA-TEE',
    category: 'clothing',
    categoryLabel: 'Moda & Ropa Urbana',
    categoryId: 6,
    price: 89000,
    originalPrice: 120000,
    discountPercent: 26,
    stock: 80,
    status: 'published',
    created: '2026-03-02',
    rating: 4.8,
    reviewsCount: 3100,
    salesCount: 14500,
    isFlashDeal: true,
    isBestSeller: true,
    hasFreeShipping: true,
    isFullShipping: true,
    stockLeft: 22,
    stockTotal: 100,
    badgeText: 'PIMA PERUANO',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80',
    colors: ['Blanco Puro', 'Negro Azabache', 'Azul Marino', 'Verde Militar'],
    sizes: ['S', 'M', 'L', 'XL'],
    description: 'Tejido con fibra larga de algodón Pima de máxima suavidad, no encoge con los lavados y mantiene su color brillante por años.',
    tags: ['camiseta', 'algodon', 'pima', 'basico', 'ropa', 'moda']
  },
  {
    id: 137,
    name: 'Cafetera Espresso Automática De\'Longhi Magnifica S con Molinillo',
    sku: 'DELONGHI-MAG-S',
    category: 'home',
    categoryLabel: 'Hogar Inteligente & Cocina',
    categoryId: 4,
    price: 2890000,
    originalPrice: 3450000,
    discountPercent: 16,
    stock: 12,
    status: 'published',
    created: '2026-02-12',
    rating: 4.9,
    reviewsCount: 1890,
    salesCount: 4200,
    isFlashDeal: true,
    isBestSeller: true,
    hasFreeShipping: true,
    isFullShipping: true,
    stockLeft: 3,
    stockTotal: 20,
    badgeText: 'BARISTA EN CASA',
    image: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=600&auto=format&fit=crop&q=80',
    colors: ['Plata & Negro'],
    sizes: ['Depósito 1.8 Litros'],
    description: 'Muele los granos de café al instante con molinillo cónico integrado de 13 ajustes. Sistema Cappuccino tradicional para espumar leche fresca y bomba italiana de 15 bares.',
    tags: ['cafe', 'cafetera', 'delonghi', 'espresso', 'hogar', 'cocina']
  },
  {
    id: 138,
    name: 'Freidora de Aire Dual Basket Ninja Foodi XL 9.5 Litros 2 Zonas',
    sku: 'NINJA-AIRFRY-95L',
    category: 'home',
    categoryLabel: 'Hogar Inteligente & Cocina',
    categoryId: 4,
    price: 899000,
    originalPrice: 1190000,
    discountPercent: 24,
    stock: 25,
    status: 'published',
    created: '2026-02-20',
    rating: 4.9,
    reviewsCount: 4320,
    salesCount: 16800,
    isFlashDeal: true,
    isBestSeller: true,
    hasFreeShipping: true,
    isFullShipping: true,
    stockLeft: 7,
    stockTotal: 40,
    badgeText: 'DUAL BASKET',
    image: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600&auto=format&fit=crop&q=80',
    colors: ['Negro Mate / Acero Inoxidable'],
    sizes: ['9.5 Litros (2x 4.75L)'],
    description: 'Cocina dos alimentos diferentes de dos formas distintas y sincroniza la finalización con la tecnología DualZone Match Cook. 6 programas automáticos de cocción.',
    tags: ['ninja', 'airfryer', 'freidora', 'hogar', 'cocina', 'electrodomesticos']
  },
  {
    id: 139,
    name: 'Purificador y Ventilador Dyson Purifier Hot+Cool Formaldehyde HP09',
    sku: 'DYSON-PURIFIER-HP09',
    category: 'home',
    categoryLabel: 'Hogar Inteligente & Clima',
    categoryId: 4,
    price: 3499000,
    originalPrice: 4100000,
    discountPercent: 15,
    stock: 8,
    status: 'published',
    created: '2026-03-01',
    rating: 5.0,
    reviewsCount: 890,
    salesCount: 1900,
    isFlashDeal: false,
    isBestSeller: false,
    hasFreeShipping: true,
    isFullShipping: true,
    stockLeft: 2,
    stockTotal: 15,
    badgeText: 'AIRE PURO DYSON',
    image: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=600&auto=format&fit=crop&q=80',
    colors: ['Blanco & Oro', 'Níquel & Oro'],
    sizes: ['Torre 105 cm'],
    description: 'Purifica, calienta y refresca de forma inteligente capturando el 99.97% de alérgenos y destruyendo el formaldehído permanentemente. Control desde app móvil MyDyson.',
    tags: ['dyson', 'purificador', 'clima', 'ventilador', 'hogar', 'salud']
  },
  {
    id: 140,
    name: 'Perfume Dior Sauvage Eau de Parfum 100ml Hombre 100% Original',
    sku: 'DIOR-SAUVAGE-EDP',
    category: 'beauty',
    categoryLabel: 'Belleza & Perfumería',
    categoryId: 7,
    price: 689000,
    originalPrice: 820000,
    discountPercent: 16,
    stock: 28,
    status: 'published',
    created: '2026-02-14',
    rating: 4.9,
    reviewsCount: 5120,
    salesCount: 18900,
    isFlashDeal: true,
    isBestSeller: true,
    hasFreeShipping: true,
    isFullShipping: true,
    stockLeft: 8,
    stockTotal: 45,
    badgeText: 'PERFUME TOP 1',
    image: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=600&auto=format&fit=crop&q=80',
    colors: ['Frasco 100 ml con Vaporizador'],
    sizes: ['100 ml'],
    description: 'Notas frescas de bergamota de Calabria y notas amaderadas de ámbar gris envueltas en un absoluto de vainilla de Papúa Nueva Guinea con acentos ahumados.',
    tags: ['dior', 'sauvage', 'perfume', 'fragancia', 'belleza', 'hombre']
  },
  {
    id: 141,
    name: 'Secador de Cabello Dyson Supersonic HD08 con Control Inteligente de Calor',
    sku: 'DYSON-SUPERSONIC-HD08',
    category: 'beauty',
    categoryLabel: 'Belleza & Cuidado Personal',
    categoryId: 7,
    price: 2199000,
    originalPrice: 2650000,
    discountPercent: 17,
    stock: 14,
    status: 'published',
    created: '2026-02-28',
    rating: 5.0,
    reviewsCount: 1980,
    salesCount: 5400,
    isFlashDeal: false,
    isBestSeller: true,
    hasFreeShipping: true,
    isFullShipping: true,
    stockLeft: 3,
    stockTotal: 25,
    badgeText: 'PREMIO BELLEZA',
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80',
    colors: ['Fucsia & Níquel', 'Cobre & Níquel'],
    sizes: ['5 Accesorios Magnéticos Incluidos'],
    description: 'Motor digital Dyson V9 ultra rápido, control inteligente que mide la temperatura del aire más de 40 veces por segundo para prevenir el daño extremo por calor.',
    tags: ['dyson', 'secador', 'cabello', 'belleza', 'estilismo', 'cuidado']
  },
  {
    id: 142,
    name: 'Kit Completo CeraVe Cuidado Facial: Limpiador Hidratante + Loción PM',
    sku: 'CERAVE-KIT-FACIAL',
    category: 'beauty',
    categoryLabel: 'Belleza & Dermocosmética',
    categoryId: 7,
    price: 149000,
    originalPrice: 195000,
    discountPercent: 24,
    stock: 60,
    status: 'published',
    created: '2026-03-04',
    rating: 4.9,
    reviewsCount: 3840,
    salesCount: 15600,
    isFlashDeal: true,
    isBestSeller: true,
    hasFreeShipping: true,
    isFullShipping: true,
    stockLeft: 18,
    stockTotal: 90,
    badgeText: 'DERMATOLÓGICO',
    image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&q=80',
    colors: ['Pack Dúo Ahorro'],
    sizes: ['473 ml + 89 ml'],
    description: 'Desarrollado con dermatólogos, fórmula con 3 ceramidas esenciales, ácido hialurónico y niacinamida para restaurar la barrera cutánea sin obstruir poros.',
    tags: ['cerave', 'skincare', 'facial', 'dermocosmetica', 'belleza', 'salud']
  },
  {
    id: 143,
    name: 'Taladro Percutor Inalámbrico DeWalt 20V MAX XR Sin Escobillas Brushless',
    sku: 'DEWALT-DCD796D2',
    category: 'tools',
    categoryLabel: 'Herramientas & Bricolaje',
    categoryId: 8,
    price: 799000,
    originalPrice: 990000,
    discountPercent: 19,
    stock: 22,
    status: 'published',
    created: '2026-02-16',
    rating: 5.0,
    reviewsCount: 1420,
    salesCount: 4900,
    isFlashDeal: false,
    isBestSeller: true,
    hasFreeShipping: true,
    isFullShipping: true,
    stockLeft: 6,
    stockTotal: 35,
    badgeText: 'PROFESIONAL XR',
    image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&auto=format&fit=crop&q=80',
    colors: ['Amarillo & Negro DeWalt'],
    sizes: ['2 Baterías 2.0Ah + Maletín'],
    description: 'Motor sin escobillas para hasta 57% más de tiempo de ejecución, mandril metálico de 1/2 pulgada de trinquete y luz LED de 3 modos con modo linterna de 20 minutos.',
    tags: ['dewalt', 'taladro', 'herramientas', 'bricolaje', 'construccion', 'taller']
  },
  {
    id: 144,
    name: 'Maletín de Herramientas Bosch X-Line 103 Piezas Titanio',
    sku: 'BOSCH-XLINE-103',
    category: 'tools',
    categoryLabel: 'Herramientas & Bricolaje',
    categoryId: 8,
    price: 249000,
    originalPrice: 340000,
    discountPercent: 27,
    stock: 35,
    status: 'published',
    created: '2026-02-24',
    rating: 4.8,
    reviewsCount: 2190,
    salesCount: 7800,
    isFlashDeal: true,
    isBestSeller: true,
    hasFreeShipping: true,
    isFullShipping: true,
    stockLeft: 11,
    stockTotal: 50,
    badgeText: 'MALETÍN BOSCH',
    image: 'https://images.unsplash.com/photo-1581147036324-c17ac41dfa6c?w=600&auto=format&fit=crop&q=80',
    colors: ['Verde Bosch & Negro'],
    sizes: ['Maletín Rígido 103 Piezas'],
    description: 'Set completo con brocas para mampostería, madera y metal con recubrimiento de titanio, puntas de atornillar, adaptadores magnéticos, llaves Allen y sierra copa.',
    tags: ['bosch', 'herramientas', 'brocas', 'maletin', 'bricolaje', 'taller']
  }
];

export const INITIAL_ORDERS = [
  {
    id: 1,
    orderNumber: 'OMNI-CO-88124',
    customer: {
      name: 'Carlos Mendoza',
      email: 'carlos.mendoza@ejemplo.com',
      avatar: './assets/images/avatar-placeholder.svg',
      phone: '+57 312 345 6789'
    },
    items: [
      { name: 'Apple AirPods Pro 2da Generación con Estuche MagSafe USB-C', quantity: 1, price: 999000 },
      { name: 'Ratón Inalámbrico Ergonómico Logitech MX Master 3S', quantity: 1, price: 479000 }
    ],
    itemCount: 2,
    total: 1478000,
    paymentMethod: 'PSE - Bancolombia',
    status: 'processing',
    orderDate: '2026-03-28',
    shippingAddress: 'Cra 3 # 7-15, Bocagrande, Cartagena de Indias (Bolívar)',
    shippingCity: 'Cartagena de Indias',
    shippingZip: '130001'
  },
  {
    id: 2,
    orderNumber: 'OMNI-CO-67341',
    customer: {
      name: 'Mariana Restrepo',
      email: 'mariana.restrepo@ejemplo.com',
      avatar: './assets/images/avatar-placeholder.svg',
      phone: '+57 300 987 6543'
    },
    items: [
      { name: 'PlayStation 5 Pro Console 2TB SSD 4K 120Hz Ray Tracing PSSR', quantity: 1, price: 3699000 }
    ],
    itemCount: 1,
    total: 3699000,
    paymentMethod: 'Tarjeta de Crédito (Wompi)',
    status: 'shipped',
    orderDate: '2026-03-27',
    shippingAddress: 'Av. Miramar # 24-80, Manga, Cartagena de Indias (Bolívar)',
    shippingCity: 'Cartagena de Indias',
    shippingZip: '130002'
  },
  {
    id: 3,
    orderNumber: 'OMNI-CO-51209',
    customer: {
      name: 'Andrés Felipe Caicedo',
      email: 'andres.caicedo@ejemplo.com',
      avatar: './assets/images/avatar-placeholder.svg',
      phone: '+57 315 432 1098'
    },
    items: [
      { name: 'Altavoz Bluetooth Portátil JBL Charge 5 Resistente al Agua IP67', quantity: 2, price: 649000 }
    ],
    itemCount: 2,
    total: 1298000,
    paymentMethod: 'Nequi',
    status: 'delivered',
    orderDate: '2026-03-26',
    shippingAddress: 'Calle 70 # 4-18, Crespo, Cartagena de Indias (Bolívar)',
    shippingCity: 'Cartagena de Indias',
    shippingZip: '130003'
  }
];

export const INITIAL_USERS = [
  {
    id: 1,
    name: 'Alejandro Morales',
    email: 'admin@omnistore.com',
    role: 'admin',
    status: 'active',
    lastActive: 'Hace 2 min',
    joinDate: '2025-01-15',
    avatar: './assets/images/avatar-placeholder.svg',
    phone: '+57 (605) 665-9000',
    department: 'Bolívar',
    city: 'Cartagena de Indias',
    country: 'Colombia',
    ordersCount: 0,
    totalSpent: 0
  },
  {
    id: 2,
    name: 'Sofía Valenzuela',
    email: 'vendor@omnistore.com',
    role: 'vendor',
    status: 'active',
    lastActive: 'Hace 1 hora',
    joinDate: '2025-02-20',
    avatar: './assets/images/avatar-placeholder.svg',
    phone: '+57 (315) 720-4491',
    department: 'Bolívar',
    city: 'Cartagena de Indias',
    country: 'Colombia',
    ordersCount: 0,
    totalSpent: 0
  },
  {
    id: 3,
    name: 'Carlos Mendoza',
    email: 'carlos.mendoza@ejemplo.com',
    role: 'customer',
    status: 'active',
    lastActive: 'Hace 3 horas',
    joinDate: '2025-03-10',
    avatar: './assets/images/avatar-placeholder.svg',
    phone: '+57 312 345 6789',
    department: 'Bolívar',
    city: 'Cartagena de Indias (Bocagrande)',
    country: 'Colombia',
    ordersCount: 3,
    totalSpent: 6475000
  },
  {
    id: 4,
    name: 'Mariana Restrepo',
    email: 'mariana.restrepo@ejemplo.com',
    role: 'customer',
    status: 'active',
    lastActive: 'Hace 15 min',
    joinDate: '2025-04-05',
    avatar: './assets/images/avatar-placeholder.svg',
    phone: '+57 300 987 6543',
    department: 'Bolívar',
    city: 'Cartagena de Indias (Manga)',
    country: 'Colombia',
    ordersCount: 2,
    totalSpent: 4250000
  },
  {
    id: 5,
    name: 'Andrés Felipe Caicedo',
    email: 'andres.caicedo@ejemplo.com',
    role: 'customer',
    status: 'active',
    lastActive: 'Hace 30 min',
    joinDate: '2025-06-01',
    avatar: './assets/images/avatar-placeholder.svg',
    phone: '+57 315 432 1098',
    department: 'Bolívar',
    city: 'Cartagena de Indias (Crespo)',
    country: 'Colombia',
    ordersCount: 1,
    totalSpent: 1298000
  }
];

export const INITIAL_COUPONS = [
  { id: 1, code: 'BIENVENIDO50K', type: 'fixed', value: 50000, minSpend: 200000, expiry: '2026-12-31', uses: 142, active: true, label: '$ 50.000 COP Descuento de Bienvenida en Cartagena' },
  { id: 2, code: 'CARTAGENA20', type: 'percent', value: 20, minSpend: 150000, expiry: '2026-11-30', uses: 389, active: true, label: '20% OFF Especial Cartagena de Indias' },
  { id: 3, code: 'ENVIOGRATIS', type: 'shipping', value: 100, minSpend: 100000, expiry: '2026-12-31', uses: 812, active: true, label: 'Envío Gratis Cartagena & Zonas Aledañas' },
  { id: 4, code: 'OMNI10', type: 'percent', value: 10, minSpend: 100000, expiry: '2026-12-31', uses: 520, active: true, label: '10% de Descuento Especial OmniStore Cartagena' },
  { id: 5, code: 'OMNIPRO', type: 'percent', value: 20, minSpend: 300000, expiry: '2026-12-31', uses: 95, active: true, label: '20% OFF Super Venta OmniStore' }
];

export const INITIAL_SHIPPING_GUIDES = [
  { id: 'GUIA-SRV-9948201', carrier: 'Servientrega Express', orderNumber: 'OMNI-CO-88124', customer: 'Carlos Mendoza', origin: 'CEDI El Bosque, Cartagena', destination: 'Cartagena (Bocagrande, Cra 3 # 7-15)', status: 'En Distribución', eta: 'Hoy 4:00 PM', trackingNumber: 'SER-9948201-CTG' },
  { id: 'GUIA-COO-1184920', carrier: 'Coordinadora Caribe', orderNumber: 'OMNI-CO-67341', customer: 'Mariana Restrepo', origin: 'CEDI El Bosque, Cartagena', destination: 'Cartagena (Manga, Av. Miramar # 24-80)', status: 'En Ruta de Entrega', eta: 'Hoy 6:00 PM', trackingNumber: 'COO-1184920-CTG' },
  { id: 'GUIA-INT-8830192', carrier: 'Inter Rapidísimo Cartagena', orderNumber: 'OMNI-CO-51209', customer: 'Andrés Felipe Caicedo', origin: 'CEDI El Bosque, Cartagena', destination: 'Cartagena (Crespo, Calle 70 # 4-18)', status: 'Entregado', eta: 'Entregado', trackingNumber: 'INT-8830192-CTG' }
];

export const INITIAL_CARRIERS = [
  { id: 1, name: 'Servientrega Express Cartagena', code: 'SERVIENTREGA', status: 'Conectado API', coverage: 'Cartagena Urbana & Zonas Turísticas', trackingUrl: 'https://www.servientrega.com/wps/portal/rastreo-envio' },
  { id: 2, name: 'Coordinadora Caribe', code: 'COORDINADORA', status: 'Conectado API', coverage: 'Cartagena Metropolitana & Bahía', trackingUrl: 'https://coordinadora.com/rastreo/' },
  { id: 3, name: 'Inter Rapidísimo Cartagena', code: 'INTER_RAPIDISIMO', status: 'Conectado API', coverage: 'Cartagena, Turbaco & Mamonal', trackingUrl: 'https://interrapidisimo.com/sigue-tu-envio/' },
  { id: 4, name: 'Domicilios Express Bocagrande/Manga', code: 'DOMI_CTG', status: 'Activo', coverage: 'Entregas en 2 Horas (Bocagrande, Castillogrande, Manga)', trackingUrl: '#' },
  { id: 5, name: 'Envía Colvanes Bolívar', code: 'ENVIA', status: 'Activo', coverage: 'Cartagena & Municipios de Bolívar', trackingUrl: 'https://enviacolvanes.com/rastreo' }
];

export const INITIAL_SHIPPING_ZONES = [
  { id: 1, zone: 'Zona 1: Bocagrande, Castillogrande, El Laguito & Centro Histórico', rate: 6500, deliveryTime: '2 a 4 horas' },
  { id: 2, zone: 'Zona 2: Manga, Pie de la Popa, Crespo, Marbella & Cabrero', rate: 7500, deliveryTime: '3 a 6 horas' },
  { id: 3, zone: 'Zona 3: El Bosque, Los Alpes, Providencia, Santa Lucía & La Castellana', rate: 8500, deliveryTime: 'Mismo día hábil' },
  { id: 4, zone: 'Zona 4: Turbaco, Mamonal, Pasacaballos & Zona Conurbada', rate: 12000, deliveryTime: '24 horas hábiles' }
];

export const INITIAL_PAYMENTS = [
  { id: 'PAY-COL-90421', orderNumber: 'OMNI-CO-88124', method: 'PSE - Bancolombia', customer: 'Carlos Mendoza', amount: 1478000, date: '2026-03-28 11:24', status: 'Aprobado', ref: 'WOMPI-PSE-89210', fee: 22170 },
  { id: 'PAY-COL-90420', orderNumber: 'OMNI-CO-67341', method: 'Tarjeta Crédito Visa (Wompi)', customer: 'Mariana Restrepo', amount: 3699000, date: '2026-03-27 10:15', status: 'Aprobado', ref: 'WOMPI-CC-89209', fee: 110970 },
  { id: 'PAY-COL-90419', orderNumber: 'OMNI-CO-51209', method: 'Nequi (QR Interbancario)', customer: 'Andrés Felipe Caicedo', amount: 1298000, date: '2026-03-26 09:40', status: 'Aprobado', ref: 'BOLD-NQ-44102', fee: 38940 }
];

export const INITIAL_KARDEX = [
  { id: 'KDX-COL-8012', type: 'Entrada Proveedor', product: 'Sony PlayStation 5 Pro Console 2TB', quantity: '+20 und', date: '2026-03-25 10:30', user: 'Admin Cartagena', note: 'Recepción CEDI El Bosque - Proveedor Mayorista Tech' },
  { id: 'KDX-COL-8011', type: 'Salida Venta', product: 'Apple AirPods Pro 2da Generación', quantity: '-1 und', date: '2026-03-28 11:24', user: 'Sistema Tienda', note: 'Orden #OMNI-CO-88124 (Despacho Bocagrande)' },
  { id: 'KDX-COL-8010', type: 'Salida Venta', product: 'Ratón Inalámbrico Logitech MX Master 3S', quantity: '-1 und', date: '2026-03-28 11:24', user: 'Sistema Tienda', note: 'Orden #OMNI-CO-88124 (Despacho Bocagrande)' },
  { id: 'KDX-COL-8009', type: 'Salida Venta', product: 'PlayStation 5 Pro Console 2TB SSD', quantity: '-1 und', date: '2026-03-27 10:15', user: 'Sistema Tienda', note: 'Orden #OMNI-CO-67341 (Despacho Manga)' }
];

export const INITIAL_SUPPLIERS = [
  { id: 1, name: 'Mayorista Tech Caribe S.A.S.', nit: '900.548.120-1', city: 'Cartagena de Indias', contact: 'Carlos Restrepo', phone: '+57 (605) 665-1200', terms: 'Crédito 30 días' },
  { id: 2, name: 'Distribuciones Gamer de la Costa', nit: '901.220.450-8', city: 'Cartagena de Indias', contact: 'Marcela Hoyos', phone: '+57 (605) 664-9000', terms: 'Contado 5% Desc' },
  { id: 3, name: 'Importaciones Portuarias Mamonal', nit: '900.890.312-3', city: 'Cartagena (Mamonal)', contact: 'Andrés Buitrago', phone: '+57 (605) 668-3344', terms: 'Crédito 15 días' },
  { id: 4, name: 'Audio Pro Cartagena Ltda', nit: '830.012.890-5', city: 'Cartagena de Indias', contact: 'Diana Morales', phone: '+57 (605) 660-1122', terms: 'Crédito 45 días' }
];

export const INITIAL_REVIEWS = [
  { id: 1, product: 'Apple iPhone 16 Pro Max 256GB', rating: 5, author: 'Carlos Mendoza', city: 'Cartagena (Bocagrande)', comment: 'Excelente smartphone, rendimiento insuperable con Chip A18 Pro. Llegó el mismo día en Bocagrande por Servientrega.', date: '2026-03-28', status: 'Aprobada' },
  { id: 2, product: 'PlayStation 5 Pro Console 2TB', rating: 5, author: 'Mariana Restrepo', city: 'Cartagena (Manga)', comment: 'La fidelidad gráfica en 4K 120Hz con PSSR es increíble. 100% original con garantía oficial.', date: '2026-03-27', status: 'Aprobada' },
  { id: 3, product: 'JBL Charge 5 Altavoz Bluetooth', rating: 5, author: 'Andrés Felipe Caicedo', city: 'Cartagena (Crespo)', comment: 'Bajos potentes y resistencia al agua excelente, perfecto para la playa en Crespo. El envío fue súper rápido.', date: '2026-03-26', status: 'Aprobada' }
];

export const INITIAL_TICKETS = [
  { id: 'TCK-2026-101', subject: 'Consulta de garantía y factura electrónica DIAN', customer: 'Carlos Mendoza', email: 'carlos.mendoza@ejemplo.com', priority: 'Media', category: 'Facturación', status: 'Resuelto', date: '2026-03-28', replies: [{ author: 'Soporte OmniStore', message: 'Estimado Carlos, tu factura electrónica FE-2026-00482 ha sido emitida con validación previa DIAN para tu dirección en Bocagrande.', date: '2026-03-28 14:00' }] },
  { id: 'TCK-2026-102', subject: 'Solicitud de cambio de horario de entrega en Manga', customer: 'Mariana Restrepo', email: 'mariana.restrepo@ejemplo.com', priority: 'Alta', category: 'Logística & Envíos', status: 'En Proceso', date: '2026-03-27', replies: [{ author: 'Soporte OmniStore', message: 'Guía Coordinadora actualizada para entrega en la tarde en Manga.', date: '2026-03-27 11:30' }] },
  { id: 'TCK-2026-103', subject: 'Duda sobre disponibilidad de Apple MacBook Pro M3', customer: 'David Quintero', email: 'david.q@ejemplo.com', priority: 'Baja', category: 'Ventas & Catálogo', status: 'Abierto', date: '2026-03-26', replies: [] }
];

export const INITIAL_INVOICES = [
  {
    id: 'FE-2026-00482',
    cufe: 'a7b8c9d0e1f234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    orderId: 'OMNI-CO-88124',
    customerName: 'Carlos Mendoza',
    customerDoc: 'CC 1.018.472.910',
    customerEmail: 'carlos.mendoza@ejemplo.com',
    customerCity: 'Cartagena de Indias (Bocagrande)',
    subtotal: 1242017,
    iva: 235983,
    total: 1478000,
    paymentMethod: 'PSE - Bancolombia',
    status: 'approved',
    issuedAt: '2026-03-28 11:25',
    dianResolution: 'Res. DIAN No. 18764000001 (Rango FE-1 a FE-50000)'
  },
  {
    id: 'FE-2026-00481',
    cufe: 'f8e7d6c5b4a3210987654321fedcba0987654321fedcba0987654321fedcba098765',
    orderId: 'OMNI-CO-67341',
    customerName: 'Mariana Restrepo',
    customerDoc: 'CC 52.894.120',
    customerEmail: 'mariana.restrepo@ejemplo.com',
    customerCity: 'Cartagena de Indias (Manga)',
    subtotal: 3108403,
    iva: 590597,
    total: 3699000,
    paymentMethod: 'Tarjeta de Crédito (Wompi)',
    status: 'approved',
    issuedAt: '2026-03-27 10:16',
    dianResolution: 'Res. DIAN No. 18764000001 (Rango FE-1 a FE-50000)'
  }
];

export const INITIAL_BANNERS = [
  { id: 1, title: 'Super Promo Cartagena - Hasta 80% OFF', position: 'Header Principal', target: 'marketplace.html', active: true, badge: 'AliExpress Style' },
  { id: 2, title: 'Ofertas Relámpago - Envíos Gratis en Cartagena', position: 'Carrusel Home #1', target: 'marketplace.html#flash-deals', active: true, badge: 'Temu Style' },
  { id: 3, title: 'Tecnología & Gamer 2026 - Entrega Inmediata Bocagrande & Manga', position: 'Sección Destacada', target: 'products.html?category=gaming', active: true, badge: 'Mercado Libre' }
];

export const INITIAL_CAMPAIGNS = [
  { id: 1, name: 'Recuperación de Carrito Abandonado Cartagena', channel: 'WhatsApp + Email', trigger: '1 hora después', status: 'Activa', conversions: '18.4%' },
  { id: 2, name: 'Bienvenida con Cupón $50.000 COP Cartagena', channel: 'Email Automático', trigger: 'Inmediato al registro', status: 'Activa', conversions: '34.2%' },
  { id: 3, name: 'Alerta de Guía en Camino (Servientrega Cartagena)', channel: 'WhatsApp Business', trigger: 'Al cambiar orden a Enviado', status: 'Activa', conversions: '99.1%' }
];

export const INITIAL_PAGES = [
  { id: 1, title: 'Términos y Condiciones (E-Commerce Cartagena)', slug: 'terminos-condiciones', status: 'Publicada', updated: '2026-09-15', content: 'Condiciones generales de compraventa para la plataforma OmniStore en Cartagena de Indias conforme a la Ley 1480 de 2011.' },
  { id: 2, title: 'Política de Tratamiento de Datos (Ley 1581 Habeas Data)', slug: 'privacidad-habeas-data', status: 'Publicada', updated: '2026-09-20', content: 'Protección integral de datos personales conforme al régimen de Habeas Data en Colombia.' },
  { id: 3, title: 'Garantías, Envíos en Cartagena y Devoluciones (Estatuto del Consumidor)', slug: 'garantias-devoluciones', status: 'Publicada', updated: '2026-09-28', content: 'Derecho de retracto de 5 días hábiles y políticas de garantía oficial de fabricante con entregas directas en Cartagena.' },
  { id: 4, title: 'Preguntas Frecuentes (FAQ & Ayuda Cartagena)', slug: 'faq', status: 'Publicada', updated: '2026-10-01', content: 'Respuestas a dudas sobre pagos PSE, tiempos de entrega en Bocagrande, Manga, Crespo y envíos gratis.' }
];

export const INITIAL_MENUS = [
  { id: 1, label: 'Inicio Marketplace', url: './marketplace.html', location: 'header', order: 1 },
  { id: 2, label: 'Super Ofertas Flash', url: './marketplace.html#flash-deals', location: 'header', order: 2 },
  { id: 3, label: 'Más Vendidos', url: './marketplace.html?filter=bestsellers', location: 'header', order: 3 },
  { id: 4, label: 'Smartphones & Tech', url: './marketplace.html?category=electronics', location: 'header', order: 4 },
  { id: 5, label: 'Gamer Zone', url: './marketplace.html?category=gaming', location: 'header', order: 5 },
  { id: 6, label: 'Términos & Condiciones', url: './help.html', location: 'footer', order: 1 },
  { id: 7, label: 'PQRS & Soporte Cartagena', url: './help.html?tab=contact', location: 'footer', order: 2 },
  { id: 8, label: 'Garantías DIAN', url: './reports.html?tab=invoices', location: 'footer', order: 3 }
];

export const INITIAL_SETTINGS = {
  language: 'es',
  timezone: 'America/Bogota',
  dateFormat: 'DD/MM/YYYY',
  currency: 'COP',
  autoSave: true,
  storeName: 'OmniStore Cartagena',
  supportEmail: 'soporte@omnistore.com.co',
  supportPhone: '+57 (605) 665-9000',
  whatsappBusiness: '+57 310 845 9210',
  nit: '901.849.201-4',
  address: 'Cra 3 # 7-15, Bocagrande, Cartagena de Indias, Bolívar, Colombia',
  freeShippingThreshold: 150000,
  theme: 'light',
  collapsedSidebar: false,
  animations: true,
  highContrast: false,
  notifications: {
    desktop: true,
    email: true,
    sound: true,
    marketing: false,
    whatsappAlerts: true
  },
  privacy: {
    analytics: true,
    performance: true,
    activityHistory: true
  },
  storage: {
    autoCleanup: true,
    cacheLimit: '1000'
  }
};

// Storage Keys
const CATALOG_STORAGE_KEY = 'omnistore_products_catalog';
const ORDERS_STORAGE_KEY = 'omnistore_orders_list';
const USERS_STORAGE_KEY = 'omnistore_users_list';
const COUPONS_STORAGE_KEY = 'omnistore_coupons_list';
const SHIPPING_STORAGE_KEY = 'omnistore_shipping_list';
const CARRIERS_STORAGE_KEY = 'omnistore_carriers_list';
const ZONES_STORAGE_KEY = 'omnistore_shipping_zones_list';
const PAYMENTS_STORAGE_KEY = 'omnistore_payments_list';
const KARDEX_STORAGE_KEY = 'omnistore_kardex_list';
const SUPPLIERS_STORAGE_KEY = 'omnistore_suppliers_list';
const REVIEWS_STORAGE_KEY = 'omnistore_reviews_list';
const TICKETS_STORAGE_KEY = 'omnistore_tickets_list';
const INVOICES_STORAGE_KEY = 'omnistore_invoices_list';
const BANNERS_STORAGE_KEY = 'omnistore_banners_list';
const CAMPAIGNS_STORAGE_KEY = 'omnistore_campaigns_list';
const PAGES_STORAGE_KEY = 'omnistore_pages_list';
const MENUS_STORAGE_KEY = 'omnistore_menus_list';
const SETTINGS_STORAGE_KEY = 'appSettings';

// Auto-sync initialization
let isSyncing = false;

// Initialize Supabase Sync & Realtime (Hybrid API + Client)
export async function initSupabaseDataSync() {
  if (typeof window === 'undefined' || isSyncing) return;
  isSyncing = true;

  try {
    // 1. Products Catalog from PostgreSQL
    const prodRes = await fetch('/api/products').catch(() => null);
    if (prodRes && prodRes.ok) {
      const prodJson = await prodRes.json();
      if (prodJson.success && Array.isArray(prodJson.data) && prodJson.data.length > 0) {
        const cleaned = prodJson.data.map(p => ({
          ...p,
          image: resolveProductImage(p)
        }));
        localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(cleaned));
        window.dispatchEvent(new CustomEvent('omnistore:catalog-updated', { detail: cleaned }));
      }
    } else if (isSupabaseConnected()) {
      const remoteProducts = await fetchProductsSupabase();
      if (remoteProducts && remoteProducts.length >= 25) {
        const cleaned = remoteProducts.map(p => ({
          ...p,
          image: resolveProductImage(p)
        }));
        localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(cleaned));
        window.dispatchEvent(new CustomEvent('omnistore:catalog-updated', { detail: cleaned }));
      } else if (remoteProducts && remoteProducts.length > 0) {
        // Merge missing INITIAL_CATALOG items so the user gets the complete catalog
        const remoteSkus = new Set(remoteProducts.map(p => p.sku || p.id));
        const merged = [...remoteProducts];
        INITIAL_CATALOG.forEach(initP => {
          if (!remoteSkus.has(initP.sku) && !remoteSkus.has(initP.id)) {
            merged.push(initP);
          }
        });
        const cleaned = merged.map(p => ({
          ...p,
          image: resolveProductImage(p)
        }));
        localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(cleaned));
        window.dispatchEvent(new CustomEvent('omnistore:catalog-updated', { detail: cleaned }));
      }
    }

    // 2. Orders from PostgreSQL
    const ordRes = await fetch('/api/orders').catch(() => null);
    if (ordRes && ordRes.ok) {
      const ordJson = await ordRes.json();
      if (ordJson.success && Array.isArray(ordJson.data) && ordJson.data.length > 0) {
        localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(ordJson.data));
        window.dispatchEvent(new CustomEvent('omnistore:orders-updated', { detail: ordJson.data }));
      }
    } else if (isSupabaseConnected()) {
      const remoteOrders = await fetchOrdersSupabase();
      if (remoteOrders && remoteOrders.length > 0) {
        localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(remoteOrders));
        window.dispatchEvent(new CustomEvent('omnistore:orders-updated', { detail: remoteOrders }));
      }
    }

    // 3. Users & Team Accounts from PostgreSQL
    const userRes = await fetch('/api/users').catch(() => null);
    if (userRes && userRes.ok) {
      const userJson = await userRes.json();
      if (userJson.success && Array.isArray(userJson.data) && userJson.data.length > 0) {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(userJson.data));
        window.dispatchEvent(new CustomEvent('omnistore:users-updated', { detail: userJson.data }));
      }
    }

    // 4. Customer Reviews from PostgreSQL
    const revRes = await fetch('/api/reviews').catch(() => null);
    if (revRes && revRes.ok) {
      const revJson = await revRes.json();
      if (revJson.success && Array.isArray(revJson.data) && revJson.data.length > 0) {
        localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(revJson.data));
        window.dispatchEvent(new CustomEvent('omnistore:reviews-updated', { detail: revJson.data }));
      }
    }

    // 5. Promotional Coupons from PostgreSQL
    const coupRes = await fetch('/api/coupons').catch(() => null);
    if (coupRes && coupRes.ok) {
      const coupJson = await coupRes.json();
      if (coupJson.success && Array.isArray(coupJson.data) && coupJson.data.length > 0) {
        localStorage.setItem(COUPONS_STORAGE_KEY, JSON.stringify(coupJson.data));
        window.dispatchEvent(new CustomEvent('omnistore:coupons-updated', { detail: coupJson.data }));
      }
    }

    // 6. Shipping Zones from PostgreSQL
    const zoneRes = await fetch('/api/shipping-zones').catch(() => null);
    if (zoneRes && zoneRes.ok) {
      const zoneJson = await zoneRes.json();
      if (zoneJson.success && Array.isArray(zoneJson.data) && zoneJson.data.length > 0) {
        localStorage.setItem(ZONES_STORAGE_KEY, JSON.stringify(zoneJson.data));
        window.dispatchEvent(new CustomEvent('omnistore:shipping-zones-updated', { detail: zoneJson.data }));
      }
    }

    if (isSupabaseConnected()) {
      initSupabaseRealtime(
        (updatedProducts) => {
          localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(updatedProducts));
          window.dispatchEvent(new CustomEvent('omnistore:catalog-updated', { detail: updatedProducts }));
        },
        (updatedOrders) => {
          localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(updatedOrders));
          window.dispatchEvent(new CustomEvent('omnistore:orders-updated', { detail: updatedOrders }));
        }
      );
    }
  } catch (e) {
    console.warn('Data sync notice:', e);
  } finally {
    isSyncing = false;
  }
}

if (typeof window !== 'undefined') {
  setTimeout(() => {
    initSupabaseDataSync();
  }, 50);

  window.addEventListener('omnistore:supabase-status', (e) => {
    if (e.detail?.connected) {
      initSupabaseDataSync();
    }
  });
}

// ==============================================================================
// 1. PRODUCTS CATALOG API
// ==============================================================================

export function getProductsCatalog() {
  try {
    const raw = localStorage.getItem(CATALOG_STORAGE_KEY) || localStorage.getItem('metis_products_catalog');
    if (raw) {
      const parsed = JSON.parse(raw);
      // If the stored catalog has at least 25 items, use it.
      // If it only has 7 or fewer legacy/demo items, automatically upgrade to the full 44-product catalog.
      if (Array.isArray(parsed) && parsed.length >= 25) {
        return parsed.map(p => ({
          ...p,
          image: resolveProductImage(p)
        }));
      }
    }
  } catch (e) {
    console.warn('Error reading products catalog from storage:', e);
  }
  saveProductsCatalog(INITIAL_CATALOG);
  return INITIAL_CATALOG;
}

export function restoreFullCatalog() {
  try {
    saveProductsCatalog(INITIAL_CATALOG);
    if (isSupabaseConnected()) {
      INITIAL_CATALOG.forEach(p => upsertProductSupabase(p).catch(() => {}));
    }
  } catch (e) {
    console.warn('Error restoring full catalog:', e);
  }
  return INITIAL_CATALOG;
}

export function saveProductsCatalog(products) {
  try {
    localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(products));
    window.dispatchEvent(new CustomEvent('omnistore:catalog-updated', { detail: products }));
  } catch (e) {
    console.error('Error saving products catalog:', e);
  }
}

export function addProductToCatalog(data) {
  const catalog = getProductsCatalog();
  const nextId = catalog.length > 0 ? Math.max(...catalog.map(p => (typeof p.id === 'number' ? p.id : 0))) + 1 : 101;
  const numPrice = parseFloat(data.price) || 0;
  const numOrigPrice = parseFloat(data.originalPrice) || numPrice * 1.5;
  const discount = Math.round(((numOrigPrice - numPrice) / numOrigPrice) * 100);

  const categoryLabels = {
    electronics: 'Electrónica & Gadgets',
    audio: 'Audio & Auriculares',
    gaming: 'Gamer & Computación',
    home: 'Hogar & Cocina',
    shoes: 'Calzado & Deportes',
    clothing: 'Moda & Ropa',
    beauty: 'Belleza & Cuidado',
    tools: 'Herramientas & Bricolaje',
    books: 'Libros & Lectura'
  };

  const newProduct = {
    id: nextId,
    name: data.name || 'Nuevo Producto OmniStore',
    sku: data.sku || `SKU-${nextId}-${Math.floor(100 + Math.random() * 900)}`,
    category: data.category || 'electronics',
    categoryLabel: categoryLabels[data.category] || 'General',
    price: numPrice,
    originalPrice: numOrigPrice > numPrice ? numOrigPrice : +(numPrice * 1.4).toFixed(2),
    discountPercent: discount > 0 ? discount : 30,
    stock: parseInt(data.stock, 10) || 10,
    status: data.status || 'published',
    created: new Date().toISOString().split('T')[0],
    rating: data.rating || 4.9,
    reviewsCount: data.reviewsCount || Math.floor(50 + Math.random() * 200),
    salesCount: data.salesCount || Math.floor(100 + Math.random() * 800),
    isFlashDeal: Boolean(data.isFlashDeal),
    isBestSeller: Boolean(data.isBestSeller),
    hasFreeShipping: data.hasFreeShipping !== undefined ? Boolean(data.hasFreeShipping) : true,
    isFullShipping: data.isFullShipping !== undefined ? Boolean(data.isFullShipping) : true,
    stockLeft: parseInt(data.stock, 10) || 10,
    stockTotal: (parseInt(data.stock, 10) || 10) + 20,
    badgeText: data.badgeText || (data.isFlashDeal ? 'SUPER OFERTA' : 'NUEVO'),
    image: data.image || './assets/images/product-placeholder.svg',
    colors: Array.isArray(data.colors) && data.colors.length > 0 ? data.colors : ['Predeterminado'],
    sizes: Array.isArray(data.sizes) ? data.sizes : [],
    description: data.description || 'Producto disponible en OmniStore con garantía oficial y entrega rápida en Cartagena.',
    tags: [data.category || 'tienda', 'omnistore', 'oferta', 'cartagena']
  };

  catalog.unshift(newProduct);
  saveProductsCatalog(catalog);

  addKardexMovement({
    type: 'Entrada Inicial',
    product: newProduct.name,
    quantity: `+${newProduct.stock} und`,
    user: 'Admin Cartagena',
    note: `Creación de producto nuevo (SKU: ${newProduct.sku})`
  });

  fetch('/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newProduct)
  }).catch(() => {});

  if (isSupabaseConnected()) {
    upsertProductSupabase(newProduct).catch(() => {});
  }

  return newProduct;
}

export function updateProductInCatalog(id, updatedFields) {
  const catalog = getProductsCatalog();
  const index = catalog.findIndex(p => p.id === id);
  if (index !== -1) {
    if (updatedFields.price) {
      updatedFields.price = parseFloat(updatedFields.price);
    }
    if (updatedFields.stock !== undefined) {
      const oldStock = catalog[index].stock || 0;
      const newStock = parseInt(updatedFields.stock, 10);
      updatedFields.stock = newStock;
      updatedFields.stockLeft = newStock;
      if (newStock !== oldStock) {
        addKardexMovement({
          type: newStock > oldStock ? 'Ajuste Stock (+)' : 'Ajuste Stock (-)',
          product: catalog[index].name,
          quantity: `${newStock >= oldStock ? '+' : ''}${newStock - oldStock} und`,
          user: 'Admin Cartagena',
          note: `Ajuste manual de inventario (${oldStock} -> ${newStock})`
        });
      }
    }
    catalog[index] = { ...catalog[index], ...updatedFields };
    saveProductsCatalog(catalog);

    fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(catalog[index])
    }).catch(() => {});

    if (isSupabaseConnected()) {
      upsertProductSupabase(catalog[index]).catch(() => {});
    }

    return catalog[index];
  }
  return null;
}

export function deleteProductFromCatalog(id) {
  const catalog = getProductsCatalog();
  const deletedProd = catalog.find(p => p.id === id);
  const filtered = catalog.filter(p => p.id !== id);
  saveProductsCatalog(filtered);

  if (deletedProd) {
    addKardexMovement({
      type: 'Baja Producto',
      product: deletedProd.name,
      quantity: `-${deletedProd.stock || 0} und`,
      user: 'Admin Cartagena',
      note: `Eliminación de producto del catálogo (SKU: ${deletedProd.sku})`
    });
  }

  fetch(`/api/products/${id}`, { method: 'DELETE' }).catch(() => {});

  if (isSupabaseConnected()) {
    deleteProductSupabase(id).catch(() => {});
  }

  return filtered;
}

// ==============================================================================
// 2. ORDERS & SALES API
// ==============================================================================

export function getOrdersList() {
  try {
    const raw = localStorage.getItem(ORDERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading orders from storage:', e);
  }
  saveOrdersList(INITIAL_ORDERS);
  return INITIAL_ORDERS;
}

export function saveOrdersList(orders) {
  try {
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
    window.dispatchEvent(new CustomEvent('omnistore:orders-updated', { detail: orders }));
  } catch (e) {
    console.error('Error saving orders list:', e);
  }
}

export function createStoreOrder(checkoutForm, cartItems, totalAmount, appliedCoupon = null) {
  const orders = getOrdersList();
  const nextId = orders.length > 0 ? Math.max(...orders.map(o => (typeof o.id === 'number' ? o.id : 0))) + 1 : 1;
  const orderNum = 'OMNI-CO-' + Math.floor(10000 + Math.random() * 90000);
  const parsedTotal = parseFloat(totalAmount) || 0;

  const newOrder = {
    id: nextId,
    orderNumber: orderNum,
    customer: {
      name: checkoutForm.name || 'Cliente OmniStore',
      email: checkoutForm.email || 'cliente@ejemplo.com',
      avatar: './assets/images/avatar-placeholder.svg',
      phone: checkoutForm.phone || '+57 310 000 0000'
    },
    items: cartItems.map(item => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      selectedColor: item.selectedColor,
      selectedSize: item.selectedSize
    })),
    itemCount: cartItems.reduce((acc, it) => acc + (it.quantity || 1), 0),
    total: parsedTotal,
    paymentMethod: checkoutForm.paymentMethod === 'card' ? 'Tarjeta de Crédito (Wompi)' :
                   (checkoutForm.paymentMethod === 'pse' ? 'PSE - Transferencia Bancaria' :
                   (checkoutForm.paymentMethod === 'nequi' ? 'Nequi (QR Interbancario)' :
                   (checkoutForm.paymentMethod === 'cash' ? 'Efecty / Contraentrega' : 'Pasarela Digital'))),
    status: 'processing',
    orderDate: new Date().toISOString().split('T')[0],
    shippingAddress: `${checkoutForm.address || 'Cra 3 # 7-15, Bocagrande'}, ${checkoutForm.city || 'Cartagena de Indias'}`,
    shippingCity: checkoutForm.city || 'Cartagena de Indias',
    shippingZip: checkoutForm.zip || '130001',
    appliedCoupon: appliedCoupon ? (typeof appliedCoupon === 'string' ? appliedCoupon : appliedCoupon.code) : null
  };

  orders.unshift(newOrder);
  saveOrdersList(orders);

  // 1. Deduct stock from catalog
  const catalog = getProductsCatalog();
  let catalogUpdated = false;
  cartItems.forEach(cartItem => {
    const prod = catalog.find(p => p.id === cartItem.id || p.sku === cartItem.sku || p.name === cartItem.name);
    if (prod) {
      const soldQty = cartItem.quantity || 1;
      prod.stock = Math.max(0, (prod.stock || 0) - soldQty);
      prod.stockLeft = Math.max(0, (prod.stockLeft || prod.stock || 0) - soldQty);
      prod.salesCount = (prod.salesCount || 0) + soldQty;
      catalogUpdated = true;

      // Log Kardex
      addKardexMovement({
        type: 'Salida Venta',
        product: prod.name,
        quantity: `-${soldQty} und`,
        user: 'Sistema Marketplace',
        note: `Orden de compra #${orderNum}`
      });

      fetch(`/api/products/${prod.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prod)
      }).catch(() => {});
    }
  });
  if (catalogUpdated) {
    saveProductsCatalog(catalog);
  }

  // 2. Upsert Customer Record
  upsertCustomerFromOrder(newOrder.customer, parsedTotal, newOrder.shippingCity);

  // 3. Create Shipping Guide
  const randomCarrier = Math.random() > 0.5 ? 'Servientrega Express Cartagena' : 'Coordinadora Caribe';
  const guideTracking = (randomCarrier.includes('Servientrega') ? 'SER-' : 'COO-') + Math.floor(1000000 + Math.random() * 9000000) + '-CTG';
  addShippingGuide({
    carrier: randomCarrier,
    orderNumber: orderNum,
    customer: newOrder.customer.name,
    origin: 'Centro de Distribución OmniStore - El Bosque, Cartagena',
    destination: `${newOrder.shippingCity} (${newOrder.shippingAddress})`,
    status: 'Guía Generada / En Preparación',
    eta: 'Mismo día (2 a 6 horas)',
    trackingNumber: guideTracking
  });

  // 4. Create Payment Record
  addPaymentRecord({
    orderNumber: orderNum,
    method: newOrder.paymentMethod,
    customer: newOrder.customer.name,
    amount: parsedTotal,
    status: 'Aprobado',
    ref: 'OMNI-PAY-' + Math.floor(100000 + Math.random() * 900000),
    fee: Math.round(parsedTotal * 0.025)
  });

  // 5. Generate Electronic Invoice for DIAN
  createInvoiceFromOrder(newOrder);

  // 6. Update Coupon Usage if applied
  if (newOrder.appliedCoupon) {
    const coupons = getCouponsList();
    const cIdx = coupons.findIndex(c => c.code === newOrder.appliedCoupon);
    if (cIdx !== -1) {
      coupons[cIdx].uses = (coupons[cIdx].uses || 0) + 1;
      saveCouponsList(coupons);
    }
  }

  // 7. API and Supabase Push
  fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderNumber: newOrder.orderNumber,
      customerName: newOrder.customer.name,
      customerEmail: newOrder.customer.email,
      customerPhone: newOrder.customer.phone,
      shippingAddress: newOrder.shippingAddress,
      shippingCity: newOrder.shippingCity,
      shippingZip: newOrder.shippingZip,
      paymentMethod: newOrder.paymentMethod,
      itemCount: newOrder.itemCount,
      total: newOrder.total,
      status: newOrder.status,
      items: newOrder.items
    })
  }).catch(() => {});

  if (isSupabaseConnected()) {
    insertOrderSupabase(newOrder).catch(() => {});
  }

  return newOrder;
}

export function updateOrderStatus(orderId, newStatus) {
  const orders = getOrdersList();
  const order = orders.find(o => o.id === orderId);
  if (order) {
    order.status = newStatus;
    saveOrdersList(orders);

    // Update shipping status accordingly
    const guides = getShippingGuidesList();
    const guide = guides.find(g => g.orderNumber === order.orderNumber);
    if (guide) {
      if (newStatus === 'shipped') guide.status = 'En Ruta de Entrega';
      else if (newStatus === 'delivered') guide.status = 'Entregado al Comprador';
      else if (newStatus === 'cancelled') guide.status = 'Envío Cancelado';
      saveShippingGuidesList(guides);
    }

    if (isSupabaseConnected()) {
      updateOrderStatusSupabase(orderId, newStatus).catch(() => {});
    }

    return order;
  }
  return null;
}

export function deleteOrder(orderId) {
  const orders = getOrdersList();
  const filtered = orders.filter(o => o.id !== orderId);
  saveOrdersList(filtered);
  return filtered;
}

// ==============================================================================
// 3. USERS & CUSTOMERS API
// ==============================================================================

export function getUsersList() {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading users from storage:', e);
  }
  saveUsersList(INITIAL_USERS);
  return INITIAL_USERS;
}

export function saveUsersList(users) {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    window.dispatchEvent(new CustomEvent('omnistore:users-updated', { detail: users }));
  } catch (e) {
    console.error('Error saving users list:', e);
  }
}

export function addUser(userData) {
  const users = getUsersList();
  const nextId = users.length > 0 ? Math.max(...users.map(u => (typeof u.id === 'number' ? u.id : 0))) + 1 : 1;
  const newUser = {
    id: nextId,
    name: userData.name || 'Nuevo Usuario',
    email: userData.email || 'usuario@omnistore.com',
    role: userData.role || 'customer',
    status: userData.status || 'active',
    lastActive: 'Justo ahora',
    joinDate: new Date().toISOString().split('T')[0],
    avatar: userData.avatar || './assets/images/avatar-placeholder.svg',
    phone: userData.phone || '+57 300 000 0000',
    department: userData.department || 'Bolívar',
    city: userData.city || 'Cartagena de Indias',
    country: 'Colombia',
    ordersCount: userData.ordersCount || 0,
    totalSpent: userData.totalSpent || 0
  };
  users.unshift(newUser);
  saveUsersList(users);

  fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newUser)
  }).catch(() => {});

  return newUser;
}

export function updateUser(id, updatedFields) {
  const users = getUsersList();
  const index = users.findIndex(u => u.id === id);
  if (index !== -1) {
    users[index] = { ...users[index], ...updatedFields };
    saveUsersList(users);

    fetch(`/api/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedFields)
    }).catch(() => {});

    return users[index];
  }
  return null;
}

export function deleteUser(id) {
  const users = getUsersList();
  const filtered = users.filter(u => u.id !== id);
  saveUsersList(filtered);

  fetch(`/api/users/${id}`, { method: 'DELETE' }).catch(() => {});

  return filtered;
}

export function upsertCustomerFromOrder(customerInfo, orderTotal, city = 'Cartagena de Indias') {
  const users = getUsersList();
  const existing = users.find(u => u.email && customerInfo.email && u.email.toLowerCase() === customerInfo.email.toLowerCase());
  if (existing) {
    existing.ordersCount = (existing.ordersCount || 0) + 1;
    existing.totalSpent = (existing.totalSpent || 0) + orderTotal;
    existing.lastActive = 'Hace unos momentos';
    if (customerInfo.phone) existing.phone = customerInfo.phone;
    if (city) {
      existing.city = city;
      existing.department = 'Bolívar';
    }
  } else {
    const nextId = users.length > 0 ? Math.max(...users.map(u => (typeof u.id === 'number' ? u.id : 0))) + 1 : 1;
    users.push({
      id: nextId,
      name: customerInfo.name || 'Cliente Tienda',
      email: customerInfo.email || 'cliente@tienda.com',
      role: 'customer',
      status: 'active',
      lastActive: 'Hace unos momentos',
      joinDate: new Date().toISOString().split('T')[0],
      avatar: './assets/images/avatar-placeholder.svg',
      phone: customerInfo.phone || '+57 300 000 0000',
      department: 'Bolívar',
      city: city,
      country: 'Colombia',
      ordersCount: 1,
      totalSpent: orderTotal
    });
  }
  saveUsersList(users);
}

// ==============================================================================
// 4. COUPONS & DISCOUNTS API
// ==============================================================================

export function getCouponsList() {
  try {
    const raw = localStorage.getItem(COUPONS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading coupons from storage:', e);
  }
  saveCouponsList(INITIAL_COUPONS);
  return INITIAL_COUPONS;
}

export function saveCouponsList(coupons) {
  try {
    localStorage.setItem(COUPONS_STORAGE_KEY, JSON.stringify(coupons));
    window.dispatchEvent(new CustomEvent('omnistore:coupons-updated', { detail: coupons }));
  } catch (e) {
    console.error('Error saving coupons list:', e);
  }
}

export function addCoupon(data) {
  const coupons = getCouponsList();
  const nextId = Date.now();
  const newCoupon = {
    id: nextId,
    code: (data.code || 'PROMO').toUpperCase().trim(),
    type: data.type || 'percent', // 'percent', 'fixed', 'shipping'
    value: Number(data.value) || 10,
    minSpend: Number(data.minSpend) || 0,
    expiry: data.expiry || '2026-12-31',
    uses: 0,
    active: data.active !== undefined ? Boolean(data.active) : true,
    label: data.label || `${data.value}${data.type === 'percent' ? '%' : ' COP'} de descuento`
  };
  coupons.unshift(newCoupon);
  saveCouponsList(coupons);

  fetch('/api/coupons', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newCoupon)
  }).catch(() => {});

  return newCoupon;
}

export function updateCoupon(id, data) {
  const coupons = getCouponsList();
  const idx = coupons.findIndex(c => c.id === id);
  if (idx !== -1) {
    coupons[idx] = { ...coupons[idx], ...data };
    saveCouponsList(coupons);

    fetch(`/api/coupons/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).catch(() => {});

    return coupons[idx];
  }
  return null;
}

export function deleteCoupon(id) {
  const coupons = getCouponsList();
  const filtered = coupons.filter(c => c.id !== id);
  saveCouponsList(filtered);

  fetch(`/api/coupons/${id}`, { method: 'DELETE' }).catch(() => {});

  return filtered;
}

export function validateCoupon(code, cartTotal = 0) {
  const coupons = getCouponsList();
  const cleanCode = (code || '').toUpperCase().trim();
  const found = coupons.find(c => c.code === cleanCode && c.active);
  if (!found) return { valid: false, message: 'Cupón no válido o inactivo' };
  if (found.minSpend && cartTotal < found.minSpend) {
    return {
      valid: false,
      message: `Este cupón requiere una compra mínima de $ ${new Intl.NumberFormat('es-CO').format(found.minSpend)} COP`
    };
  }
  let discount = 0;
  if (found.type === 'percent') {
    discount = (cartTotal * found.value) / 100;
  } else if (found.type === 'fixed') {
    discount = Math.min(cartTotal, found.value);
  } else if (found.type === 'shipping') {
    discount = 0; // free shipping handled in checkout
  }
  return {
    valid: true,
    coupon: found,
    discountAmount: Math.round(discount),
    isFreeShipping: found.type === 'shipping',
    message: `¡Cupón ${found.code} aplicado con éxito!`
  };
}

// ==============================================================================
// 5. LOGISTICS & SHIPPING GUIDES API
// ==============================================================================

export function getShippingGuidesList() {
  try {
    const raw = localStorage.getItem(SHIPPING_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  saveShippingGuidesList(INITIAL_SHIPPING_GUIDES);
  return INITIAL_SHIPPING_GUIDES;
}

export function saveShippingGuidesList(guides) {
  try {
    localStorage.setItem(SHIPPING_STORAGE_KEY, JSON.stringify(guides));
    window.dispatchEvent(new CustomEvent('omnistore:shipping-updated', { detail: guides }));
  } catch (e) {}
}

export function addShippingGuide(guideData) {
  const guides = getShippingGuidesList();
  const newGuide = {
    id: guideData.id || ('GUIA-' + Math.floor(1000000 + Math.random() * 9000000)),
    carrier: guideData.carrier || 'Servientrega Express Cartagena',
    orderNumber: guideData.orderNumber || 'OMNI-CO-00000',
    customer: guideData.customer || 'Cliente',
    origin: guideData.origin || 'Centro de Distribución OmniStore - El Bosque, Cartagena',
    destination: guideData.destination || 'Cartagena de Indias',
    status: guideData.status || 'En Tránsito',
    eta: guideData.eta || 'Mismo día (2 a 6 horas)',
    trackingNumber: guideData.trackingNumber || ('TRK-CTG-' + Date.now())
  };
  guides.unshift(newGuide);
  saveShippingGuidesList(guides);
  return newGuide;
}

export function getCarriersList() {
  try {
    const raw = localStorage.getItem(CARRIERS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  saveCarriersList(INITIAL_CARRIERS);
  return INITIAL_CARRIERS;
}

export function saveCarriersList(carriers) {
  try {
    localStorage.setItem(CARRIERS_STORAGE_KEY, JSON.stringify(carriers));
    window.dispatchEvent(new CustomEvent('omnistore:carriers-updated', { detail: carriers }));
  } catch (e) {}
}

export function updateCarrier(id, updates) {
  const carriers = getCarriersList();
  const found = carriers.find(c => c.id === id);
  if (found) {
    Object.assign(found, updates);
    saveCarriersList(carriers);
    return found;
  }
  return null;
}

export function getShippingZonesList() {
  try {
    const raw = localStorage.getItem(ZONES_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  saveShippingZonesList(INITIAL_SHIPPING_ZONES);
  return INITIAL_SHIPPING_ZONES;
}

export function saveShippingZonesList(zones) {
  try {
    localStorage.setItem(ZONES_STORAGE_KEY, JSON.stringify(zones));
    window.dispatchEvent(new CustomEvent('omnistore:shipping-zones-updated', { detail: zones }));
  } catch (e) {}
}

export function updateShippingZone(id, updates) {
  const zones = getShippingZonesList();
  const found = zones.find(z => z.id === id);
  if (found) {
    Object.assign(found, updates);
    saveShippingZonesList(zones);
    return found;
  }
  return null;
}

// ==============================================================================
// 6. PAYMENTS & TRANSACTIONS API
// ==============================================================================

export function getPaymentsList() {
  try {
    const raw = localStorage.getItem(PAYMENTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  savePaymentsList(INITIAL_PAYMENTS);
  return INITIAL_PAYMENTS;
}

export function savePaymentsList(payments) {
  try {
    localStorage.setItem(PAYMENTS_STORAGE_KEY, JSON.stringify(payments));
    window.dispatchEvent(new CustomEvent('omnistore:payments-updated', { detail: payments }));
  } catch (e) {}
}

export function addPaymentRecord(data) {
  const payments = getPaymentsList();
  const nextId = 'PAY-COL-' + Math.floor(10000 + Math.random() * 90000);
  const newPay = {
    id: nextId,
    orderNumber: data.orderNumber || 'OMNI-CO-00000',
    method: data.method || 'PSE - Bancolombia',
    customer: data.customer || 'Cliente OmniStore',
    amount: Number(data.amount) || 0,
    date: new Date().toISOString().replace('T', ' ').slice(0, 16),
    status: data.status || 'Aprobado',
    ref: data.ref || ('WOMPI-' + Date.now()),
    fee: data.fee !== undefined ? data.fee : Math.round((Number(data.amount) || 0) * 0.025)
  };
  payments.unshift(newPay);
  savePaymentsList(payments);
  return newPay;
}

// ==============================================================================
// 7. INVENTORY KARDEX & SUPPLIERS API
// ==============================================================================

export function getKardexList() {
  try {
    const raw = localStorage.getItem(KARDEX_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  saveKardexList(INITIAL_KARDEX);
  return INITIAL_KARDEX;
}

export function saveKardexList(movements) {
  try {
    localStorage.setItem(KARDEX_STORAGE_KEY, JSON.stringify(movements));
    window.dispatchEvent(new CustomEvent('omnistore:kardex-updated', { detail: movements }));
  } catch (e) {}
}

export function addKardexMovement(data) {
  const kardex = getKardexList();
  const nextId = 'KDX-COL-' + Math.floor(1000 + Math.random() * 9000);
  const newMovement = {
    id: nextId,
    type: data.type || 'Ajuste Inventario',
    product: data.product || 'Producto',
    quantity: data.quantity || '0 und',
    date: new Date().toISOString().replace('T', ' ').slice(0, 16),
    user: data.user || 'Admin Cartagena',
    note: data.note || 'Movimiento registrado'
  };
  kardex.unshift(newMovement);
  saveKardexList(kardex);
  return newMovement;
}

export function getSuppliersList() {
  try {
    const raw = localStorage.getItem(SUPPLIERS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  saveSuppliersList(INITIAL_SUPPLIERS);
  return INITIAL_SUPPLIERS;
}

export function saveSuppliersList(suppliers) {
  try {
    localStorage.setItem(SUPPLIERS_STORAGE_KEY, JSON.stringify(suppliers));
  } catch (e) {}
}

// ==============================================================================
// 8. REVIEWS & RATINGS API
// ==============================================================================

export function getReviewsList() {
  try {
    const raw = localStorage.getItem(REVIEWS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  saveReviewsList(INITIAL_REVIEWS);
  return INITIAL_REVIEWS;
}

export function saveReviewsList(reviews) {
  try {
    localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(reviews));
    window.dispatchEvent(new CustomEvent('omnistore:reviews-updated', { detail: reviews }));
  } catch (e) {}
}

export function addReview(data) {
  const reviews = getReviewsList();
  const newRev = {
    id: Date.now(),
    productId: data.productId || null,
    product: data.product || 'Producto OmniStore',
    rating: Number(data.rating) || 5,
    author: data.author || 'Cliente',
    userId: data.userId || null,
    email: data.email || '',
    city: data.city || 'Cartagena de Indias',
    comment: data.comment || 'Excelente producto.',
    date: data.date || new Date().toISOString().split('T')[0],
    status: data.status || 'Aprobada'
  };
  reviews.unshift(newRev);
  saveReviewsList(reviews);

  fetch('/api/reviews', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newRev)
  }).catch(() => {});

  return newRev;
}

export function updateReviewStatus(id, status) {
  const reviews = getReviewsList();
  const found = reviews.find(r => r.id === id);
  if (found) {
    found.status = status;
    saveReviewsList(reviews);

    fetch(`/api/reviews/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    }).catch(() => {});

    return found;
  }
  return null;
}

export function deleteReview(id) {
  const reviews = getReviewsList();
  const filtered = reviews.filter(r => r.id !== id);
  saveReviewsList(filtered);

  fetch(`/api/reviews/${id}`, { method: 'DELETE' }).catch(() => {});

  return filtered;
}

// ==============================================================================
// 9. SUPPORT TICKETS API
// ==============================================================================

export function getTicketsList() {
  try {
    const raw = localStorage.getItem(TICKETS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  saveTicketsList(INITIAL_TICKETS);
  return INITIAL_TICKETS;
}

export function saveTicketsList(tickets) {
  try {
    localStorage.setItem(TICKETS_STORAGE_KEY, JSON.stringify(tickets));
    window.dispatchEvent(new CustomEvent('omnistore:tickets-updated', { detail: tickets }));
  } catch (e) {}
}

export function addTicket(data) {
  const tickets = getTicketsList();
  const nextId = 'TCK-' + new Date().getFullYear() + '-' + Math.floor(100 + Math.random() * 900);
  const newTicket = {
    id: nextId,
    subject: data.subject || 'Consulta General',
    customer: data.name || data.customer || 'Cliente OmniStore',
    email: data.email || 'cliente@ejemplo.com',
    priority: data.priority || 'Media',
    category: data.category || 'General',
    status: 'Abierto',
    date: new Date().toISOString().split('T')[0],
    replies: data.description ? [{ author: data.name || 'Cliente', message: data.description, date: new Date().toISOString().replace('T', ' ').slice(0, 16) }] : []
  };
  tickets.unshift(newTicket);
  saveTicketsList(tickets);
  return newTicket;
}

export function updateTicketStatus(id, status) {
  const tickets = getTicketsList();
  const found = tickets.find(t => t.id === id);
  if (found) {
    found.status = status;
    saveTicketsList(tickets);
    return found;
  }
  return null;
}

export function deleteTicket(id) {
  const tickets = getTicketsList();
  const filtered = tickets.filter(t => t.id !== id);
  saveTicketsList(filtered);
  return filtered;
}

export function replyTicket(id, message, author = 'Soporte OmniStore Cartagena') {
  const tickets = getTicketsList();
  const found = tickets.find(t => t.id === id);
  if (found) {
    found.replies = found.replies || [];
    found.replies.push({
      author,
      message,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16)
    });
    if (found.status === 'Abierto') found.status = 'En Proceso';
    saveTicketsList(tickets);
    return found;
  }
  return null;
}

// ==============================================================================
// 10. INVOICING & TAXES (DIAN) API
// ==============================================================================

export function getInvoicesList() {
  try {
    const raw = localStorage.getItem(INVOICES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  saveInvoicesList(INITIAL_INVOICES);
  return INITIAL_INVOICES;
}

export function saveInvoicesList(invoices) {
  try {
    localStorage.setItem(INVOICES_STORAGE_KEY, JSON.stringify(invoices));
    window.dispatchEvent(new CustomEvent('omnistore:invoices-updated', { detail: invoices }));
  } catch (e) {}
}

export function addInvoice(invoice) {
  const invoices = getInvoicesList();
  invoices.unshift(invoice);
  saveInvoicesList(invoices);
  return invoice;
}

export function createInvoiceFromOrder(order) {
  const invoices = getInvoicesList();
  const nextId = 'FE-' + new Date().getFullYear() + '-' + String(invoices.length + 483).padStart(5, '0');
  const total = order.total || 0;
  const subtotal = Math.round(total / 1.19);
  const iva = total - subtotal;
  const cufe = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

  const newInvoice = {
    id: nextId,
    cufe,
    orderId: order.orderNumber,
    customerName: order.customer?.name || 'Cliente',
    customerDoc: order.customer?.doc || 'CC ' + Math.floor(1000000000 + Math.random() * 900000000),
    customerEmail: order.customer?.email || 'cliente@ejemplo.com',
    customerCity: order.shippingCity || 'Cartagena de Indias',
    subtotal,
    iva,
    total,
    paymentMethod: order.paymentMethod || 'PSE',
    status: 'approved',
    issuedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
    dianResolution: 'Res. DIAN No. 18764000001 (Rango FE-1 a FE-50000)'
  };
  invoices.unshift(newInvoice);
  saveInvoicesList(invoices);
  return newInvoice;
}

// ==============================================================================
// 11. MARKETING BANNERS & CAMPAIGNS API
// ==============================================================================

export function getBannersList() {
  try {
    const raw = localStorage.getItem(BANNERS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  saveBannersList(INITIAL_BANNERS);
  return INITIAL_BANNERS;
}

export function saveBannersList(banners) {
  try {
    localStorage.setItem(BANNERS_STORAGE_KEY, JSON.stringify(banners));
    window.dispatchEvent(new CustomEvent('omnistore:banners-updated', { detail: banners }));
  } catch (e) {}
}

export function addBanner(banner) {
  const banners = getBannersList();
  const newBanner = { id: Date.now(), ...banner };
  banners.unshift(newBanner);
  saveBannersList(banners);
  return newBanner;
}

export function updateBanner(id, updates) {
  const banners = getBannersList();
  const found = banners.find(b => b.id === id);
  if (found) {
    Object.assign(found, updates);
    saveBannersList(banners);
    return found;
  }
  return null;
}

export function deleteBanner(id) {
  const banners = getBannersList();
  const filtered = banners.filter(b => b.id !== id);
  saveBannersList(filtered);
  return filtered;
}

export function getCampaignsList() {
  try {
    const raw = localStorage.getItem(CAMPAIGNS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  saveCampaignsList(INITIAL_CAMPAIGNS);
  return INITIAL_CAMPAIGNS;
}

export function saveCampaignsList(campaigns) {
  try {
    localStorage.setItem(CAMPAIGNS_STORAGE_KEY, JSON.stringify(campaigns));
    window.dispatchEvent(new CustomEvent('omnistore:campaigns-updated', { detail: campaigns }));
  } catch (e) {}
}

export function addCampaign(campaign) {
  const campaigns = getCampaignsList();
  const newCampaign = { id: Date.now(), ...campaign };
  campaigns.unshift(newCampaign);
  saveCampaignsList(campaigns);
  return newCampaign;
}

export function updateCampaign(id, updates) {
  const campaigns = getCampaignsList();
  const found = campaigns.find(c => c.id === id);
  if (found) {
    Object.assign(found, updates);
    saveCampaignsList(campaigns);
    return found;
  }
  return null;
}

// ==============================================================================
// 12. CONTENT (CMS PAGES & MENUS) API
// ==============================================================================

export function getPagesList() {
  try {
    const raw = localStorage.getItem(PAGES_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  savePagesList(INITIAL_PAGES);
  return INITIAL_PAGES;
}

export function savePagesList(pages) {
  try {
    localStorage.setItem(PAGES_STORAGE_KEY, JSON.stringify(pages));
    window.dispatchEvent(new CustomEvent('omnistore:pages-updated', { detail: pages }));
  } catch (e) {}
}

export function addPage(page) {
  const pages = getPagesList();
  const newPage = { id: Date.now(), ...page };
  pages.unshift(newPage);
  savePagesList(pages);
  return newPage;
}

export function updatePage(id, updates) {
  const pages = getPagesList();
  const found = pages.find(p => p.id === id);
  if (found) {
    Object.assign(found, updates);
    savePagesList(pages);
    return found;
  }
  return null;
}

export function deletePage(id) {
  const pages = getPagesList();
  const filtered = pages.filter(p => p.id !== id);
  savePagesList(filtered);
  return filtered;
}

export function getMenusList() {
  try {
    const raw = localStorage.getItem(MENUS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  saveMenusList(INITIAL_MENUS);
  return INITIAL_MENUS;
}

export function saveMenusList(menus) {
  try {
    localStorage.setItem(MENUS_STORAGE_KEY, JSON.stringify(menus));
    window.dispatchEvent(new CustomEvent('omnistore:menus-updated', { detail: menus }));
  } catch (e) {}
}

// ==============================================================================
// 13. STORE SETTINGS API
// ==============================================================================

export function getStoreSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  saveStoreSettings(INITIAL_SETTINGS);
  return INITIAL_SETTINGS;
}

export function saveStoreSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent('omnistore:settings-updated', { detail: settings }));
  } catch (e) {}
}

