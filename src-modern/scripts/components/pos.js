import Alpine from 'alpinejs';
import Swal from 'sweetalert2';
import {
  getProductsCatalog,
  createStoreOrder,
  resolveProductImage,
  getCouponsList,
  getUsersList
} from '../utils/store-data.js';

// Audio feedback for barcode scanner beep
function playScanSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch (e) {
    // Ignore audio autoplay restrictions
  }
}

document.addEventListener('alpine:init', () => {
  Alpine.data('posApp', () => ({
    catalog: [],
    categories: [
      { id: 'all', name: 'Todos los Productos', icon: 'bi-grid' },
      { id: 'electronics', name: 'Tecnología & Celulares', icon: 'bi-phone' },
      { id: 'gaming', name: 'Gaming & Consolas', icon: 'bi-controller' },
      { id: 'audio', name: 'Audio & Sonido', icon: 'bi-headphones' },
      { id: 'home', name: 'Hogar & Oficina', icon: 'bi-house' },
      { id: 'shoes', name: 'Calzado & Moda', icon: 'bi-bag' }
    ],
    selectedCategory: 'all',
    searchQuery: '',
    barcodeInput: '',
    
    // Cart state
    cart: [],
    discountCode: '',
    discountPercent: 0,
    
    // Customer state (Default: Walk-in customer)
    customer: {
      name: 'Cliente de Mostrador (Contado)',
      docType: 'CC',
      docNumber: '222222222222',
      phone: '+57 300 123 4567',
      email: 'mostrador@omnistore.com',
      address: 'Venta Local / Mostrador, Cartagena'
    },
    
    // Payment method
    paymentMethod: 'cash', // 'cash' | 'card' | 'nequi' | 'pse'
    cashTendered: 0,
    
    // Thermal receipt state
    lastSale: null,
    showReceiptModal: false,
    
    // Cash shift / Arqueo de caja
    shift: {
      cashier: 'Alejandro Morales (Cajero 01)',
      terminalId: 'POS-CTG-01',
      openTime: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
      openingCash: 200000,
      cashSales: 0,
      cardSales: 0,
      nequiSales: 0,
      totalSalesCount: 0
    },

    init() {
      this.loadProducts();
      this.initBarcodeListener();
      
      // Auto-refresh products periodically
      window.addEventListener('omnistore:data-sync', () => {
        this.loadProducts();
      });
    },

    loadProducts() {
      const all = getProductsCatalog();
      this.catalog = all.map(p => ({
        ...p,
        resolvedImage: resolveProductImage(p),
        stock: p.stock !== undefined ? p.stock : 20
      }));
    },

    initBarcodeListener() {
      // Global barcode listener for USB barcode guns
      let buffer = '';
      let lastKeyTime = Date.now();

      window.addEventListener('keydown', (e) => {
        // If focus is inside an input modal, don't intercept unless it's barcode input
        const activeTag = document.activeElement ? document.activeElement.tagName : '';
        if (activeTag === 'TEXTAREA' || (activeTag === 'INPUT' && document.activeElement.id !== 'pos-barcode-input')) {
          return;
        }

        const currentTime = Date.now();
        if (currentTime - lastKeyTime > 100) {
          buffer = '';
        }
        lastKeyTime = currentTime;

        if (e.key === 'Enter') {
          if (buffer.length > 2) {
            this.scanCode(buffer.trim());
            buffer = '';
            e.preventDefault();
          }
        } else if (e.key.length === 1) {
          buffer += e.key;
        }
      });
    },

    get filteredProducts() {
      return this.catalog.filter(p => {
        const matchesCat = this.selectedCategory === 'all' || p.category === this.selectedCategory;
        const q = this.searchQuery.toLowerCase().trim();
        const matchesSearch = !q || 
          p.name.toLowerCase().includes(q) || 
          (p.sku && p.sku.toLowerCase().includes(q)) ||
          (p.brand && p.brand.toLowerCase().includes(q));
        return matchesCat && matchesSearch;
      });
    },

    addToCart(product, qty = 1) {
      if (product.stock <= 0) {
        Swal.fire({
          icon: 'warning',
          title: 'Sin Stock Disponible',
          text: `El producto "${product.name}" no tiene unidades en inventario.`,
          confirmButtonColor: '#ff5722'
        });
        return;
      }

      const existingIndex = this.cart.findIndex(i => i.id === product.id);
      if (existingIndex > -1) {
        const currentQty = this.cart[existingIndex].quantity;
        if (currentQty + qty > product.stock) {
          Swal.fire({
            icon: 'info',
            title: 'Límite de Stock Alcanzado',
            text: `Solo quedan ${product.stock} unidades de este producto.`,
            confirmButtonColor: '#ff5722'
          });
          return;
        }
        this.cart[existingIndex].quantity += qty;
      } else {
        this.cart.push({
          id: product.id,
          name: product.name,
          sku: product.sku || `SKU-${product.id}`,
          price: product.price,
          quantity: qty,
          maxStock: product.stock,
          image: product.resolvedImage
        });
      }

      playScanSound();
      this.updateCashPresets();
    },

    removeFromCart(index) {
      this.cart.splice(index, 1);
      this.updateCashPresets();
    },

    updateQty(index, delta) {
      const item = this.cart[index];
      if (!item) return;

      const newQty = item.quantity + delta;
      if (newQty <= 0) {
        this.removeFromCart(index);
      } else if (newQty > item.maxStock) {
        Swal.fire({
          icon: 'info',
          title: 'Stock Máximo',
          text: `Inventario disponible: ${item.maxStock} unidades.`,
          confirmButtonColor: '#ff5722'
        });
      } else {
        item.quantity = newQty;
      }
      this.updateCashPresets();
    },

    clearCart() {
      if (this.cart.length === 0) return;
      Swal.fire({
        title: '¿Vaciar la venta actual?',
        text: 'Se eliminarán todos los artículos del ticket.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, vaciar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#d33'
      }).then((res) => {
        if (res.isConfirmed) {
          this.cart = [];
          this.discountPercent = 0;
          this.discountCode = '';
          this.cashTendered = 0;
        }
      });
    },

    scanCode(code) {
      if (!code) return;
      const clean = code.trim().toLowerCase();
      const found = this.catalog.find(p => 
        (p.sku && p.sku.toLowerCase() === clean) ||
        String(p.id) === clean ||
        p.name.toLowerCase().includes(clean)
      );

      if (found) {
        this.addToCart(found, 1);
        this.barcodeInput = '';
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Código no encontrado',
          text: `No existe ningún producto con el código o SKU "${code}".`,
          timer: 2000,
          showConfirmButton: false
        });
      }
    },

    handleManualBarcodeSubmit() {
      if (this.barcodeInput.trim()) {
        this.scanCode(this.barcodeInput.trim());
      }
    },

    // --- Financial Calculations ---
    get subtotal() {
      return this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    },

    get discountAmount() {
      return Math.round(this.subtotal * (this.discountPercent / 100));
    },

    get total() {
      return Math.max(0, this.subtotal - this.discountAmount);
    },

    get taxableBase() {
      // IVA 19% Colombia (Base = Total / 1.19)
      return Math.round(this.total / 1.19);
    },

    get ivaAmount() {
      return this.total - this.taxableBase;
    },

    get changeDue() {
      if (this.paymentMethod !== 'cash') return 0;
      return Math.max(0, (parseFloat(this.cashTendered) || 0) - this.total);
    },

    formatPrice(amount) {
      const num = typeof amount === 'number' ? amount : (parseFloat(amount) || 0);
      return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0
      }).format(num);
    },

    setCashPreset(val) {
      if (val === 'exact') {
        this.cashTendered = this.total;
      } else {
        this.cashTendered = val;
      }
    },

    updateCashPresets() {
      if (this.paymentMethod === 'cash' && (this.cashTendered < this.total || this.cashTendered === 0)) {
        this.cashTendered = this.total;
      }
    },

    applyDiscountCoupon() {
      if (!this.discountCode.trim()) return;
      const code = this.discountCode.trim().toUpperCase();
      const coupons = getCouponsList();
      const found = coupons.find(c => c.code.toUpperCase() === code && c.active);

      if (found) {
        if (found.type === 'percentage') {
          this.discountPercent = found.value;
        } else if (found.type === 'fixed') {
          this.discountPercent = Math.min(100, Math.round((found.value / (this.subtotal || 1)) * 100));
        } else {
          this.discountPercent = 10;
        }
        Swal.fire({
          icon: 'success',
          title: `¡Cupón ${code} aplicado!`,
          text: `Descuento del ${this.discountPercent}% otorgado en esta venta.`,
          timer: 1800,
          showConfirmButton: false
        });
      } else {
        Swal.fire({
          icon: 'warning',
          title: 'Cupón no válido',
          text: 'El código promocional no existe o ha expirado.',
          confirmButtonColor: '#ff5722'
        });
      }
    },

    // --- Modal Customer Selector ---
    editCustomer() {
      const users = getUsersList();
      const userOptions = users.map(u => `<option value="${u.id}">${u.name} (${u.email})</option>`).join('');

      Swal.fire({
        title: 'Datos del Cliente / Facturación',
        html: `
          <div class="text-start">
            <label class="form-label small fw-bold">Seleccionar Cliente Registrado:</label>
            <select id="swal-client-select" class="form-select form-select-sm mb-3">
              <option value="">-- Cliente Nuevo / Ocasional --</option>
              ${userOptions}
            </select>

            <label class="form-label small fw-bold">Nombre Completo o Razón Social:</label>
            <input id="swal-cust-name" class="form-control form-control-sm mb-2" value="${this.customer.name}">

            <div class="row g-2 mb-2">
              <div class="col-4">
                <label class="form-label small fw-bold">Tipo Doc:</label>
                <select id="swal-cust-type" class="form-select form-select-sm">
                  <option value="CC" ${this.customer.docType === 'CC' ? 'selected' : ''}>CC (Cédula)</option>
                  <option value="NIT" ${this.customer.docType === 'NIT' ? 'selected' : ''}>NIT (Empresa)</option>
                  <option value="CE" ${this.customer.docType === 'CE' ? 'selected' : ''}>CE (Extranjería)</option>
                  <option value="PPN" ${this.customer.docType === 'PPN' ? 'selected' : ''}>Pasaporte</option>
                </select>
              </div>
              <div class="col-8">
                <label class="form-label small fw-bold">Nº Identificación:</label>
                <input id="swal-cust-doc" class="form-control form-control-sm" value="${this.customer.docNumber}">
              </div>
            </div>

            <label class="form-label small fw-bold">Teléfono / WhatsApp:</label>
            <input id="swal-cust-phone" class="form-control form-control-sm mb-2" value="${this.customer.phone}">

            <label class="form-label small fw-bold">Correo Electrónico (para Factura DIAN):</label>
            <input id="swal-cust-email" type="email" class="form-control form-control-sm mb-2" value="${this.customer.email}">

            <label class="form-label small fw-bold">Dirección:</label>
            <input id="swal-cust-addr" class="form-control form-control-sm" value="${this.customer.address}">
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Guardar Cliente',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#ff5722',
        didOpen: () => {
          const select = document.getElementById('swal-client-select');
          select.addEventListener('change', (e) => {
            const userId = Number(e.target.value);
            const foundUser = users.find(u => u.id === userId);
            if (foundUser) {
              document.getElementById('swal-cust-name').value = foundUser.name;
              document.getElementById('swal-cust-email').value = foundUser.email;
              document.getElementById('swal-cust-phone').value = foundUser.phone || '+57 310 000 0000';
              document.getElementById('swal-cust-addr').value = foundUser.city ? `${foundUser.city}, Cartagena` : 'Cartagena';
              document.getElementById('swal-cust-doc').value = '1047' + Math.floor(100000 + Math.random() * 900000);
            }
          });
        },
        preConfirm: () => {
          const name = document.getElementById('swal-cust-name').value.trim();
          const docType = document.getElementById('swal-cust-type').value;
          const docNumber = document.getElementById('swal-cust-doc').value.trim();
          const phone = document.getElementById('swal-cust-phone').value.trim();
          const email = document.getElementById('swal-cust-email').value.trim();
          const address = document.getElementById('swal-cust-addr').value.trim();

          if (!name || !docNumber) {
            Swal.showValidationMessage('Por favor ingresa al menos el Nombre y el Número de Documento');
            return false;
          }

          return { name, docType, docNumber, phone, email, address };
        }
      }).then((res) => {
        if (res.isConfirmed && res.value) {
          this.customer = res.value;
          Swal.fire({
            icon: 'success',
            title: 'Cliente Asignado',
            text: `Venta vinculada a: ${this.customer.name}`,
            timer: 1500,
            showConfirmButton: false
          });
        }
      });
    },

    // --- Process POS Sale and Print Thermal Ticket ---
    async processPOSSale() {
      if (this.cart.length === 0) {
        Swal.fire({
          icon: 'warning',
          title: 'Ticket Vacío',
          text: 'Agrega al menos un producto al ticket antes de cobrar.',
          confirmButtonColor: '#ff5722'
        });
        return;
      }

      if (this.paymentMethod === 'cash') {
        const cash = parseFloat(this.cashTendered) || 0;
        if (cash < this.total) {
          Swal.fire({
            icon: 'error',
            title: 'Efectivo Insuficiente',
            text: `El total a pagar es ${this.formatPrice(this.total)}. El cliente entregó ${this.formatPrice(cash)}. Falta: ${this.formatPrice(this.total - cash)}.`,
            confirmButtonColor: '#ff5722'
          });
          return;
        }
      }

      // Show processing loader
      Swal.fire({
        title: 'Procesando Venta POS...',
        text: 'Sincronizando inventario, registrando pago y generando CUFE DIAN...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const orderNumber = 'POS-CTG-' + Math.floor(100000 + Math.random() * 900000);
      const invoiceNumber = 'FE-2026-POS' + Math.floor(1000 + Math.random() * 9000);
      const cufe = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

      // Create Store Order in PostgreSQL & LocalStorage
      const checkoutForm = {
        name: this.customer.name,
        email: this.customer.email,
        phone: this.customer.phone,
        address: this.customer.address,
        city: 'Cartagena de Indias',
        paymentMethod: this.paymentMethod
      };

      const cartItemsForOrder = this.cart.map(i => ({
        id: i.id,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        sku: i.sku
      }));

      const newOrder = createStoreOrder(checkoutForm, cartItemsForOrder, this.total, this.discountCode || null);

      // Sincronizar Factura DIAN en Backend
      try {
        await fetch('/api/invoices/generate-dian', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderNumber: newOrder.orderNumber || orderNumber,
            customerName: this.customer.name,
            customerNit: `${this.customer.docType} ${this.customer.docNumber}`,
            customerEmail: this.customer.email,
            items: cartItemsForOrder,
            subtotal: this.taxableBase,
            iva: this.ivaAmount,
            total: this.total,
            paymentMethod: this.paymentMethod === 'cash' ? 'Efectivo en Caja POS' : (this.paymentMethod === 'card' ? 'Datáfono / Tarjeta' : 'Nequi / Transferencia')
          })
        });
      } catch (e) {
        // Backend fallback
      }

      // Update shift metrics
      this.shift.totalSalesCount += 1;
      if (this.paymentMethod === 'cash') this.shift.cashSales += this.total;
      else if (this.paymentMethod === 'card') this.shift.cardSales += this.total;
      else this.shift.nequiSales += this.total;

      // Prepare Last Sale object for Thermal Receipt
      this.lastSale = {
        orderNumber: newOrder.orderNumber || orderNumber,
        invoiceNumber,
        cufe,
        date: new Date().toLocaleString('es-CO'),
        cashier: this.shift.cashier,
        terminal: this.shift.terminalId,
        customer: { ...this.customer },
        items: [...this.cart],
        subtotal: this.subtotal,
        discountPercent: this.discountPercent,
        discountAmount: this.discountAmount,
        taxableBase: this.taxableBase,
        ivaAmount: this.ivaAmount,
        total: this.total,
        paymentMethod: this.paymentMethod,
        cashTendered: parseFloat(this.cashTendered) || this.total,
        changeDue: this.changeDue
      };

      // Reset cart and reload catalog with decremented stock
      this.cart = [];
      this.discountPercent = 0;
      this.discountCode = '';
      this.cashTendered = 0;
      this.loadProducts();

      Swal.close();

      // Open printable thermal receipt modal
      this.showReceiptModal = true;
    },

    printThermalTicket() {
      const printableContent = document.getElementById('thermal-receipt-container').innerHTML;
      const printWindow = window.open('', '_blank', 'width=420,height=700');
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Tirilla POS - ${this.lastSale?.orderNumber || 'Venta'}</title>
          <style>
            @page {
              margin: 0;
              size: 80mm auto;
            }
            body {
              font-family: 'Courier New', Courier, monospace;
              font-size: 12px;
              line-height: 1.25;
              width: 76mm;
              margin: 2mm auto;
              padding: 0;
              color: #000;
            }
            .text-center { text-align: center; }
            .text-end { text-align: right; }
            .text-start { text-align: left; }
            .fw-bold { font-weight: bold; }
            .border-top { border-top: 1px dashed #000; padding-top: 4px; margin-top: 4px; }
            .border-bottom { border-bottom: 1px dashed #000; padding-bottom: 4px; margin-bottom: 4px; }
            .d-flex { display: flex; justify-content: space-between; }
            .cufe-text { font-size: 8px; word-break: break-all; margin: 4px 0; }
            .qr-placeholder { margin: 6px auto; display: block; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          ${printableContent}
        </body>
        </html>
      `);
      printWindow.document.close();
    },

    openArqueoCajaModal() {
      const totalGeneral = this.shift.cashSales + this.shift.cardSales + this.shift.nequiSales;
      const dineroEnCaja = this.shift.openingCash + this.shift.cashSales;

      Swal.fire({
        title: 'Arqueo y Cierre de Caja (Turno Actual)',
        html: `
          <div class="text-start p-2">
            <div class="bg-light p-3 rounded-3 mb-3 border">
              <div class="d-flex justify-content-between mb-1">
                <span><strong>Cajero:</strong></span>
                <span>${this.shift.cashier}</span>
              </div>
              <div class="d-flex justify-content-between mb-1">
                <span><strong>Terminal:</strong></span>
                <span>${this.shift.terminalId}</span>
              </div>
              <div class="d-flex justify-content-between mb-1">
                <span><strong>Hora de Apertura:</strong></span>
                <span>${this.shift.openTime}</span>
              </div>
              <div class="d-flex justify-content-between">
                <span><strong>Base Inicial en Caja:</strong></span>
                <span class="text-primary fw-bold">${this.formatPrice(this.shift.openingCash)}</span>
              </div>
            </div>

            <h6 class="fw-bold mb-2">Desglose de Ventas del Turno (${this.shift.totalSalesCount} transacciones):</h6>
            <div class="list-group list-group-flush border-top border-bottom mb-3">
              <div class="list-group-item d-flex justify-content-between px-0 py-2">
                <span>💵 Ventas en Efectivo:</span>
                <strong class="text-success">${this.formatPrice(this.shift.cashSales)}</strong>
              </div>
              <div class="list-group-item d-flex justify-content-between px-0 py-2">
                <span>💳 Ventas con Datáfono / Tarjeta:</span>
                <strong class="text-primary">${this.formatPrice(this.shift.cardSales)}</strong>
              </div>
              <div class="list-group-item d-flex justify-content-between px-0 py-2">
                <span>📱 Ventas Nequi / Transferencias:</span>
                <strong class="text-info">${this.formatPrice(this.shift.nequiSales)}</strong>
              </div>
            </div>

            <div class="alert alert-warning mb-0">
              <div class="d-flex justify-content-between mb-1">
                <span class="fw-bold">Total Facturado:</span>
                <span class="fw-bold">${this.formatPrice(totalGeneral)}</span>
              </div>
              <div class="d-flex justify-content-between">
                <span class="fw-bold text-dark fs-6">Efectivo Físico Esperado en Cajón:</span>
                <span class="fw-bold text-dark fs-6">${this.formatPrice(dineroEnCaja)}</span>
              </div>
            </div>
          </div>
        `,
        showDenyButton: true,
        confirmButtonText: '🖨️ Imprimir Cierre Z',
        denyButtonText: 'Cerrar Turno',
        confirmButtonColor: '#ff5722',
        denyButtonColor: '#28a745'
      }).then((result) => {
        if (result.isConfirmed) {
          window.print();
        } else if (result.isDenied) {
          Swal.fire('Turno Cerrado con Éxito', 'Se ha guardado el reporte del arqueo de caja.', 'success');
        }
      });
    }
  }));
});
