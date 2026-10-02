import Alpine from 'alpinejs';
import Swal from 'sweetalert2';
import { Modal, Offcanvas } from 'bootstrap';
import {
  getProductsCatalog,
  createStoreOrder,
  INITIAL_CATALOG,
  validateCoupon,
  getCouponsList,
  getReviewsList,
  addReview,
  getOrdersList,
  updateProductInCatalog,
  getShippingGuidesList
} from '../utils/store-data.js';
import { getCurrentUser, logoutUser } from '../utils/auth-service.js';

const SAMPLE_MARKET_PRODUCTS = INITIAL_CATALOG;

// Valid promo coupons for Cartagena & Colombia
const PROMO_COUPONS = {
  'OMNI10': { discount: 0.10, label: '10% de Descuento Especial OmniStore Cartagena' },
  'BIENVENIDO50K': { discount: 50000, isFixed: true, label: '$ 50.000 COP Descuento de Bienvenida en Cartagena' },
  'BIENVENIDO10': { discount: 50000, isFixed: true, label: '$ 50.000 COP Bono de Bienvenida' },
  'CARTAGENA20': { discount: 0.20, label: '20% OFF Especial Cartagena de Indias' },
  'OMNIPRO': { discount: 0.20, label: '20% OFF Super Venta OmniStore' },
  'ENVIOGRATIS': { freeShipping: true, label: 'Envío Gratis Cartagena & Zonas Aledañas' },
  'SUPERENVIO': { freeShipping: true, label: 'Envío Gratis Inmediato' }
};

document.addEventListener('alpine:init', () => {
  Alpine.data('marketplaceApp', () => ({
    // User Session
    currentUser: getCurrentUser(),

    logout() {
      logoutUser();
    },

    // Catalog State
    products: SAMPLE_MARKET_PRODUCTS,
    searchQuery: '',
    selectedCategory: 'all',
    priceFilter: 'all',
    freeShippingOnly: false,
    onSaleOnly: false,
    minRating: 0,
    sortBy: 'featured',
    currentView: 'grid',

    // User & Location Preferences (Strictly Cartagena de Indias / Bolívar)
    currency: 'COP',
    deliveryAddress: 'Cartagena de Indias (Bocagrande, Cra 3 # 7-15)',
    currentLanguage: 'es',

    // Countdown state for Flash Deals
    flashCountdown: {
      hours: '08',
      minutes: '34',
      seconds: '52'
    },
    countdownInterval: null,

    // Wishlist (Persistent)
    wishlist: [],

    // Shopping Cart (Persistent)
    cart: [],
    couponInput: '',
    appliedCoupon: null,
    discountAmount: 0,

    // Quick View Modal
    quickViewProduct: null,
    quickViewQty: 1,
    selectedColor: '',
    selectedSize: '',
    quickViewModalInstance: null,

    // Cart Offcanvas
    cartOffcanvasInstance: null,

    // Checkout Modal
    checkoutModalInstance: null,
    checkoutStep: 1,
    isProcessingPayment: false,
    checkoutForm: {
      name: '',
      email: '',
      phone: '',
      address: '',
      neighborhood: 'Bocagrande',
      city: 'Cartagena de Indias',
      zip: '130001',
      paymentMethod: 'card',
      cardNumber: '',
      cardExp: '',
      cardCvc: '',
      saveDetails: true
    },

    // Claimed Coupons Array
    claimedCoupons: [],

    // Customer Orders Modal
    customerOrdersModalInstance: null,
    selectedOrderForDetail: null,

    // Product Reviews Modal
    reviewsModalInstance: null,
    reviewProduct: null,
    productReviewsList: [],
    newReviewRating: 5,
    newReviewComment: '',
    isSubmittingReview: false,

    init() {
      // Sync currentUser and prefill checkout details
      this.currentUser = getCurrentUser();
      if (this.currentUser) {
        this.checkoutForm.name = this.currentUser.name || '';
        this.checkoutForm.email = this.currentUser.email || '';
        this.checkoutForm.phone = this.currentUser.phone || '+57 312 345 6789';
        this.checkoutForm.city = this.currentUser.city || 'Cartagena de Indias';
      }

      // Load products from centralized catalog
      this.loadCatalog();

      // Listen for global catalog updates from Admin
      window.addEventListener('omnistore:catalog-updated', (e) => {
        if (e.detail && Array.isArray(e.detail)) {
          this.products = e.detail.filter(p => p.status === 'published');
        }
      });

      // Listen for auth changes
      window.addEventListener('omnistore:auth-changed', (e) => {
        this.currentUser = e.detail;
        if (this.currentUser) {
          this.checkoutForm.name = this.currentUser.name || '';
          this.checkoutForm.email = this.currentUser.email || '';
          this.checkoutForm.phone = this.currentUser.phone || '+57 312 345 6789';
          this.checkoutForm.city = this.currentUser.city || 'Cartagena de Indias';
        }
      });

      // Handle URL parameters (e.g. search from admin "Ver en Tienda")
      try {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('search')) {
          this.searchQuery = urlParams.get('search');
        }
        if (urlParams.has('category')) {
          this.selectedCategory = urlParams.get('category');
        }
      } catch (e) {
        console.warn('URL param parse error', e);
      }

      // Restore persisted cart
      try {
        const savedCart = localStorage.getItem('omnistore_market_cart') || localStorage.getItem('metis_market_cart');
        if (savedCart) {
          this.cart = JSON.parse(savedCart);
        }
      } catch (e) {
        console.warn('Could not load cart from localStorage', e);
      }

      // Restore persisted wishlist
      try {
        const savedWishlist = localStorage.getItem('omnistore_market_wishlist') || localStorage.getItem('metis_market_wishlist');
        if (savedWishlist) {
          this.wishlist = JSON.parse(savedWishlist);
        }
      } catch (e) {
        console.warn('Could not load wishlist from localStorage', e);
      }

      // Start countdown timer
      this.startFlashCountdown();

      // Bootstrap modal / offcanvas instances setup
      setTimeout(() => {
        const qvModalEl = document.getElementById('quickViewModal');
        if (qvModalEl) {
          this.quickViewModalInstance = new Modal(qvModalEl);
        }
        const cartEl = document.getElementById('marketCartDrawer');
        if (cartEl) {
          this.cartOffcanvasInstance = new Offcanvas(cartEl);
        }
        const chkModalEl = document.getElementById('checkoutModal');
        if (chkModalEl) {
          this.checkoutModalInstance = new Modal(chkModalEl);
        }
        const ordersModalEl = document.getElementById('customerOrdersModal');
        if (ordersModalEl) {
          this.customerOrdersModalInstance = new Modal(ordersModalEl);
        }
        const revModalEl = document.getElementById('productReviewsModal');
        if (revModalEl) {
          this.reviewsModalInstance = new Modal(revModalEl);
        }
      }, 300);
    },

    loadCatalog() {
      try {
        const catalog = getProductsCatalog();
        if (catalog && catalog.length > 0) {
          this.products = catalog.filter(p => p.status === 'published');
        } else {
          this.products = SAMPLE_MARKET_PRODUCTS;
        }
      } catch (e) {
        console.error('Error loading products catalog:', e);
        this.products = SAMPLE_MARKET_PRODUCTS;
      }
    },

    // Countdown Timer Loop
    startFlashCountdown() {
      let totalSeconds = 8 * 3600 + 34 * 60 + 52;
      this.countdownInterval = setInterval(() => {
        if (totalSeconds <= 0) {
          totalSeconds = 24 * 3600; // Reset next cycle
        }
        totalSeconds--;
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;

        this.flashCountdown.hours = String(h).padStart(2, '0');
        this.flashCountdown.minutes = String(m).padStart(2, '0');
        this.flashCountdown.seconds = String(s).padStart(2, '0');
      }, 1000);
    },

    // Filter & Search Engine
    get filteredProducts() {
      return this.products
        .filter(item => {
          // Category filter
          if (this.selectedCategory !== 'all' && item.category !== this.selectedCategory) {
            return false;
          }
          // Search query filter
          if (this.searchQuery.trim() !== '') {
            const q = this.searchQuery.toLowerCase().trim();
            const matchName = item.name.toLowerCase().includes(q);
            const matchTag = item.tags && item.tags.some(t => t.toLowerCase().includes(q));
            const matchCat = item.categoryLabel.toLowerCase().includes(q);
            if (!matchName && !matchTag && !matchCat) return false;
          }
          // Free shipping filter
          if (this.freeShippingOnly && !item.hasFreeShipping) {
            return false;
          }
          // On sale filter
          if (this.onSaleOnly && item.discountPercent < 40) {
            return false;
          }
          // Min rating filter
          if (this.minRating > 0 && item.rating < this.minRating) {
            return false;
          }
          // Price filter (COP)
          if (this.priceFilter === 'under500k' && item.price >= 500000) return false;
          if (this.priceFilter === '500kto2m' && (item.price < 500000 || item.price > 2000000)) return false;
          if (this.priceFilter === '2mto5m' && (item.price < 2000000 || item.price > 5000000)) return false;
          if (this.priceFilter === 'over5m' && item.price <= 5000000) return false;

          return true;
        })
        .sort((a, b) => {
          if (this.sortBy === 'price-low') return a.price - b.price;
          if (this.sortBy === 'price-high') return b.price - a.price;
          if (this.sortBy === 'discount') return b.discountPercent - a.discountPercent;
          if (this.sortBy === 'rating') return b.rating - a.rating;
          if (this.sortBy === 'sales') return b.salesCount - a.salesCount;
          return 0; // 'featured' default
        });
    },

    get flashDealsList() {
      return this.products.filter(p => p.isFlashDeal);
    },

    // Cart Management
    addToCart(product, qty = 1, options = {}) {
      const color = options.color || (product.colors && product.colors[0]) || 'Estándar';
      const size = options.size || (product.sizes && product.sizes[0]) || '';
      
      const existingItemIndex = this.cart.findIndex(
        i => i.id === product.id && i.selectedColor === color && i.selectedSize === size
      );

      if (existingItemIndex > -1) {
        this.cart[existingItemIndex].quantity += qty;
      } else {
        this.cart.push({
          id: product.id,
          name: product.name,
          sku: product.sku,
          price: product.price,
          originalPrice: product.originalPrice,
          image: product.image,
          quantity: qty,
          selectedColor: color,
          selectedSize: size,
          hasFreeShipping: product.hasFreeShipping
        });
      }

      this.saveCart();
      
      // Feedback notification
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: '¡Producto añadido al carrito!',
        text: `${product.name.slice(0, 35)}... (x${qty})`,
        showConfirmButton: false,
        timer: 2200,
        timerProgressBar: true
      });
    },

    removeFromCart(index) {
      this.cart.splice(index, 1);
      this.saveCart();
    },

    updateCartQty(index, delta) {
      if (!this.cart[index]) return;
      const newQty = this.cart[index].quantity + delta;
      if (newQty <= 0) {
        this.removeFromCart(index);
      } else {
        this.cart[index].quantity = newQty;
        this.saveCart();
      }
    },

    clearCart() {
      this.cart = [];
      this.appliedCoupon = null;
      this.saveCart();
    },

    saveCart() {
      try {
        localStorage.setItem('omnistore_market_cart', JSON.stringify(this.cart));
      } catch (e) {
        console.warn('Failed to persist cart', e);
      }
    },

    // Cart Totals Calculation
    get cartSubtotal() {
      return this.cart.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);
    },

    get cartItemsCount() {
      return this.cart.reduce((sum, item) => sum + item.quantity, 0);
    },

    get freeShippingThreshold() {
      return 150000; // $150.000 COP para envío gratis en toda Cartagena
    },

    get amountToFreeShipping() {
      const remaining = this.freeShippingThreshold - this.cartSubtotal;
      return remaining > 0 ? remaining : 0;
    },

    get freeShippingProgressPercent() {
      if (this.cartSubtotal >= this.freeShippingThreshold) return 100;
      return Math.round((this.cartSubtotal / this.freeShippingThreshold) * 100);
    },

    get shippingCost() {
      if (this.cart.length === 0) return 0;
      if (this.cartSubtotal >= this.freeShippingThreshold) return 0;
      if (this.appliedCoupon && (this.appliedCoupon.freeShipping || this.appliedCoupon.type === 'shipping')) return 0;
      return 6500; // $6.500 COP tarifa urbana estándar Cartagena
    },

    get calculatedDiscount() {
      if (!this.appliedCoupon) return 0;
      if (this.appliedCoupon.type === 'fixed' || this.appliedCoupon.isFixed) {
        return Math.min(Number(this.appliedCoupon.value || this.appliedCoupon.discount) || 0, this.cartSubtotal);
      }
      if (this.appliedCoupon.type === 'percent') {
        return Math.round((this.cartSubtotal * (Number(this.appliedCoupon.value) || 0)) / 100);
      }
      if (this.appliedCoupon.discount) {
        return Math.round(this.cartSubtotal * this.appliedCoupon.discount);
      }
      return 0;
    },

    get cartTotal() {
      const total = this.cartSubtotal - this.calculatedDiscount + this.shippingCost;
      return total > 0 ? Math.round(total) : 0;
    },

    // Promo Coupons from unified database / store
    applyCouponCode() {
      const code = this.couponInput.trim().toUpperCase();
      if (!code) {
        Swal.fire('Atención', 'Por favor ingresa un código de cupón válido.', 'warning');
        return;
      }

      const res = validateCoupon(code, this.cartSubtotal);
      if (res.valid) {
        this.appliedCoupon = { code, ...res.coupon };
        this.couponInput = '';
        Swal.fire({
          icon: 'success',
          title: '¡Cupón aplicado!',
          text: res.message || `Se aplicó el cupón ${code}`,
          timer: 2000,
          showConfirmButton: false
        });
      } else if (PROMO_COUPONS[code]) {
        this.appliedCoupon = { code, ...PROMO_COUPONS[code] };
        this.couponInput = '';
        Swal.fire({
          icon: 'success',
          title: '¡Cupón aplicado!',
          text: `Se aplicó: ${this.appliedCoupon.label}`,
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        Swal.fire('Cupón inválido', res.message || 'El cupón ingresado no existe o ha expirado. Prueba con BIENVENIDO50K, CARTAGENA20 o OMNI10.', 'error');
      }
    },

    claimBannerCoupon(code) {
      if (!this.claimedCoupons.includes(code)) {
        this.claimedCoupons.push(code);
      }
      const res = validateCoupon(code, this.cartSubtotal);
      if (res.valid) {
        this.appliedCoupon = { code, ...res.coupon };
      } else if (PROMO_COUPONS[code]) {
        this.appliedCoupon = { code, ...PROMO_COUPONS[code] };
      }
      Swal.fire({
        icon: 'success',
        title: '¡Cupón Reclamado con Éxito!',
        html: `Se activó tu cupón especial <b>${code}</b> para Cartagena.<br>El descuento se reflejará automáticamente en tu carrito.`,
        confirmButtonColor: '#ff5722'
      });
    },

    removeCoupon() {
      this.appliedCoupon = null;
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'info',
        title: 'Cupón removido',
        showConfirmButton: false,
        timer: 1500
      });
    },

    // Wishlist Management
    toggleWishlist(product) {
      const index = this.wishlist.findIndex(id => id === product.id);
      if (index > -1) {
        this.wishlist.splice(index, 1);
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'info',
          title: 'Eliminado de Favoritos',
          showConfirmButton: false,
          timer: 1500
        });
      } else {
        this.wishlist.push(product.id);
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: '¡Guardado en Favoritos!',
          text: product.name.slice(0, 30) + '...',
          showConfirmButton: false,
          timer: 1800
        });
      }
      try {
        localStorage.setItem('omnistore_market_wishlist', JSON.stringify(this.wishlist));
      } catch (e) {
        console.warn('Failed to persist wishlist', e);
      }
    },

    isInWishlist(productId) {
      return this.wishlist.includes(productId);
    },

    // Quick View
    openQuickView(product) {
      this.quickViewProduct = product;
      this.quickViewQty = 1;
      this.selectedColor = (product.colors && product.colors[0]) || '';
      this.selectedSize = (product.sizes && product.sizes[0]) || '';

      if (this.quickViewModalInstance) {
        this.quickViewModalInstance.show();
      } else {
        const modalEl = document.getElementById('quickViewModal');
        if (modalEl) {
          this.quickViewModalInstance = new Modal(modalEl);
          this.quickViewModalInstance.show();
        }
      }
    },

    addQuickViewToCartAndClose(buyNow = false) {
      if (!this.quickViewProduct) return;
      this.addToCart(this.quickViewProduct, this.quickViewQty, {
        color: this.selectedColor,
        size: this.selectedSize
      });
      if (this.quickViewModalInstance) {
        this.quickViewModalInstance.hide();
      }
      if (buyNow) {
        setTimeout(() => {
          this.openCheckout();
        }, 300);
      }
    },

    openCartDrawer() {
      if (this.cartOffcanvasInstance) {
        this.cartOffcanvasInstance.show();
      } else {
        const el = document.getElementById('marketCartDrawer');
        if (el) {
          this.cartOffcanvasInstance = new Offcanvas(el);
          this.cartOffcanvasInstance.show();
        }
      }
    },

    // Checkout Flow Simulation & Order Placement
    openCheckout() {
      if (this.cart.length === 0) {
        Swal.fire('Carrito vacío', 'Añade productos antes de proceder al pago.', 'info');
        return;
      }

      // Check if user is authenticated
      if (!this.currentUser) {
        Swal.fire({
          title: 'Iniciar Sesión Requerido',
          text: 'Para realizar tu pedido con entrega segura en Cartagena, emitir tu factura DIAN y rastrear tu envío, debes ingresar a tu cuenta.',
          icon: 'info',
          showCancelButton: true,
          confirmButtonText: 'Iniciar Sesión',
          cancelButtonText: 'Crear Cuenta',
          confirmButtonColor: '#ff5722',
          cancelButtonColor: '#0d6efd',
          showCloseButton: true
        }).then((result) => {
          if (result.isConfirmed) {
            window.location.href = './login.html?redirect=marketplace.html';
          } else if (result.dismiss === Swal.DismissReason.cancel) {
            window.location.href = './register.html?redirect=marketplace.html';
          }
        });
        return;
      }

      // Fill in authenticated user info
      this.checkoutForm.name = this.currentUser.name || this.checkoutForm.name || 'Cliente Cartagena';
      this.checkoutForm.email = this.currentUser.email || this.checkoutForm.email || '';
      this.checkoutForm.phone = this.currentUser.phone || this.checkoutForm.phone || '+57 312 345 6789';
      this.checkoutForm.city = 'Cartagena de Indias';
      this.checkoutForm.zip = '130001';

      if (this.cartOffcanvasInstance) {
        this.cartOffcanvasInstance.hide();
      }
      this.checkoutStep = 1;
      if (this.checkoutModalInstance) {
        this.checkoutModalInstance.show();
      } else {
        const el = document.getElementById('checkoutModal');
        if (el) {
          this.checkoutModalInstance = new Modal(el);
          this.checkoutModalInstance.show();
        }
      }
    },

    async processCheckoutOrder() {
      if (!this.checkoutForm.name || !this.checkoutForm.email || !this.checkoutForm.address) {
        Swal.fire('Datos requeridos', 'Por favor completa tu nombre, correo electrónico y dirección de entrega en Cartagena.', 'warning');
        return;
      }

      this.isProcessingPayment = true;

      // Simulate payment processing time
      await new Promise(resolve => setTimeout(resolve, 1200));

      const totalPaid = this.cartTotal;
      const count = this.cartItemsCount;

      // Persist order in store-data.js (automatically logs order, deducts inventory, adds customer, creates shipping guide and invoice in Cartagena)
      const savedOrder = createStoreOrder(this.checkoutForm, this.cart, totalPaid, this.appliedCoupon);
      const orderNumber = savedOrder ? savedOrder.orderNumber : ('OMNI-CO-' + Math.floor(10000 + Math.random() * 90000));

      this.isProcessingPayment = false;

      if (this.checkoutModalInstance) {
        this.checkoutModalInstance.hide();
      }

      // Reset cart
      this.clearCart();

      // Show comprehensive success modal
      Swal.fire({
        icon: 'success',
        title: '¡Felicidades, tu pedido ha sido confirmado!',
        html: `
          <div class="text-start p-2">
            <p class="mb-1"><strong>Nº de Pedido:</strong> <span class="badge bg-primary fs-6">${orderNumber}</span></p>
            <p class="mb-1"><strong>Total Pagado:</strong> <span class="text-success fw-bold">${this.formatPrice(totalPaid)}</span></p>
            <p class="mb-1"><strong>Artículos:</strong> ${count} producto(s)</p>
            <p class="mb-1"><strong>Dirección de Entrega:</strong> ${this.checkoutForm.address}, ${this.checkoutForm.city || 'Cartagena de Indias'}</p>
            <p class="text-muted small mt-2"><i class="bi bi-truck me-1 text-success"></i> Tu pedido ha sido enviado al centro logístico de Cartagena (CEDI El Bosque) para su despacho inmediato.</p>
          </div>
        `,
        confirmButtonText: 'Ver Mis Pedidos',
        showCancelButton: true,
        cancelButtonText: 'Seguir Comprando',
        confirmButtonColor: '#ff5722'
      }).then((res) => {
        if (res.isConfirmed) {
          this.openCustomerOrdersModal();
        }
      });
    },

    // Customer Orders Modal ("Mis Pedidos")
    openCustomerOrdersModal() {
      if (!this.currentUser) {
        Swal.fire({
          title: 'Iniciar Sesión Requerido',
          text: 'Inicia sesión para consultar tu historial de compras y rastrear tus entregas en Cartagena.',
          icon: 'info',
          confirmButtonText: 'Iniciar Sesión',
          showCancelButton: true,
          cancelButtonText: 'Cancelar',
          confirmButtonColor: '#ff5722'
        }).then((result) => {
          if (result.isConfirmed) {
            window.location.href = './login.html?redirect=marketplace.html';
          }
        });
        return;
      }

      if (this.customerOrdersModalInstance) {
        this.customerOrdersModalInstance.show();
      } else {
        const el = document.getElementById('customerOrdersModal');
        if (el) {
          this.customerOrdersModalInstance = new Modal(el);
          this.customerOrdersModalInstance.show();
        }
      }
    },

    get customerOrders() {
      const allOrders = getOrdersList();
      if (!this.currentUser) return [];
      const userEmail = (this.currentUser.email || '').toLowerCase().trim();
      const userOrders = allOrders.filter(o => 
        o.customer && o.customer.email && o.customer.email.toLowerCase().trim() === userEmail
      );
      // If user is a demo or newly registered customer with no specific email match yet, show all sample orders for demo ease
      return userOrders.length > 0 ? userOrders : allOrders;
    },

    viewOrderDetail(order) {
      this.selectedOrderForDetail = order;
      const guides = getShippingGuidesList();
      const guide = guides.find(g => g.orderNumber === order.orderNumber);

      Swal.fire({
        title: `Pedido ${order.orderNumber}`,
        html: `
          <div class="text-start small">
            <p class="mb-1"><strong>Fecha:</strong> ${order.orderDate}</p>
            <p class="mb-1"><strong>Estado:</strong> <span class="badge ${order.status === 'delivered' ? 'bg-success' : (order.status === 'shipped' ? 'bg-info' : 'bg-warning')}">${order.status === 'delivered' ? 'Entregado' : (order.status === 'shipped' ? 'En Ruta' : 'En Preparación')}</span></p>
            <p class="mb-1"><strong>Dirección:</strong> ${order.shippingAddress || 'Cartagena de Indias'}</p>
            <p class="mb-1"><strong>Método de Pago:</strong> ${order.paymentMethod}</p>
            <hr class="my-2">
            <h6 class="fw-bold mb-2">Artículos:</h6>
            <ul class="list-unstyled mb-2">
              ${order.items.map(it => `<li class="d-flex justify-content-between py-1 border-bottom"><span>${it.name} (x${it.quantity})</span><span class="fw-bold">${this.formatPrice(it.price * it.quantity)}</span></li>`).join('')}
            </ul>
            <div class="d-flex justify-content-between fw-bold fs-6">
              <span>Total:</span>
              <span class="text-danger">${this.formatPrice(order.total)}</span>
            </div>
            ${guide ? `
              <div class="alert alert-info py-2 px-3 mt-3 mb-0">
                <strong><i class="bi bi-truck me-1"></i> Guía de Envío:</strong> ${guide.trackingNumber}<br>
                <strong>Transportadora:</strong> ${guide.carrier}<br>
                <strong>Estado Logístico:</strong> ${guide.status}
              </div>
            ` : ''}
          </div>
        `,
        confirmButtonText: 'Cerrar',
        confirmButtonColor: '#ff5722'
      });
    },

    // Product Reviews System
    openReviewsModal(product) {
      this.reviewProduct = product;
      this.newReviewRating = 5;
      this.newReviewComment = '';
      this.loadProductReviews(product.id, product.name);

      if (this.reviewsModalInstance) {
        this.reviewsModalInstance.show();
      } else {
        const el = document.getElementById('productReviewsModal');
        if (el) {
          this.reviewsModalInstance = new Modal(el);
          this.reviewsModalInstance.show();
        }
      }
    },

    loadProductReviews(productId, productName) {
      const allReviews = getReviewsList();
      const pName = (productName || '').toLowerCase();
      this.productReviewsList = allReviews.filter(r => 
        (r.productId && r.productId === productId) ||
        (r.product && r.product.toLowerCase().includes(pName.slice(0, 15)))
      );
    },

    submitProductReview() {
      if (!this.currentUser) {
        Swal.fire({
          title: 'Iniciar Sesión Requerido',
          text: 'Debes iniciar sesión para publicar una reseña y calificación sobre este producto.',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Iniciar Sesión',
          cancelButtonText: 'Cancelar',
          confirmButtonColor: '#ff5722'
        }).then((res) => {
          if (res.isConfirmed) {
            window.location.href = './login.html?redirect=marketplace.html';
          }
        });
        return;
      }

      const comment = this.newReviewComment.trim();
      if (comment.length < 5) {
        Swal.fire('Comentario muy corto', 'Por favor escribe tu opinión detallada sobre el producto (mínimo 5 caracteres).', 'warning');
        return;
      }

      this.isSubmittingReview = true;

      const reviewData = {
        productId: this.reviewProduct ? this.reviewProduct.id : null,
        product: this.reviewProduct ? this.reviewProduct.name : 'Producto OmniStore',
        rating: Number(this.newReviewRating) || 5,
        author: this.currentUser.name || 'Cliente',
        userId: this.currentUser.id || null,
        email: this.currentUser.email || '',
        city: 'Cartagena de Indias',
        comment: comment,
        date: new Date().toISOString().split('T')[0],
        status: 'Aprobada'
      };

      // Save review to central store
      addReview(reviewData);

      // Update product rating and reviewsCount in catalog
      if (this.reviewProduct) {
        const currentCount = this.reviewProduct.reviewsCount || 1;
        const currentRating = this.reviewProduct.rating || 5.0;
        const newCount = currentCount + 1;
        const newRating = Number(((currentRating * currentCount + reviewData.rating) / newCount).toFixed(1));

        updateProductInCatalog(this.reviewProduct.id, {
          rating: newRating,
          reviewsCount: newCount
        });
        this.reviewProduct.rating = newRating;
        this.reviewProduct.reviewsCount = newCount;
      }

      this.loadCatalog();
      this.loadProductReviews(this.reviewProduct?.id, this.reviewProduct?.name);
      this.newReviewComment = '';
      this.isSubmittingReview = false;

      Swal.fire({
        icon: 'success',
        title: '¡Gracias por tu calificación!',
        text: 'Tu reseña ha sido registrada exitosamente y se sincronizó con el panel administrativo.',
        timer: 2500,
        showConfirmButton: false
      });
    },

    // Change Delivery Location Prompt (Cartagena Neighborhoods)
    changeDeliveryLocation() {
      Swal.fire({
        title: 'Seleccionar Ubicación de Envío en Cartagena',
        html: `
          <div class="text-start">
            <p class="small text-muted mb-2">Selecciona tu barrio o sector en Cartagena de Indias para calcular la tarifa y tiempo de entrega:</p>
            <select id="swal-zone-select" class="form-select mb-3">
              <option value="Bocagrande, Cra 3 # 7-15">Zona 1: Bocagrande, Castillogrande & El Laguito (2 a 4 horas)</option>
              <option value="Centro Histórico, Calle del Arsenal">Zona 1: Centro Histórico & Getsemaní (2 a 4 horas)</option>
              <option value="Manga, Av. Miramar # 24-80">Zona 2: Manga & Pie de la Popa (3 a 6 horas)</option>
              <option value="Crespo, Calle 70 # 4-18">Zona 2: Crespo, Marbella & Cabrero (3 a 6 horas)</option>
              <option value="El Bosque, Av. Crisanto Luque">Zona 3: El Bosque, Los Alpes & Santa Lucía (Mismo día)</option>
              <option value="La Castellana, Av. Pedro de Heredia">Zona 3: La Castellana & Providencia (Mismo día)</option>
              <option value="Turbaco, Sector Conurbado">Zona 4: Turbaco & Zona Conurbada (24 horas)</option>
              <option value="Mamonal, Corredor Industrial">Zona 4: Mamonal & Pasacaballos (24 horas)</option>
            </select>
            <label class="form-label small fw-semibold">O escribe tu dirección exacta:</label>
            <input id="swal-zone-custom" class="form-control form-control-sm" placeholder="Ej: Cra 3 # 8-45, Bocagrande, Apto 402">
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Guardar Ubicación',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#ff5722',
        preConfirm: () => {
          const custom = document.getElementById('swal-zone-custom').value.trim();
          const selectVal = document.getElementById('swal-zone-select').value;
          return custom ? `Cartagena de Indias (${custom})` : `Cartagena de Indias (${selectVal})`;
        }
      }).then((result) => {
        if (result.isConfirmed && result.value) {
          this.deliveryAddress = result.value;
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Ubicación actualizada para Cartagena',
            showConfirmButton: false,
            timer: 1800
          });
        }
      });
    },

    // Formatted price helper (Colombian Pesos COP)
    formatPrice(amount) {
      const num = typeof amount === 'number' ? amount : (parseFloat(amount) || 0);
      return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0
      }).format(num);
    },

    destroy() {
      if (this.countdownInterval) {
        clearInterval(this.countdownInterval);
      }
    }
  }));
});
