import Alpine from 'alpinejs';
import Swal from 'sweetalert2';
import { Modal } from 'bootstrap';
import ApexCharts from '../utils/apex.js';
import { createSearchComponent } from '../utils/search-component.js';
import {
  getProductsCatalog,
  addProductToCatalog,
  updateProductInCatalog,
  deleteProductFromCatalog,
  getKardexList,
  saveKardexList,
  addKardexMovement,
  getSuppliersList,
  saveSuppliersList
} from '../utils/store-data.js';

document.addEventListener('alpine:init', () => {
  Alpine.data('productTable', () => ({
    products: [],
    filteredProducts: [],
    selectedProducts: [],
    currentPage: 1,
    itemsPerPage: 10,
    searchQuery: '',
    categoryFilter: '',
    stockFilter: '',
    sortField: 'name',
    sortDirection: 'asc',
    isLoading: false,
    chartsInitialized: false,
    charts: {},

    // Statistics
    stats: {
      total: 0,
      inStock: 0,
      lowStock: 0,
      totalValue: 0
    },

    categoryStats: [],

    // Form Modal State
    modalMode: 'create', // 'create' | 'edit'
    productModalInstance: null,
    productForm: {
      id: null,
      name: '',
      sku: '',
      category: 'electronics',
      price: '',
      originalPrice: '',
      stock: '',
      status: 'published',
      description: '',
      isFlashDeal: false,
      isBestSeller: false,
      hasFreeShipping: true,
    },

    // Tab State for Subviews
    activeTab: 'catalog', // 'catalog' | 'categories' | 'brands' | 'collections' | 'movements' | 'suppliers'

    categoriesList: [
      { id: 1, name: 'Electrónica & Tecnología', slug: 'electronics', count: 54, icon: 'bi-laptop', revenue: 84500000 },
      { id: 2, name: 'Audio & Sonido Pro', slug: 'audio', count: 38, icon: 'bi-headphones', revenue: 42100000 },
      { id: 3, name: 'Gamer & Computadores', slug: 'gaming', count: 62, icon: 'bi-controller', revenue: 95800000 },
      { id: 4, name: 'Hogar Inteligente & Cocina', slug: 'home', count: 45, icon: 'bi-house-heart', revenue: 36200000 },
      { id: 5, name: 'Calzado & Zapatillas', slug: 'shoes', count: 29, icon: 'bi-bag', revenue: 28900000 },
      { id: 6, name: 'Moda & Ropa Urbana', slug: 'clothing', count: 41, icon: 'bi-tag', revenue: 31400000 }
    ],

    brandsList: [
      { id: 1, name: 'Apple Colombia', tier: 'Distribuidor Autorizado', products: 18, warranty: '1 Año Oficial Apple' },
      { id: 2, name: 'Sony PlayStation', tier: 'Importador Directo', products: 14, warranty: '1 Año Oficial Sony' },
      { id: 3, name: 'Samsung Electronics', tier: 'Partner Premium', products: 22, warranty: '1 Año Oficial Samsung' },
      { id: 4, name: 'Logitech G', tier: 'Gamer Oficial', products: 16, warranty: '2 Años Garantía' },
      { id: 5, name: 'Xiaomi Colombia', tier: 'Distribuidor Oficial', products: 25, warranty: '1 Año Oficial' },
      { id: 6, name: 'Nike Sportswear', tier: '100% Original', products: 12, warranty: '6 Meses Garantía' }
    ],

    collectionsList: [
      { id: 1, title: 'Super Ofertas Relámpago Temu / AliExpress', badge: 'Hasta 80% OFF', desc: 'Promociones con descuento agresivo y domicilio gratis en Cartagena', count: 18 },
      { id: 2, title: 'Top 20 Los Más Vendidos Cartagena 2026', badge: 'Alta Demanda', desc: 'Los artículos preferidos por compradores en Bocagrande, Manga y Crespo', count: 20 },
      { id: 3, title: 'Zona Gamer & Streaming Setup', badge: 'Cuotas Sin Interés', desc: 'Monitores 165Hz, teclados mecánicos y consolas de última generación', count: 24 },
      { id: 4, title: 'Liquidación de Temporada', badge: 'Últimas Unidades', desc: 'Inventario de salida con descuentos adicionales para rotación de kardex', count: 15 }
    ],

    kardexMovements: [
      { id: 'KDX-COL-8012', type: 'Entrada Proveedor', product: 'Sony PlayStation 5 Slim 1TB', quantity: '+20 und', date: '2026-10-02 10:30', user: 'Admin Cartagena', note: 'Compra mayorista Mayorista Tech Caribe' },
      { id: 'KDX-COL-8011', type: 'Salida Venta', product: 'Apple MacBook Pro M3 14"', quantity: '-1 und', date: '2026-10-02 11:24', user: 'Sistema Tienda', note: 'Orden #OMNI-2026-84920' },
      { id: 'KDX-COL-8010', type: 'Salida Venta', product: 'Logitech G502 HERO Mouse', quantity: '-1 und', date: '2026-10-02 10:15', user: 'Sistema Tienda', note: 'Orden #OMNI-2026-84919' },
      { id: 'KDX-COL-8009', type: 'Entrada Devolución', product: 'Sony WH-1000XM5 Noise Canceling', quantity: '+1 und', date: '2026-10-01 16:45', user: 'Soporte Clientes', note: 'Cambio de color cliente' }
    ],

    suppliersList: [
      { id: 1, name: 'Mayorista Tech Caribe S.A.S.', nit: '900.548.120-1', city: 'Cartagena (Mamonal)', contact: 'Carlos Restrepo', phone: '+57 (605) 665-1200', terms: 'Crédito 30 días' },
      { id: 2, name: 'Distribuciones Gamer del Caribe', nit: '901.220.450-8', city: 'Cartagena (El Bosque)', contact: 'Marcela Hoyos', phone: '+57 (605) 665-9000', terms: 'Contado 5% Desc' },
      { id: 3, name: 'Importaciones Puerto Bahía S.A.', nit: '900.890.312-3', city: 'Cartagena (Centro Histórico)', contact: 'Andrés Buitrago', phone: '+57 (605) 664-3344', terms: 'Crédito 15 días' },
      { id: 4, name: 'Audio Pro Bolívar Ltda', nit: '830.012.890-5', city: 'Cartagena (Manga)', contact: 'Diana Morales', phone: '+57 (605) 660-1122', terms: 'Crédito 45 días' }
    ],

    setTab(tab) {
      this.activeTab = tab;
      const url = new URL(window.location.href);
      if (['categories', 'brands', 'collections'].includes(tab)) {
        url.searchParams.delete('tab');
        url.searchParams.set('view', tab);
      } else {
        url.searchParams.delete('view');
        url.searchParams.set('tab', tab);
      }
      window.history.replaceState({}, '', url.toString());
    },

    handleRouteNavigation(search) {
      const urlParams = new URLSearchParams(search !== undefined ? search : window.location.search);
      const tabParam = urlParams.get('tab');
      const viewParam = urlParams.get('view');
      const categoryParam = urlParams.get('category');

      if (viewParam === 'categories' || viewParam === 'brands' || viewParam === 'collections') {
        this.activeTab = viewParam;
        this.stockFilter = '';
      } else if (tabParam === 'movements' || tabParam === 'suppliers') {
        this.activeTab = tabParam;
        this.stockFilter = '';
      } else if (tabParam === 'low-stock') {
        this.stockFilter = 'low';
        this.activeTab = 'catalog';
      } else if (tabParam === 'inventory') {
        this.activeTab = 'catalog';
        this.stockFilter = '';
      } else {
        this.activeTab = 'catalog';
        this.stockFilter = '';
      }

      if (categoryParam) {
        this.categoryFilter = categoryParam;
      } else if (!viewParam && !tabParam) {
        this.categoryFilter = '';
      }

      if (this.products.length > 0) {
        this.filterProducts();
        this.calculateStats();
      }
    },

    init() {
      this.handleRouteNavigation();
      this.loadData();

      window.addEventListener('omnistore:navigate', (e) => {
        this.handleRouteNavigation(e.detail?.search);
      });

      window.addEventListener('popstate', () => {
        this.handleRouteNavigation();
      });

      // Listen for global catalog updates
      window.addEventListener('omnistore:catalog-updated', (e) => {
        if (e.detail) {
          this.products = e.detail;
          this.filterProducts();
          this.calculateStats();
        }
      });

      window.addEventListener('omnistore:kardex-updated', (e) => {
        if (e.detail && Array.isArray(e.detail)) {
          this.kardexMovements = e.detail;
        }
      });

      // Setup bootstrap modal instance
      setTimeout(() => {
        const modalEl = document.getElementById('productModal');
        if (modalEl) {
          this.productModalInstance = new Modal(modalEl);
        }
        this.initCharts();
      }, 300);
    },

    loadData() {
      this.products = getProductsCatalog();
      this.kardexMovements = getKardexList();
      this.suppliersList = getSuppliersList();
      this.filterProducts();
      this.calculateStats();
    },

    adjustStockPrompt(product) {
      Swal.fire({
        title: `Ajustar Stock: ${product.name.slice(0, 35)}...`,
        html: `
          <div class="text-start p-2">
            <p class="mb-1"><strong>Stock Actual:</strong> <span class="badge bg-secondary fs-6">${product.stock} unidades</span></p>
            <label class="form-label small fw-bold mt-2">Nuevo Stock:</label>
            <input type="number" id="swal-new-stock" class="form-control" value="${product.stock}" min="0">
            <label class="form-label small fw-bold mt-2">Motivo / Nota de Kardex:</label>
            <input type="text" id="swal-stock-note" class="form-control" placeholder="Ej. Conteo físico de inventario o reposición">
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Guardar Ajuste',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#ff5722',
        preConfirm: () => {
          const newStock = parseInt(document.getElementById('swal-new-stock').value, 10);
          const note = document.getElementById('swal-stock-note').value.trim() || 'Ajuste manual de stock';
          if (isNaN(newStock) || newStock < 0) {
            Swal.showValidationMessage('Ingresa un número de stock válido');
            return false;
          }
          return { newStock, note };
        }
      }).then((res) => {
        if (res.isConfirmed && res.value) {
          updateProductInCatalog(product.id, { stock: res.value.newStock });
          this.loadData();
          this.showNotification(`Stock de ${product.name} actualizado a ${res.value.newStock}`, 'success');
        }
      });
    },

    addSupplierPrompt() {
      Swal.fire({
        title: 'Registrar Proveedor Mayorista',
        html: `
          <div class="text-start">
            <label class="form-label small fw-bold">Razón Social:</label>
            <input id="swal-sup-name" class="form-control form-control-sm mb-2" placeholder="Tech Global Colombia S.A.S.">
            <label class="form-label small fw-bold">NIT:</label>
            <input id="swal-sup-nit" class="form-control form-control-sm mb-2" placeholder="901.890.340-1">
            <label class="form-label small fw-bold">Sector / Ubicación (Cartagena):</label>
            <input id="swal-sup-city" class="form-control form-control-sm mb-2" placeholder="Cartagena (Mamonal / El Bosque)">
            <label class="form-label small fw-bold">Contacto Principal:</label>
            <input id="swal-sup-contact" class="form-control form-control-sm mb-2" placeholder="Carlos Restrepo">
            <label class="form-label small fw-bold">Teléfono / Celular:</label>
            <input id="swal-sup-phone" class="form-control form-control-sm mb-2" placeholder="+57 300 123 4567">
            <label class="form-label small fw-bold">Condiciones de Pago:</label>
            <input id="swal-sup-terms" class="form-control form-control-sm mb-2" placeholder="Crédito 30 días">
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Registrar Proveedor',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#ff5722',
        preConfirm: () => {
          const name = document.getElementById('swal-sup-name').value.trim();
          const nit = document.getElementById('swal-sup-nit').value.trim();
          const city = document.getElementById('swal-sup-city').value.trim();
          const contact = document.getElementById('swal-sup-contact').value.trim();
          const phone = document.getElementById('swal-sup-phone').value.trim();
          const terms = document.getElementById('swal-sup-terms').value.trim();
          if (!name) {
            Swal.showValidationMessage('Ingresa el nombre del proveedor');
            return false;
          }
          return { name, nit, city, contact, phone, terms };
        }
      }).then((res) => {
        if (res.isConfirmed && res.value) {
          const list = getSuppliersList();
          const newSup = { id: Date.now(), ...res.value };
          list.unshift(newSup);
          saveSuppliersList(list);
          this.suppliersList = list;
          this.showNotification(`Proveedor ${newSup.name} registrado con éxito`, 'success');
        }
      });
    },

    addMovementPrompt() {
      const prods = getProductsCatalog();
      const options = prods.map(p => `<option value="${p.name}">${p.name}</option>`).join('');
      Swal.fire({
        title: 'Registrar Movimiento de Kardex',
        html: `
          <div class="text-start">
            <label class="form-label small fw-bold">Tipo de Movimiento:</label>
            <select id="swal-kdx-type" class="form-select form-select-sm mb-2">
              <option value="Entrada Proveedor">Entrada Proveedor (+)</option>
              <option value="Entrada Devolución">Entrada Devolución (+)</option>
              <option value="Ajuste Físico (+)">Ajuste Físico (+)</option>
              <option value="Salida Merma / Daño">Salida Merma / Daño (-)</option>
            </select>
            <label class="form-label small fw-bold">Producto:</label>
            <select id="swal-kdx-prod" class="form-select form-select-sm mb-2">${options}</select>
            <label class="form-label small fw-bold">Cantidad de Unidades:</label>
            <input id="swal-kdx-qty" type="number" class="form-control form-control-sm mb-2" placeholder="Ej. 10">
            <label class="form-label small fw-bold">Observación / Documento Soporte:</label>
            <input id="swal-kdx-note" class="form-control form-control-sm mb-2" placeholder="Factura de compra #1289">
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Registrar Movimiento',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#ff5722',
        preConfirm: () => {
          const type = document.getElementById('swal-kdx-type').value;
          const product = document.getElementById('swal-kdx-prod').value;
          const qty = Number(document.getElementById('swal-kdx-qty').value) || 0;
          const note = document.getElementById('swal-kdx-note').value.trim() || 'Movimiento manual';
          if (qty <= 0) {
            Swal.showValidationMessage('Ingresa una cantidad mayor a 0');
            return false;
          }
          return { type, product, quantity: `${type.includes('Salida') ? '-' : '+'}${qty} und`, note, user: 'Admin Colombia' };
        }
      }).then((res) => {
        if (res.isConfirmed && res.value) {
          addKardexMovement(res.value);
          this.kardexMovements = getKardexList();
          this.showNotification('Movimiento registrado en kardex', 'success');
        }
      });
    },

    filterProducts() {
      let result = [...this.products];

      // Search filter
      if (this.searchQuery.trim() !== '') {
        const q = this.searchQuery.toLowerCase().trim();
        result = result.filter(p =>
          (p.name && p.name.toLowerCase().includes(q)) ||
          (p.sku && p.sku.toLowerCase().includes(q)) ||
          (p.category && p.category.toLowerCase().includes(q))
        );
      }

      // Category filter
      if (this.categoryFilter !== '') {
        result = result.filter(p => p.category === this.categoryFilter);
      }

      // Stock filter
      if (this.stockFilter === 'in_stock') {
        result = result.filter(p => p.stock > 10);
      } else if (this.stockFilter === 'low_stock') {
        result = result.filter(p => p.stock > 0 && p.stock <= 10);
      } else if (this.stockFilter === 'out_of_stock') {
        result = result.filter(p => p.stock === 0);
      }

      // Sort
      result.sort((a, b) => {
        let fieldA = a[this.sortField];
        let fieldB = b[this.sortField];

        if (typeof fieldA === 'string') fieldA = fieldA.toLowerCase();
        if (typeof fieldB === 'string') fieldB = fieldB.toLowerCase();

        if (fieldA < fieldB) return this.sortDirection === 'asc' ? -1 : 1;
        if (fieldA > fieldB) return this.sortDirection === 'asc' ? 1 : -1;
        return 0;
      });

      this.filteredProducts = result;
      this.currentPage = 1;
    },

    sortBy(field) {
      if (this.sortField === field) {
        this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        this.sortField = field;
        this.sortDirection = 'asc';
      }
      this.filterProducts();
    },

    calculateStats() {
      const total = this.products.length;
      const inStock = this.products.filter(p => Number(p.stock) > 0).length;
      const lowStock = this.products.filter(p => Number(p.stock) > 0 && Number(p.stock) <= 10).length;
      const totalVal = this.products.reduce((acc, p) => acc + ((Number(p.price) || 0) * (Number(p.stock) || 0)), 0);

      this.stats = {
        total,
        inStock,
        lowStock,
        totalValue: totalVal
      };

      // Calculate Category Breakdown
      const counts = {};
      this.products.forEach(p => {
        const cat = p.category || 'other';
        counts[cat] = (counts[cat] || 0) + 1;
      });

      const catColors = {
        electronics: '#2563eb',
        audio: '#06b6d4',
        gaming: '#e11d48',
        home: '#10b981',
        shoes: '#f59e0b',
        clothing: '#8b5cf6',
        beauty: '#ec4899',
        tools: '#64748b'
      };

      this.categoryStats = Object.keys(counts).map(key => ({
        name: key.charAt(0).toUpperCase() + key.slice(1),
        count: counts[key],
        color: catColors[key] || '#94a3b8'
      }));

      // Update category chart if initialized
      if (this.charts.category) {
        this.charts.category.updateSeries(this.categoryStats.map(c => c.count));
        this.charts.category.updateOptions({ labels: this.categoryStats.map(c => c.name) });
      }
    },

    // Modal Add / Edit Operations
    openCreateModal() {
      this.modalMode = 'create';
      this.productForm = {
        id: null,
        name: '',
        sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
        category: 'electronics',
        price: '',
        originalPrice: '',
        stock: 25,
        status: 'published',
        description: '',
        isFlashDeal: false,
        isBestSeller: false,
        hasFreeShipping: true,
        isFullShipping: true
      };
      if (this.productModalInstance) {
        this.productModalInstance.show();
      }
    },

    openEditModal(product) {
      this.modalMode = 'edit';
      this.productForm = {
        id: product.id,
        name: product.name || '',
        sku: product.sku || '',
        category: product.category || 'electronics',
        price: product.price || '',
        originalPrice: product.originalPrice || '',
        stock: product.stock !== undefined ? product.stock : 10,
        status: product.status || 'published',
        description: product.description || '',
        isFlashDeal: Boolean(product.isFlashDeal),
        isBestSeller: Boolean(product.isBestSeller),
        hasFreeShipping: product.hasFreeShipping !== undefined ? Boolean(product.hasFreeShipping) : true,
        isFullShipping: product.isFullShipping !== undefined ? Boolean(product.isFullShipping) : true
      };
      if (this.productModalInstance) {
        this.productModalInstance.show();
      }
    },

    saveProductForm() {
      if (!this.productForm.name || !this.productForm.price || this.productForm.stock === '') {
        Swal.fire('Campos requeridos', 'Por favor ingresa el nombre, precio y cantidad de stock del producto.', 'warning');
        return;
      }

      if (this.modalMode === 'create') {
        const created = addProductToCatalog(this.productForm);
        this.loadData();
        if (this.productModalInstance) this.productModalInstance.hide();

        Swal.fire({
          icon: 'success',
          title: '¡Producto Publicado con Éxito!',
          html: `El producto <b>${created.name}</b> ya está activo y visible en la <b>Tienda OmniStore</b> para que los clientes puedan comprarlo.`,
          confirmButtonColor: '#ff5722'
        });
      } else {
        const updated = updateProductInCatalog(this.productForm.id, this.productForm);
        this.loadData();
        if (this.productModalInstance) this.productModalInstance.hide();

        Swal.fire({
          icon: 'success',
          title: '¡Producto Actualizado!',
          text: `Los cambios en ${updated ? updated.name : 'el producto'} han sido guardados y sincronizados.`,
          timer: 2000,
          showConfirmButton: false
        });
      }
    },

    deleteProduct(product) {
      Swal.fire({
        title: '¿Eliminar producto?',
        text: `¿Estás seguro de que deseas eliminar "${product.name}"? Se retirará de la tienda online.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
      }).then((result) => {
        if (result.isConfirmed) {
          deleteProductFromCatalog(product.id);
          this.loadData();
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Producto eliminado',
            showConfirmButton: false,
            timer: 2000
          });
        }
      });
    },

    togglePublishStatus(product) {
      const newStatus = product.status === 'published' ? 'draft' : 'published';
      updateProductInCatalog(product.id, { status: newStatus });
      this.loadData();

      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: newStatus === 'published' ? 'success' : 'info',
        title: newStatus === 'published' ? '¡Producto publicado en Tienda!' : 'Producto guardado como Borrador',
        showConfirmButton: false,
        timer: 2000
      });
    },

    duplicateProduct(product) {
      const copy = {
        ...product,
        name: `${product.name} (Copia)`,
        sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`
      };
      delete copy.id;
      addProductToCatalog(copy);
      this.loadData();

      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Producto duplicado con éxito',
        showConfirmButton: false,
        timer: 2000
      });
    },

    exportProducts() {
      const headers = ['ID', 'Nombre', 'SKU', 'Categoría', 'Precio', 'Stock', 'Estado'];
      const rows = this.products.map(p => [
        p.id,
        `"${(p.name || '').replace(/"/g, '""')}"`,
        p.sku,
        p.category,
        p.price,
        p.stock,
        p.status
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `omnistore_catalogo_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },

    importDemoProducts() {
      const demoItems = [
        { name: 'Tablet Ultra Pro 11" 128GB WiFi 6', sku: 'TAB-PRO-11', category: 'electronics', price: 899000, originalPrice: 1199000, stock: 15, status: 'published', description: 'Pantalla 2K y procesador octa-core' },
        { name: 'Silla Gamer Ergonómica con Cojín Lumbar', sku: 'CHAIR-GAMING-01', category: 'gaming', price: 649000, originalPrice: 850000, stock: 8, status: 'published', description: 'Reclinable 180° y reposabrazos 3D' },
        { name: 'Cafetera Espresso Automática 20 Bares', sku: 'COFFEE-ESP-20B', category: 'home', price: 399000, originalPrice: 520000, stock: 12, status: 'published', description: 'Vaporizador de leche para cappuccino' }
      ];

      demoItems.forEach(item => addProductToCatalog(item));
      this.loadData();

      const importModalEl = document.getElementById('importModal');
      if (importModalEl) {
        const modal = Modal.getInstance(importModalEl);
        if (modal) modal.hide();
      }

      Swal.fire({
        icon: 'success',
        title: '¡Productos importados!',
        text: 'Se han añadido nuevos productos demo al catálogo de OmniStore.',
        confirmButtonColor: '#ff5722'
      });
    },

    // Chart Initializations
    initCharts() {
      this.initSalesChart();
      this.initCategoryChart();
    },

    initSalesChart() {
      const salesChart = document.getElementById('salesChart');
      if (!salesChart) return;
      salesChart.innerHTML = '';

      try {
        const salesData = {
          series: [{
            name: 'Ventas Semanales ($ COP)',
            data: [4200000, 5800000, 6900000, 8400000, 7800000, 11200000, 14500000]
          }],
          chart: {
            type: 'area',
            height: 250,
            width: '100%',
            toolbar: { show: false }
          },
          colors: ['#ff5722'],
          fill: {
            type: 'gradient',
            gradient: {
              shadeIntensity: 1,
              opacityFrom: 0.6,
              opacityTo: 0.1
            }
          },
          stroke: {
            curve: 'smooth',
            width: 2.5
          },
          xaxis: {
            categories: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
          },
          yaxis: {
            labels: {
              formatter: (val) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', notation: 'compact', maximumFractionDigits: 1 }).format(val)
            }
          }
        };

        const chart = new ApexCharts(salesChart, salesData);
        chart.render();
        this.charts.sales = chart;
      } catch (error) {
        console.error('Error rendering sales chart:', error);
      }
    },

    initCategoryChart() {
      const categoryChart = document.getElementById('categoryChart');
      if (!categoryChart) return;
      categoryChart.innerHTML = '';

      try {
        const chartData = {
          series: this.categoryStats.length > 0 ? this.categoryStats.map(cat => cat.count) : [5, 4, 3, 2],
          chart: {
            type: 'donut',
            height: 220,
            width: '100%'
          },
          labels: this.categoryStats.length > 0 ? this.categoryStats.map(cat => cat.name) : ['Tech', 'Hogar', 'Gamer', 'Moda'],
          colors: this.categoryStats.length > 0 ? this.categoryStats.map(cat => cat.color) : ['#2563eb', '#10b981', '#e11d48', '#f59e0b'],
          plotOptions: {
            pie: {
              donut: {
                size: '65%'
              }
            }
          },
          legend: {
            position: 'bottom',
            fontSize: '11px'
          }
        };

        const chart = new ApexCharts(categoryChart, chartData);
        chart.render();
        this.charts.category = chart;
      } catch (error) {
        console.error('Error rendering category chart:', error);
      }
    },

    // Price formatting helper for COP
    formatPrice(amount) {
      const num = typeof amount === 'number' ? amount : (parseFloat(amount) || 0);
      return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0
      }).format(num);
    },

    // Pagination
    get paginatedProducts() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      const end = start + this.itemsPerPage;
      return this.filteredProducts.slice(start, end);
    },

    get totalPages() {
      return Math.ceil(this.filteredProducts.length / this.itemsPerPage) || 1;
    },

    get visiblePages() {
      if (this.totalPages <= 1) return [1];
      const pages = [];
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
      return pages;
    },

    goToPage(page) {
      if (page >= 1 && page <= this.totalPages) {
        this.currentPage = page;
      }
    }
  }));

  // Global search component for header
  Alpine.data('searchComponent', createSearchComponent({ getResults: () => [] }));

  // Global theme switcher
  Alpine.data('themeSwitch', () => ({
    currentTheme: 'light',
    init() {
      this.currentTheme = localStorage.getItem('theme') || 'light';
      document.documentElement.setAttribute('data-bs-theme', this.currentTheme);
    },
    toggle() {
      this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-bs-theme', this.currentTheme);
      localStorage.setItem('theme', this.currentTheme);
    }
  }));
});