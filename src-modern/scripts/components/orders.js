import Alpine from 'alpinejs';
import Swal from 'sweetalert2';
import ApexCharts from '../utils/apex.js';
import { categorical, STATUS, axisInk, gridLine } from '../utils/chart-palette.js';
import { createSearchComponent } from '../utils/search-component.js';
import {
  getOrdersList,
  saveOrdersList,
  updateOrderStatus,
  deleteOrder,
  getPaymentsList,
  savePaymentsList,
  addPaymentRecord,
  getShippingGuidesList,
  saveShippingGuidesList,
  addShippingGuide,
  createStoreOrder,
  getProductsCatalog
} from '../utils/store-data.js';

function isDarkMode() {
  return document.documentElement.getAttribute('data-bs-theme') === 'dark';
}

document.addEventListener('alpine:init', () => {
  Alpine.data('orderTable', () => ({
    orders: [],
    filteredOrders: [],
    selectedOrders: [],
    currentPage: 1,
    itemsPerPage: 10,
    searchQuery: '',
    statusFilter: '',
    dateFilter: '',
    sortField: 'orderNumber',
    sortDirection: 'desc',
    isLoading: false,
    chartsInitialized: false,

    // Statistics
    stats: {
      total: 0,
      pending: 0,
      shipped: 0,
      revenue: 0
    },

    statusStats: [],
    activeTab: 'orders', // 'orders' | 'payments' | 'shipping'

    // Colombian Payment Gateway Transactions
    paymentsList: [],

    // Colombian Carrier Shipments & Guías
    shippingList: [],

    setTab(tab) {
      this.activeTab = tab;
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tab);
      window.history.replaceState({}, '', url.toString());
    },

    handleRouteNavigation(search) {
      const urlParams = new URLSearchParams(search !== undefined ? search : window.location.search);
      const tabParam = urlParams.get('tab');
      if (tabParam === 'payments' || tabParam === 'shipping' || tabParam === 'orders') {
        this.activeTab = tabParam;
      } else {
        this.activeTab = 'orders';
      }

      const filterParam = urlParams.get('filter');
      if (filterParam) {
        if (filterParam === 'abandoned' || filterParam === 'pending') {
          this.statusFilter = 'pending';
        } else if (filterParam === 'refunded') {
          this.statusFilter = 'cancelled';
        } else if (filterParam === 'processing') {
          this.statusFilter = 'processing';
        } else {
          this.statusFilter = filterParam;
        }
      } else {
        this.statusFilter = '';
      }

      if (this.orders.length > 0) {
        this.filterOrders();
        this.calculateStats();
      }
    },

    init() {
      this.handleRouteNavigation();
      this.loadOrdersData();

      window.addEventListener('omnistore:navigate', (e) => {
        this.handleRouteNavigation(e.detail?.search);
      });

      window.addEventListener('popstate', () => {
        this.handleRouteNavigation();
      });

      // Listen for global order updates from checkout or admin actions
      window.addEventListener('omnistore:orders-updated', (e) => {
        if (e.detail && Array.isArray(e.detail)) {
          this.orders = e.detail;
          this.filterOrders();
          this.calculateStats();
        }
      });

      window.addEventListener('omnistore:payments-updated', (e) => {
        if (e.detail && Array.isArray(e.detail)) {
          this.paymentsList = e.detail;
        }
      });

      window.addEventListener('omnistore:shipping-updated', (e) => {
        if (e.detail && Array.isArray(e.detail)) {
          this.shippingList = e.detail;
        }
      });

      window.addEventListener('omnistore:theme-change', () => {
        this.destroyCharts();
        setTimeout(() => {
          this.initCharts();
        }, 50);
      });
      
      // Delay chart initialization to ensure DOM is fully ready
      setTimeout(() => {
        this.initCharts();
      }, 500);
    },

    loadOrdersData() {
      this.orders = getOrdersList();
      this.paymentsList = getPaymentsList();
      this.shippingList = getShippingGuidesList();
      this.filterOrders();
      this.calculateStats();
    },

    calculateStats() {
      this.stats.total = this.orders.length;
      this.stats.pending = this.orders.filter(o => o.status === 'pending').length;
      this.stats.shipped = this.orders.filter(o => o.status === 'shipped').length;
      this.stats.revenue = this.orders
        .filter(o => o.status !== 'cancelled')
        .reduce((sum, o) => sum + (Number(o.total) || 0), 0);

      // Status labels in Spanish for Colombian store
      const statusLabels = {
        pending: 'Pendiente de Pago',
        processing: 'En Preparación',
        shipped: 'Enviado / En Tránsito',
        delivered: 'Entregado',
        cancelled: 'Cancelado'
      };

      const statuses = {};
      this.orders.forEach(order => {
        const s = order.status || 'pending';
        statuses[s] = (statuses[s] || 0) + 1;
      });

      this.statusStats = Object.entries(statuses).map(([key, count]) => ({
        key,
        name: statusLabels[key] || (key.charAt(0).toUpperCase() + key.slice(1)),
        count,
        percentage: Math.round((count / (this.orders.length || 1)) * 100),
        color: this.getStatusColor(key)
      }));
    },

    formatPrice(amount) {
      const num = typeof amount === 'number' ? amount : (parseFloat(amount) || 0);
      return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0
      }).format(num);
    },

    formatDate(dateStr) {
      if (!dateStr) return '-';
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('es-CO', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    },

    getStatusColor(status) {
      const colors = {
        pending: STATUS.warning,
        processing: STATUS.info,
        shipped: STATUS.info,
        delivered: STATUS.success,
        cancelled: STATUS.danger
      };
      return colors[status] || STATUS.neutral;
    },

    filterOrders() {
      this.filteredOrders = this.orders.filter(order => {
        const matchesSearch = !this.searchQuery || 
          (order.orderNumber && order.orderNumber.toLowerCase().includes(this.searchQuery.toLowerCase())) ||
          (order.customer && order.customer.name && order.customer.name.toLowerCase().includes(this.searchQuery.toLowerCase())) ||
          (order.customer && order.customer.email && order.customer.email.toLowerCase().includes(this.searchQuery.toLowerCase()));
        
        const matchesStatus = !this.statusFilter || order.status === this.statusFilter;
        const matchesDate = !this.dateFilter || this.matchesDateFilter(order.orderDate);

        return matchesSearch && matchesStatus && matchesDate;
      });

      this.sortOrders();
      this.currentPage = 1;
    },

    matchesDateFilter(orderDate) {
      const today = new Date();
      const orderDateObj = new Date(orderDate);
      
      switch (this.dateFilter) {
        case 'today':
          return orderDateObj.toDateString() === today.toDateString();
        case 'week':
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          return orderDateObj >= weekAgo;
        case 'month':
          const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
          return orderDateObj >= monthAgo;
        default:
          return true;
      }
    },

    sortOrders() {
      this.filteredOrders.sort((a, b) => {
        let aVal = a[this.sortField];
        let bVal = b[this.sortField];

        if (this.sortField === 'total') {
          aVal = parseFloat(aVal) || 0;
          bVal = parseFloat(bVal) || 0;
        } else if (this.sortField === 'orderDate') {
          aVal = new Date(aVal);
          bVal = new Date(bVal);
        } else {
          aVal = (aVal || '').toString().toLowerCase();
          bVal = (bVal || '').toString().toLowerCase();
        }

        if (this.sortDirection === 'asc') {
          return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        } else {
          return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
        }
      });
    },

    sortBy(field) {
      if (this.sortField === field) {
        this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        this.sortField = field;
        this.sortDirection = 'asc';
      }
      this.filterOrders();
    },

    toggleAll(checked) {
      if (checked) {
        this.selectedOrders = this.paginatedOrders.map(o => o.id);
      } else {
        this.selectedOrders = [];
      }
    },

    bulkAction(action) {
      if (this.selectedOrders.length === 0) return;

      const selectedOrderObjects = this.orders.filter(o => 
        this.selectedOrders.includes(o.id)
      );

      switch (action) {
        case 'processing':
          selectedOrderObjects.forEach(order => {
            if (order.status === 'pending') {
              order.status = 'processing';
            }
          });
          this.showNotification('¡Pedidos marcados en procesamiento!', 'success');
          break;
        case 'shipped':
          selectedOrderObjects.forEach(order => {
            if (order.status === 'processing' || order.status === 'pending') {
              order.status = 'shipped';
            }
          });
          this.showNotification('¡Pedidos marcados como enviados!', 'success');
          break;
        case 'delivered':
          selectedOrderObjects.forEach(order => {
            if (order.status === 'shipped' || order.status === 'processing') {
              order.status = 'delivered';
            }
          });
          this.showNotification('¡Pedidos marcados como entregados!', 'success');
          break;
      }

      this.selectedOrders = [];
      saveOrdersList(this.orders);
      this.filterOrders();
      this.calculateStats();
    },

    updateOrderStatus(order, newStatus) {
      order.status = newStatus;
      saveOrdersList(this.orders);
      this.filterOrders();
      this.calculateStats();
      this.showNotification(`Pedido ${order.orderNumber} actualizado a: ${newStatus}`, 'success');
    },

    viewOrder(order) {
      const itemsHtml = (order.items || []).map(i => `
        <li class="d-flex justify-content-between py-1 border-bottom">
          <span>${i.name || 'Producto'} (x${i.quantity || 1})</span>
          <span class="fw-bold text-primary">${this.formatPrice((Number(i.price) || 0) * (Number(i.quantity) || 1))}</span>
        </li>
      `).join('');

      Swal.fire({
        title: `Detalle del Pedido ${order.orderNumber}`,
        html: `
          <div class="text-start small p-2">
            <p class="mb-1"><strong>Cliente:</strong> ${order.customer?.name || 'Cliente'} &lt;${order.customer?.email || ''}&gt;</p>
            <p class="mb-1"><strong>Teléfono:</strong> ${order.customer?.phone || 'No registrado'}</p>
            <p class="mb-1"><strong>Fecha:</strong> ${this.formatDate(order.orderDate)}</p>
            <p class="mb-1"><strong>Estado:</strong> <span class="badge bg-primary text-uppercase">${order.status}</span></p>
            <p class="mb-2"><strong>Dirección de Envío:</strong> ${order.shippingAddress || 'Cartagena de Indias, Bolívar'}</p>
            <div class="mt-3">
              <strong>Artículos del Pedido:</strong>
              <ul class="list-unstyled mt-1 mb-0">${itemsHtml}</ul>
            </div>
            <div class="d-flex justify-content-between mt-3 pt-2 border-top fw-bold fs-6">
              <span>Total Pedido:</span>
              <span class="text-primary">${this.formatPrice(order.total)}</span>
            </div>
          </div>
        `,
        confirmButtonText: 'Cerrar',
        confirmButtonColor: '#ff5722'
      });
    },

    trackOrder(order) {
      Swal.fire({
        title: `Rastreo de Domicilio en Cartagena`,
        html: `
          <div class="text-start p-2">
            <p class="mb-1"><strong>Nº de Guía / Pedido:</strong> <span class="badge bg-dark">${order.orderNumber}</span></p>
            <p class="mb-1"><strong>Destino:</strong> ${order.shippingAddress || 'Cartagena de Indias'}</p>
            <p class="mb-1"><strong>Transportadora:</strong> Domicilio Express Cartagena / CEDI El Bosque</p>
            <div class="alert alert-info mt-3 mb-0">
              <i class="bi bi-truck me-2"></i><strong>Estado Logístico:</strong> 
              ${order.status === 'delivered' ? 'Entregado al comprador con firma en Cartagena' : (order.status === 'shipped' ? 'En ruta de entrega local en Cartagena' : 'En CEDI El Bosque preparando despacho')}
            </div>
          </div>
        `,
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#ff5722'
      });
    },

    printInvoice(order) {
      const orderNum = order.orderNumber || 'PEDIDO-001';
      const cust = order.customer || { name: 'Cliente OmniStore', email: 'cliente@ejemplo.com' };
      const items = order.items || [];
      const totalNum = typeof order.total === 'number' ? order.total : (parseFloat(order.total) || 0);
      const baseNum = Math.round(totalNum / 1.19);
      const ivaNum = totalNum - baseNum;
      const cufe = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      const invoiceNumber = 'FE-2026-' + (orderNum.replace(/\D/g, '') || '4890');

      const itemsHtml = items.map(it => `
        <tr>
          <td style="padding: 6px; border-bottom: 1px solid #ddd;">${it.name || 'Artículo'}</td>
          <td style="padding: 6px; border-bottom: 1px solid #ddd; text-align: center;">${it.quantity || 1}</td>
          <td style="padding: 6px; border-bottom: 1px solid #ddd; text-align: right;">${this.formatPrice(it.price || 0)}</td>
          <td style="padding: 6px; border-bottom: 1px solid #ddd; text-align: right;">${this.formatPrice((it.price || 0) * (it.quantity || 1))}</td>
        </tr>
      `).join('');

      Swal.fire({
        title: `Factura Electrónica DIAN: ${invoiceNumber}`,
        width: '780px',
        html: `
          <div class="text-start p-2" id="printable-dian-invoice" style="font-family: Arial, sans-serif; font-size: 13px;">
            <div class="d-flex justify-content-between align-items-start border-bottom pb-3 mb-3">
              <div>
                <h4 style="margin: 0; color: #ff5722; font-weight: bold;">OMNISTORE COLOMBIA S.A.S.</h4>
                <div style="font-size: 11px; color: #555;">NIT: 901.482.910-4 | Régimen Común</div>
                <div style="font-size: 11px; color: #555;">CEDI El Bosque / Cra. 3 # 7-15, Bocagrande, Cartagena</div>
                <div style="font-size: 11px; color: #555;">Resolución DIAN Nº 18764000001 de 2026 (Rango FE-001 a FE-99999)</div>
              </div>
              <div class="text-end">
                <div class="badge bg-primary fs-6 mb-1">${invoiceNumber}</div>
                <div style="font-size: 11px;"><strong>Fecha Emisión:</strong> ${new Date().toLocaleDateString('es-CO')}</div>
                <div style="font-size: 11px;"><strong>Pedido Ref:</strong> ${orderNum}</div>
              </div>
            </div>

            <div class="row g-2 p-2 bg-light rounded border mb-3">
              <div class="col-6">
                <strong>Adquirente / Cliente:</strong> ${cust.name}<br>
                <small class="text-muted">NIT / CC: 1.047.${Math.floor(100000 + Math.random() * 900000)} | Tel: ${cust.phone || '+57 310 000 0000'}</small>
              </div>
              <div class="col-6">
                <strong>Dirección de Entrega:</strong> ${order.shippingAddress || 'Cartagena de Indias'}<br>
                <small class="text-muted">Medio de Pago: ${order.paymentMethod || 'Pasarela Wompi / PSE'}</small>
              </div>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
              <thead>
                <tr style="background: #212529; color: #fff;">
                  <th style="padding: 6px; text-align: left;">Descripción del Producto</th>
                  <th style="padding: 6px; text-align: center; width: 60px;">Cant</th>
                  <th style="padding: 6px; text-align: right; width: 110px;">V/Unitario</th>
                  <th style="padding: 6px; text-align: right; width: 120px;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <div class="row g-2 pt-2 border-top">
              <div class="col-7">
                <div style="font-size: 9px; line-height: 1.2;" class="p-2 border rounded bg-light">
                  <strong>CUFE (Código Único de Factura Electrónica):</strong><br>
                  <span class="font-monospace text-break" style="font-size: 8px;">${cufe}</span>
                </div>
                <div class="mt-2 text-muted" style="font-size: 10px;">
                  <i class="bi bi-shield-check text-success"></i> Documento tributario validado electrónicamente ante la DIAN mediante estándar UBL 2.1 XML.
                </div>
              </div>
              <div class="col-5">
                <div class="d-flex justify-content-between py-1">
                  <span>Subtotal:</span>
                  <span>${this.formatPrice(baseNum)}</span>
                </div>
                <div class="d-flex justify-content-between py-1">
                  <span>IVA (19%):</span>
                  <span>${this.formatPrice(ivaNum)}</span>
                </div>
                <div class="d-flex justify-content-between py-1 border-top border-dark fw-bold fs-6 text-primary">
                  <span>TOTAL FACTURA:</span>
                  <span>${this.formatPrice(totalNum)}</span>
                </div>
              </div>
            </div>
          </div>
        `,
        showDenyButton: true,
        showCancelButton: true,
        confirmButtonText: '🖨️ Imprimir Factura A4',
        denyButtonText: '📦 Rótulo / Guía de Envío',
        cancelButtonText: 'Cerrar',
        confirmButtonColor: '#ff5722',
        denyButtonColor: '#0d6efd'
      }).then((result) => {
        if (result.isConfirmed) {
          const printWindow = window.open('', '_blank', 'width=800,height=900');
          printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>Factura Electrónica DIAN - ${invoiceNumber}</title>
              <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css">
              <style>
                body { padding: 20px; font-family: Arial, sans-serif; }
                @media print {
                  .no-print { display: none; }
                }
              </style>
            </head>
            <body onload="window.print();">
              ${document.getElementById('printable-dian-invoice').innerHTML}
            </body>
            </html>
          `);
          printWindow.document.close();
        } else if (result.isDenied) {
          this.printShippingLabel(order);
        }
      });
    },

    printShippingLabel(order) {
      const orderNum = order.orderNumber || 'PEDIDO-001';
      const cust = order.customer || { name: 'Cliente OmniStore' };
      const trackingNum = 'ENV-CTG-' + Math.floor(1000000 + Math.random() * 9000000);

      Swal.fire({
        title: 'Guía de Despacho & Rótulo de Envío (10x15cm)',
        width: '500px',
        html: `
          <div id="printable-shipping-label" class="text-start p-3 bg-white border border-dark rounded" style="font-family: Arial, sans-serif; font-size: 12px;">
            <div class="d-flex justify-content-between align-items-center border-bottom pb-2 mb-2">
              <div>
                <h5 class="fw-bold mb-0 text-dark">OMNISTORE EXPRESS</h5>
                <small class="text-muted">Despacho Nacional & Local Cartagena</small>
              </div>
              <div class="text-end">
                <span class="badge bg-dark fs-6">${orderNum}</span>
              </div>
            </div>

            <div class="p-2 border mb-2 bg-light">
              <strong style="font-size: 11px;">REMITENTE:</strong>
              <div class="fw-bold">OMNISTORE COLOMBIA S.A.S. (CEDI El Bosque)</div>
              <div>Cra. 3 # 7-15, Bocagrande, Cartagena de Indias, Bolívar</div>
              <div>Teléfono: +57 310 845 9210</div>
            </div>

            <div class="p-2 border border-2 border-dark mb-2">
              <strong style="font-size: 11px; color: #ff5722;">DESTINATARIO:</strong>
              <div class="fw-bold fs-6">${cust.name}</div>
              <div><strong>Dirección:</strong> ${order.shippingAddress || 'Cartagena de Indias'}</div>
              <div><strong>Ciudad:</strong> ${order.shippingCity || 'Cartagena de Indias (Bolívar)'}</div>
              <div><strong>Tel / WhatsApp:</strong> ${cust.phone || '+57 310 000 0000'}</div>
            </div>

            <div class="text-center py-2 border-top border-bottom my-2">
              <div class="font-monospace fw-bold fs-6">${trackingNum}</div>
              <!-- Barcode graphic representation -->
              <div style="font-family: 'Libre Barcode 128', monospace; font-size: 38px; letter-spacing: 2px;">
                ||| | |||| || ||| |||| | ||| |||||
              </div>
              <small class="text-muted">Transportadora Aliada: Domicilios Express / Coordinadora</small>
            </div>

            <div class="d-flex justify-content-between small">
              <span><strong>Piezas:</strong> 1 paquete</span>
              <span><strong>Peso estimado:</strong> 1.5 kg</span>
              <span><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-CO')}</span>
            </div>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: '🖨️ Imprimir Rótulo Adhesivo',
        cancelButtonText: 'Cerrar',
        confirmButtonColor: '#ff5722'
      }).then((res) => {
        if (res.isConfirmed) {
          const printWindow = window.open('', '_blank', 'width=500,height=600');
          printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>Rótulo de Envío - ${orderNum}</title>
              <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css">
              <style>
                @page { size: 100mm 150mm; margin: 5mm; }
                body { padding: 10px; font-family: Arial, sans-serif; }
              </style>
            </head>
            <body onload="window.print(); window.close();">
              ${document.getElementById('printable-shipping-label').innerHTML}
            </body>
            </html>
          `);
          printWindow.document.close();
        }
      });
    },

    sendWhatsAppFollowup(order) {
      const cust = order.customer || {};
      const phone = (cust.phone || '').replace(/\D/g, '') || '573108459210';
      const orderNum = order.orderNumber || 'PEDIDO';
      const totalFmt = this.formatPrice(order.total);
      
      const message = encodeURIComponent(`👋 Hola ${cust.name || 'estimado cliente'}, te saludamos de *OmniStore Colombia* 🛍️.\n\nTe confirmamos el estado de tu pedido *#${orderNum}* por un total de *${totalFmt}*.\n\n📍 Destino: ${order.shippingAddress || 'Cartagena'}\n📦 Estado actual: ${order.status === 'delivered' ? '¡Entregado!' : (order.status === 'shipped' ? 'En camino a tu dirección' : 'En preparación en CEDI El Bosque')}.\n\n¡Cualquier duda estamos a tu disposición! ✨`);
      
      window.open(`https://wa.me/${phone.startsWith('57') ? phone : '57' + phone}?text=${message}`, '_blank');
    },

    createManualOrder() {
      const catalog = getProductsCatalog();
      const productOptions = catalog.map(p => `<option value="${p.id}">${p.name} - ${this.formatPrice(p.price)}</option>`).join('');

      Swal.fire({
        title: 'Registrar Venta / Pedido Manual (Cartagena)',
        html: `
          <div class="text-start">
            <label class="form-label small fw-bold">Nombre del Cliente:</label>
            <input id="swal-ord-name" class="form-control form-control-sm mb-2" placeholder="Ej. Juliana Pardo">
            
            <label class="form-label small fw-bold">Correo Electrónico:</label>
            <input id="swal-ord-email" type="email" class="form-control form-control-sm mb-2" placeholder="juliana@ejemplo.co">
            
            <label class="form-label small fw-bold">Teléfono / WhatsApp:</label>
            <input id="swal-ord-phone" class="form-control form-control-sm mb-2" placeholder="+57 310 456 7890">
            
            <label class="form-label small fw-bold">Dirección y Barrio (Cartagena):</label>
            <input id="swal-ord-addr" class="form-control form-control-sm mb-2" placeholder="Cra 3 # 7-15, Bocagrande, Cartagena">
            
            <label class="form-label small fw-bold">Ciudad:</label>
            <input id="swal-ord-city" class="form-control form-control-sm mb-2" value="Cartagena de Indias" readonly>
            
            <label class="form-label small fw-bold">Producto a Comprar:</label>
            <select id="swal-ord-prod" class="form-select form-select-sm mb-2">${productOptions}</select>
            
            <label class="form-label small fw-bold">Cantidad:</label>
            <input id="swal-ord-qty" type="number" min="1" value="1" class="form-control form-control-sm mb-2">
            
            <label class="form-label small fw-bold">Medio de Pago:</label>
            <select id="swal-ord-pay" class="form-select form-select-sm mb-2">
              <option value="card">Tarjeta de Crédito / Débito (Wompi)</option>
              <option value="pse">PSE - Bancolombia / Davivienda</option>
              <option value="nequi">Nequi (QR)</option>
              <option value="cash">Pago Contraentrega / Efectivo</option>
            </select>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Crear Pedido',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#ff5722',
        preConfirm: () => {
          const name = document.getElementById('swal-ord-name').value.trim();
          const email = document.getElementById('swal-ord-email').value.trim();
          const phone = document.getElementById('swal-ord-phone').value.trim();
          const address = document.getElementById('swal-ord-addr').value.trim();
          const city = document.getElementById('swal-ord-city').value.trim();
          const prodId = Number(document.getElementById('swal-ord-prod').value);
          const qty = Number(document.getElementById('swal-ord-qty').value) || 1;
          const paymentMethod = document.getElementById('swal-ord-pay').value;

          if (!name || !email || !address) {
            Swal.showValidationMessage('Por favor completa nombre, email y dirección');
            return false;
          }

          const product = catalog.find(p => p.id === prodId) || catalog[0];
          return { name, email, phone, address, city, product, qty, paymentMethod };
        }
      }).then((res) => {
        if (res.isConfirmed && res.value) {
          const v = res.value;
          const totalAmount = v.product.price * v.qty;
          const cartItem = {
            id: v.product.id,
            name: v.product.name,
            price: v.product.price,
            quantity: v.qty,
            sku: v.product.sku
          };
          const checkoutForm = {
            name: v.name,
            email: v.email,
            phone: v.phone,
            address: v.address,
            city: v.city,
            paymentMethod: v.paymentMethod
          };

          const newOrd = createStoreOrder(checkoutForm, [cartItem], totalAmount);
          this.loadOrdersData();
          this.showNotification(`Pedido ${newOrd.orderNumber} creado exitosamente`, 'success');
        }
      });
    },

    deleteOrderPermanently(order) {
      Swal.fire({
        title: '¿Eliminar pedido?',
        text: `Esta acción eliminará el pedido ${order.orderNumber} permanentemente de la base de datos.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
      }).then((result) => {
        if (result.isConfirmed) {
          deleteOrder(order.id);
          this.loadOrdersData();
          this.showNotification(`Pedido ${order.orderNumber} eliminado.`, 'info');
        }
      });
    },

    exportOrders() {
      const csvContent = "data:text/csv;charset=utf-8," + 
        "Numero Pedido,Cliente,Email,Articulos,Total COP,Estado,Fecha\n" +
        this.filteredOrders.map(o => 
          `"${o.orderNumber}","${o.customer ? o.customer.name : ''}","${o.customer ? o.customer.email : ''}","${o.itemCount}","${o.total}","${o.status}","${o.orderDate}"`
        ).join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `pedidos_omnistore_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      this.showNotification('¡Pedidos exportados con éxito!', 'success');
    },

    showNotification(message, type = 'info') {
      if (typeof Swal !== 'undefined') {
        Swal.fire({
          title: message,
          icon: type === 'success' ? 'success' : type === 'error' ? 'error' : 'info',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000
        });
      } else {
        alert(message);
      }
    },

    charts: {},

    destroyCharts() {
      Object.keys(this.charts).forEach(key => {
        if (this.charts[key]) {
          try {
            this.charts[key].destroy();
          } catch (e) {
            // ignore
          }
          this.charts[key] = null;
        }
      });
      this.chartsInitialized = false;
    },

    initCharts() {
      if (this.chartsInitialized) return;

      this.initOrderTrendsChart();
      this.initStatusChart();
      this.initPeriodSelector();
      this.chartsInitialized = true;
    },

    buildDayLabels(count) {
      const today = new Date();
      return Array.from({ length: count }, (_, i) => {
        const d = new Date(today);
        d.setDate(d.getDate() - (count - 1 - i));
        return count <= 7
          ? d.toLocaleDateString('es-CO', { weekday: 'short' })
          : d.toLocaleDateString('es-CO', { month: 'short', day: 'numeric' });
      });
    },

    generateTrendsData(count) {
      return {
        orders: Array.from({ length: count }, () => Math.floor(Math.random() * 25) + 5),
        revenue: Array.from({ length: count }, () => Math.floor(Math.random() * 15000000) + 3000000),
      };
    },

    initPeriodSelector() {
      const map = { trends7d: 7, trends30d: 30, trends90d: 90 };
      document.querySelectorAll('input[name="trendsPeriod"]').forEach(input => {
        input.addEventListener('change', (e) => {
          const count = map[e.target.id];
          if (!count || !this.charts.orderTrends) return;
          const { orders, revenue } = this.generateTrendsData(count);
          this.charts.orderTrends.updateOptions({
            xaxis: { categories: this.buildDayLabels(count) },
            series: [
              { name: 'Pedidos',  data: orders  },
              { name: 'Ingresos COP', data: revenue },
            ],
          });
        });
      });
    },

    initOrderTrendsChart() {
      const chartElement = document.getElementById('orderTrendsChart');
      if (!chartElement) {
        return;
      }

      chartElement.innerHTML = '';
      const isDark = isDarkMode();

      try {
        const trendsData = {
          series: [{
            name: 'Pedidos',
            data: [12, 19, 15, 27, 24, 32, 28]
          }, {
            name: 'Ingresos (COP)',
            data: [5899000, 7450000, 6200000, 11400000, 9800000, 14200000, 12800000]
          }],
          chart: {
            type: 'area',
            height: 300,
            width: '100%',
            toolbar: { show: false },
            background: 'transparent',
            fontFamily: 'inherit'
          },
          theme: {
            mode: isDark ? 'dark' : 'light'
          },
          colors: categorical(2),
          fill: {
            type: 'gradient',
            gradient: {
              shadeIntensity: 1,
              opacityFrom: isDark ? 0.45 : 0.7,
              opacityTo: 0.1,
            }
          },
          stroke: {
            curve: 'smooth',
            width: 2.5
          },
          grid: {
            borderColor: gridLine(),
            strokeDashArray: 4
          },
          xaxis: {
            categories: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
            labels: {
              style: { colors: axisInk(), fontSize: '12px' }
            },
            axisBorder: { color: gridLine() },
            axisTicks: { color: gridLine() }
          },
          yaxis: [{
            title: {
              text: 'Pedidos Realizados',
              style: { color: axisInk(), fontWeight: 500 }
            },
            labels: {
              style: { colors: axisInk(), fontSize: '12px' }
            }
          }, {
            opposite: true,
            title: {
              text: 'Ingresos ($ COP)',
              style: { color: axisInk(), fontWeight: 500 }
            },
            labels: {
              style: { colors: axisInk(), fontSize: '12px' },
              formatter: (val) => '$ ' + Number(val).toLocaleString('es-CO')
            }
          }],
          tooltip: {
            theme: isDark ? 'dark' : 'light',
            y: [{
              formatter: function (val) {
                return val + " pedidos";
              }
            }, {
              formatter: function (val) {
                return "$ " + Number(val).toLocaleString('es-CO') + " COP";
              }
            }]
          }
        };

        const chart = new ApexCharts(chartElement, trendsData);
        chart.render();
        this.charts.orderTrends = chart;

        if ('ResizeObserver' in window) {
          let raf = 0;
          new ResizeObserver(() => {
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(() => {
              chart.updateOptions({ chart: { width: '100%' } }, false, false);
            });
          }).observe(chartElement);
        }
      } catch (error) {
        console.error('Error rendering order trends chart:', error);
      }
    },

    initStatusChart() {
      const chartElement = document.getElementById('statusChart');
      if (!chartElement) {
        return;
      }

      chartElement.innerHTML = '';
      const isDark = isDarkMode();

      try {
        const chartData = {
          series: this.statusStats.map(stat => stat.count),
          chart: {
            type: 'donut',
            height: 200,
            width: '100%',
            background: 'transparent',
            fontFamily: 'inherit'
          },
          theme: {
            mode: isDark ? 'dark' : 'light'
          },
          labels: this.statusStats.map(stat => stat.name),
          colors: this.statusStats.map(stat => stat.color),
          plotOptions: {
            pie: {
              donut: {
                size: '70%'
              }
            }
          },
          legend: {
            show: false
          },
          tooltip: {
            theme: isDark ? 'dark' : 'light',
            y: {
              formatter: function (val) {
                return val + " pedidos";
              }
            }
          }
        };

        const chart = new ApexCharts(chartElement, chartData);
        chart.render();
        this.charts.status = chart;
      } catch (error) {
        console.error('Error rendering status chart:', error);
      }
    },

    get paginatedOrders() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      const end = start + this.itemsPerPage;
      return this.filteredOrders.slice(start, end);
    },

    get totalPages() {
      return Math.ceil(this.filteredOrders.length / this.itemsPerPage);
    },

    get visiblePages() {
      if (this.totalPages <= 1) return [1];

      const pages = [];

      // Always show first page
      pages.push(1);
      
      if (this.totalPages <= 7) {
        // If total pages is small, show all
        for (let i = 2; i <= this.totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Complex pagination logic
        if (this.currentPage <= 4) {
          // Near the beginning
          for (let i = 2; i <= 5; i++) {
            pages.push(i);
          }
          pages.push('...');
          pages.push(this.totalPages);
        } else if (this.currentPage >= this.totalPages - 3) {
          // Near the end
          pages.push('...');
          for (let i = this.totalPages - 4; i <= this.totalPages; i++) {
            pages.push(i);
          }
        } else {
          // In the middle
          pages.push('...');
          for (let i = this.currentPage - 1; i <= this.currentPage + 1; i++) {
            pages.push(i);
          }
          pages.push('...');
          pages.push(this.totalPages);
        }
      }
      
      return pages;
    },

    goToPage(page) {
      if (page >= 1 && page <= this.totalPages) {
        this.currentPage = page;
      }
    }
  }));

  // Search component for header
  Alpine.data('searchComponent', createSearchComponent({ getResults: () => [] }));

  // Theme switch component
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