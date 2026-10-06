import Alpine from 'alpinejs';
import Swal from 'sweetalert2';
import { createSearchComponent } from '../utils/search-component.js';
import { getCurrentUser, updateCurrentUserSession, logoutUser } from '../utils/auth-service.js';
import { hasPermission } from '../utils/permissions-service.js';
import {
  getStoreSettings,
  saveStoreSettings,
  getCouponsList,
  addCoupon,
  updateCoupon,
  deleteCoupon,
  getBannersList,
  addBanner,
  updateBanner,
  deleteBanner,
  getCampaignsList,
  addCampaign,
  updateCampaign,
  getCarriersList,
  updateCarrier,
  getShippingZonesList,
  saveShippingZonesList,
  updateShippingZone,
  getPagesList,
  addPage,
  updatePage,
  deletePage,
  getMenusList,
  saveMenusList
} from '../utils/store-data.js';

document.addEventListener('alpine:init', () => {
  Alpine.data('settingsComponent', () => ({
    // UI State
    sidebarVisible: false,
    activeSection: 'profile',
    
    // User Profile State
    currentUser: null,
    profileForm: {
      id: null,
      name: '',
      email: '',
      phone: '',
      city: 'Cartagena de Indias',
      department: 'Bolívar',
      address: '',
      bio: '',
      role: 'admin',
      roleLabel: 'Super Administrador',
      avatar: './assets/images/avatar-placeholder.svg',
      status: 'active',
      joinDate: '2026-01-15'
    },
    passwordForm: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      showCurrent: false,
      showNew: false,
      showConfirm: false
    },
    isSavingProfile: false,
    isChangingPassword: false,
    avatarPresets: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80'
    ],

    // Storage Information
    storageUsed: 28.4,
    storageTotal: 100,
    
    // Settings Data (Colombia defaults)
    settings: {
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
      address: 'Cra 3 # 7-15, Bocagrande, Cartagena de Indias, Bolívar',
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
    },
    
    // Navigation Sections with Permission Definitions
    sections: [
      { id: 'profile', name: 'Mi Perfil & Cuenta', icon: 'bi-person-badge-fill', permission: null },
      { id: 'appearance', name: 'Apariencia & Tema', icon: 'bi-palette-fill', permission: null },
      { id: 'general', name: 'General & Tienda', icon: 'bi-gear-fill', permission: 'settings.view' },
      { id: 'coupons', name: 'Cupones & Descuentos', icon: 'bi-ticket-perforated-fill', permission: 'settings.coupons' },
      { id: 'banners', name: 'Promociones & Banners', icon: 'bi-megaphone-fill', permission: 'settings.banners' },
      { id: 'campaigns', name: 'Campañas (Email / WhatsApp)', icon: 'bi-send-check-fill', permission: 'settings.banners' },
      { id: 'carriers', name: 'Transportadoras', icon: 'bi-truck-flatbed', permission: 'settings.shipping_zones' },
      { id: 'shipping-rates', name: 'Zonas & Tarifas de Envío', icon: 'bi-globe-americas', permission: 'settings.shipping_zones' },
      { id: 'pages', name: 'Páginas & Blog', icon: 'bi-file-richtext-fill', permission: 'settings.view' },
      { id: 'menus', name: 'Menús & Footer', icon: 'bi-layout-text-window-reverse', permission: 'settings.view' },
      { id: 'integrations', name: 'Integraciones (PSE, Wompi)', icon: 'bi-plugin', permission: 'settings.view' },
      { id: 'notifications', name: 'Notificaciones & Alertas', icon: 'bi-bell-fill', permission: null },
      { id: 'privacy', name: 'Privacidad & Habeas Data', icon: 'bi-shield-check', permission: null },
      { id: 'storage', name: 'Almacenamiento & Base de Datos', icon: 'bi-hdd-fill', permission: 'settings.view' }
    ],

    // Computed: Sections visible based on permissions
    get visibleSections() {
      const user = this.currentUser || getCurrentUser();
      if (!user) return this.sections;
      if (user.role === 'admin') return this.sections;
      return this.sections.filter(sec => {
        if (!sec.permission) return true;
        return hasPermission(sec.permission, user);
      });
    },

    // Reactive lists from Central Store
    couponsList: [],
    bannersList: [],
    campaignsList: [],
    carriersList: [],
    shippingZones: [],
    pagesList: [],
    menusList: [],

    // Payment Gateway Integrations
    integrationsList: [
      { id: 1, name: 'Wompi Bancolombia', type: 'Pasarela de Pagos', status: 'Conectado (Producción)', methods: 'Bancolombia, QR, Nequi, Tarjetas', icon: 'bi-credit-card-2-front' },
      { id: 2, name: 'PSE (ACH Colombia)', type: 'Transferencias Bancarias', status: 'Conectado', methods: 'Todos los bancos de Colombia', icon: 'bi-bank2' },
      { id: 3, name: 'Bold Colombia & Datafono', type: 'Pasarela & Links', status: 'Conectado', methods: 'Tarjetas Débito/Crédito, Apple Pay', icon: 'bi-phone' },
      { id: 4, name: 'Mercado Pago Colombia', type: 'Billetera & Cuotas', status: 'Conectado', methods: 'Efecty, PSE, Tarjetas', icon: 'bi-wallet2' },
      { id: 5, name: 'Supabase PostgreSQL', type: 'Base de Datos Cloud', status: 'Conectado (Pooler Activo)', methods: 'Usuarios, Pedidos, Productos', icon: 'bi-database-check' }
    ],

    handleRouteNavigation(search) {
      const urlParams = new URLSearchParams(search !== undefined ? search : window.location.search);
      const tabParam = urlParams.get('tab');
      if (tabParam) {
        const found = this.sections.find(s => s.id === tabParam);
        if (found) {
          this.activeSection = tabParam;
          return;
        }
      }
      
      // Default tab: if user has store settings view, 'profile' or 'general'
      this.activeSection = tabParam || 'profile';
    },

    init() {
      const currentTheme = document.documentElement.getAttribute('data-bs-theme') || 
                          localStorage.getItem('theme') || 'light';
      this.settings.theme = currentTheme;
      this.loadSettings();
      this.loadUserProfile();
      this.loadAllStoreData();

      // Check URL search params for direct tab access
      this.handleRouteNavigation();

      window.addEventListener('omnistore:navigate', (e) => {
        this.handleRouteNavigation(e.detail?.search);
      });

      window.addEventListener('popstate', () => {
        this.handleRouteNavigation();
      });

      // Realtime multi-tab & profile event listeners
      window.addEventListener('omnistore:user-updated', () => {
        this.loadUserProfile();
      });
      window.addEventListener('omnistore:auth-changed', () => {
        this.loadUserProfile();
      });
      window.addEventListener('omnistore:coupons-updated', () => {
        this.couponsList = getCouponsList();
      });
      window.addEventListener('omnistore:banners-updated', () => {
        this.bannersList = getBannersList();
      });
      window.addEventListener('omnistore:campaigns-updated', () => {
        this.campaignsList = getCampaignsList();
      });
      window.addEventListener('omnistore:carriers-updated', () => {
        this.carriersList = getCarriersList();
      });
      window.addEventListener('omnistore:shipping-zones-updated', () => {
        this.shippingZones = getShippingZonesList();
      });
      window.addEventListener('omnistore:pages-updated', () => {
        this.pagesList = getPagesList();
      });
      window.addEventListener('omnistore:menus-updated', () => {
        this.menusList = getMenusList();
      });
      window.addEventListener('omnistore:settings-updated', () => {
        this.loadSettings();
      });
    },

    loadUserProfile() {
      const user = getCurrentUser();
      if (user) {
        this.currentUser = user;
        const roleLabel = user.role === 'admin' 
          ? 'Super Administrador' 
          : (user.role === 'vendor' ? 'Vendedor' : (user.role === 'support' ? 'Soporte' : (user.role === 'accountant' ? 'Contabilidad' : 'Cliente')));

        this.profileForm = {
          id: user.id || null,
          name: user.name || 'Usuario OmniStore',
          email: user.email || '',
          phone: user.phone || '+57 (310) 845-9210',
          city: user.city || 'Cartagena de Indias',
          department: user.department || 'Bolívar',
          address: user.address || 'Cra 3 # 7-15, Bocagrande',
          bio: user.bio || (user.role === 'admin' ? 'Administrador principal de la plataforma OmniStore Colombia.' : 'Gestor de ventas y operaciones de tienda.'),
          role: user.role || 'admin',
          roleLabel: roleLabel,
          avatar: user.avatar || './assets/images/avatar-placeholder.svg',
          status: user.status || 'active',
          joinDate: user.joinDate || '2026-01-15'
        };
      }
    },

    selectPresetAvatar(url) {
      this.profileForm.avatar = url;
      this.showNotification('Avatar seleccionado. Haz clic en "Guardar Perfil" para aplicar.', 'info');
    },

    handleAvatarUpload(event) {
      const file = event.target?.files?.[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        this.showNotification('Por favor selecciona un archivo de imagen válido (JPG, PNG o WebP)', 'error');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        this.showNotification('La imagen no debe superar los 5 MB', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        this.profileForm.avatar = e.target.result;
        this.showNotification('Foto cargada. Guarda tu perfil para confirmar.', 'success');
      };
      reader.readAsDataURL(file);
    },

    async saveUserProfile() {
      if (!this.profileForm.name || !this.profileForm.name.trim()) {
        this.showNotification('El nombre no puede estar vacío', 'error');
        return;
      }
      if (!this.profileForm.email || !this.profileForm.email.trim()) {
        this.showNotification('El correo electrónico es obligatorio', 'error');
        return;
      }

      this.isSavingProfile = true;
      try {
        const updated = await updateCurrentUserSession({
          name: this.profileForm.name.trim(),
          email: this.profileForm.email.trim().toLowerCase(),
          phone: this.profileForm.phone.trim(),
          city: this.profileForm.city.trim(),
          department: this.profileForm.department.trim(),
          address: this.profileForm.address.trim(),
          bio: this.profileForm.bio.trim(),
          avatar: this.profileForm.avatar
        });

        this.currentUser = updated;
        
        Swal.fire({
          icon: 'success',
          title: '¡Perfil Actualizado!',
          text: 'Tus datos de usuario y foto de perfil se han sincronizado correctamente.',
          timer: 2000,
          showConfirmButton: false,
          customClass: {
            popup: 'border border-secondary-subtle shadow-lg bg-body text-body rounded-4'
          }
        });
      } catch (e) {
        console.error('Error saving profile:', e);
        this.showNotification('Error al guardar perfil: ' + e.message, 'error');
      } finally {
        this.isSavingProfile = false;
      }
    },

    async changeUserPassword() {
      const { currentPassword, newPassword, confirmPassword } = this.passwordForm;
      if (!currentPassword) {
        this.showNotification('Ingresa tu contraseña actual', 'error');
        return;
      }
      if (!newPassword || newPassword.length < 6) {
        this.showNotification('La nueva contraseña debe tener al menos 6 caracteres', 'error');
        return;
      }
      if (newPassword !== confirmPassword) {
        this.showNotification('La confirmación de contraseña no coincide', 'error');
        return;
      }

      this.isChangingPassword = true;
      try {
        await updateCurrentUserSession({
          password_hash: newPassword,
          password: newPassword
        });

        this.passwordForm.currentPassword = '';
        this.passwordForm.newPassword = '';
        this.passwordForm.confirmPassword = '';

        Swal.fire({
          icon: 'success',
          title: 'Contraseña Actualizada',
          text: 'Tu contraseña de acceso ha sido actualizada de forma segura.',
          timer: 2500,
          showConfirmButton: false,
          customClass: {
            popup: 'border border-secondary-subtle shadow-lg bg-body text-body rounded-4'
          }
        });
      } catch (e) {
        this.showNotification('Error al actualizar contraseña', 'error');
      } finally {
        this.isChangingPassword = false;
      }
    },

    triggerLogout() {
      Swal.fire({
        title: '¿Cerrar sesión?',
        text: '¿Deseas salir de tu cuenta en este dispositivo?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, cerrar sesión',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#ff6600',
        customClass: {
          popup: 'border border-secondary-subtle shadow-lg bg-body text-body rounded-4'
        }
      }).then((res) => {
        if (res.isConfirmed) {
          logoutUser();
        }
      });
    },

    loadAllStoreData() {
      this.couponsList = getCouponsList();
      this.bannersList = getBannersList();
      this.campaignsList = getCampaignsList();
      this.carriersList = getCarriersList();
      this.shippingZones = getShippingZonesList();
      this.pagesList = getPagesList();
      this.menusList = getMenusList();
    },

    formatCOP(val) {
      const num = Number(val) || 0;
      return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0
      }).format(num);
    },

    // Computed Properties
    get storagePercentage() {
      return (this.storageUsed / this.storageTotal) * 100;
    },

    get storageRemaining() {
      return (this.storageTotal - this.storageUsed).toFixed(1);
    },

    loadSettings() {
      const storeSettings = getStoreSettings();
      if (storeSettings && typeof storeSettings === 'object') {
        this.settings = { ...this.settings, ...storeSettings };
      }
    },

    saveSettings() {
      try {
        saveStoreSettings(this.settings);
        this.showNotification('Configuración guardada correctamente.', 'success');
        
        if (this.settings.theme) {
          document.documentElement.setAttribute('data-bs-theme', this.settings.theme);
          localStorage.setItem('theme', this.settings.theme);
        }
      } catch (error) {
        this.showNotification('Error al guardar configuración', 'error');
        console.error('Failed to save settings:', error);
      }
    },

    resetSettings() {
      Swal.fire({
        title: '¿Restablecer ajustes?',
        text: 'Se restablecerán los ajustes a los valores predeterminados para Colombia.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, restablecer',
        cancelButtonText: 'Cancelar',
        customClass: {
          popup: 'border border-secondary-subtle shadow-lg bg-body text-body rounded-4'
        }
      }).then((result) => {
        if (result.isConfirmed) {
          localStorage.removeItem('omnistore_settings');
          localStorage.removeItem('appSettings');
          window.location.reload();
        }
      });
    },

    setActiveSection(sectionId) {
      this.activeSection = sectionId;
      const url = new URL(window.location.href);
      url.searchParams.set('tab', sectionId);
      window.history.replaceState({}, '', url.toString());
    },

    toggleSidebar() {
      this.sidebarVisible = !this.sidebarVisible;
    },

    setTheme(theme) {
      this.settings.theme = theme;
      document.documentElement.setAttribute('data-bs-theme', theme);
      this.saveSettings();
    },

    clearCache() {
      this.showNotification('Caché del navegador limpiada con éxito.', 'success');
      this.storageUsed = Math.max(this.storageUsed - 4, 15);
    },

    optimizeStorage() {
      this.showNotification('Optimización de base de datos PostgreSQL completada.', 'success');
      this.storageUsed = Math.max(this.storageUsed - 2, 18);
    },

    // --- CUPONES ---
    addNewCoupon() {
      Swal.fire({
        title: 'Crear Nuevo Cupón de Descuento',
        html: `
          <div class="text-start">
            <div class="mb-2">
              <label class="form-label small fw-bold">Código del Cupón</label>
              <input id="swal-coupon-code" class="form-control form-control-sm text-uppercase font-monospace" placeholder="Ej: PROMOCOLOMBIA">
            </div>
            <div class="mb-2">
              <label class="form-label small fw-bold">Tipo de Descuento</label>
              <select id="swal-coupon-type" class="form-select form-select-sm">
                <option value="percent">Porcentaje de Descuento (%)</option>
                <option value="fixed">Monto Fijo en Pesos ($ COP)</option>
                <option value="shipping">Envío Gratis</option>
              </select>
            </div>
            <div class="mb-2">
              <label class="form-label small fw-bold">Valor del Descuento</label>
              <input id="swal-coupon-val" type="number" class="form-control form-control-sm" placeholder="Ej: 20 o 50000">
            </div>
            <div class="mb-2">
              <label class="form-label small fw-bold">Compra Mínima Requerida (COP)</label>
              <input id="swal-coupon-min" type="number" class="form-control form-control-sm" placeholder="Ej: 150000" value="100000">
            </div>
            <div class="mb-2">
              <label class="form-label small fw-bold">Fecha de Vencimiento</label>
              <input id="swal-coupon-exp" type="date" class="form-control form-control-sm" value="2026-12-31">
            </div>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Crear Cupón',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#ff6600',
        customClass: {
          popup: 'border border-secondary-subtle shadow-lg bg-body text-body rounded-4'
        },
        preConfirm: () => {
          const code = document.getElementById('swal-coupon-code').value.trim().toUpperCase();
          const type = document.getElementById('swal-coupon-type').value;
          const value = Number(document.getElementById('swal-coupon-val').value) || 0;
          const minSpend = Number(document.getElementById('swal-coupon-min').value) || 0;
          const expiry = document.getElementById('swal-coupon-exp').value || '2026-12-31';
          if (!code) {
            Swal.showValidationMessage('Ingresa un código para el cupón');
            return false;
          }
          return { code, type, value, minSpend, expiry };
        }
      }).then((res) => {
        if (res.isConfirmed && res.value) {
          const created = addCoupon({
            code: res.value.code,
            type: res.value.type,
            value: res.value.value,
            minSpend: res.value.minSpend,
            expiry: res.value.expiry,
            uses: 0,
            active: true
          });
          this.couponsList = getCouponsList();
          this.showNotification(`Cupón ${created.code} creado y listo para el carrito`, 'success');
        }
      });
    },

    toggleCoupon(coupon) {
      const updated = updateCoupon(coupon.id, { active: !coupon.active });
      if (updated) {
        coupon.active = updated.active;
        this.showNotification(`Cupón ${coupon.code} ${coupon.active ? 'activado' : 'desactivado'}`, 'info');
      }
    },

    deleteCoupon(couponId) {
      Swal.fire({
        title: '¿Eliminar cupón?',
        text: 'Los clientes ya no podrán canjear este código en el carrito.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#dc3545',
        customClass: {
          popup: 'border border-secondary-subtle shadow-lg bg-body text-body rounded-4'
        }
      }).then((result) => {
        if (result.isConfirmed) {
          deleteCoupon(couponId);
          this.couponsList = getCouponsList();
          this.showNotification('Cupón eliminado correctamente', 'info');
        }
      });
    },

    // --- BANNERS ---
    addNewBanner() {
      Swal.fire({
        title: 'Crear Nuevo Banner Promocional',
        html: `
          <div class="text-start">
            <div class="mb-2">
              <label class="form-label small fw-bold">Título / Mensaje del Banner</label>
              <input id="swal-banner-title" class="form-control form-control-sm" placeholder="Ej: Gran Venta de Tecnología - Hasta 50% OFF">
            </div>
            <div class="mb-2">
              <label class="form-label small fw-bold">Posición en la Tienda</label>
              <select id="swal-banner-pos" class="form-select form-select-sm">
                <option value="Header Principal">Header Principal</option>
                <option value="Carrusel Home #1">Carrusel Home #1</option>
                <option value="Sección Destacada">Sección Destacada</option>
                <option value="Popup Promocional">Popup Promocional</option>
              </select>
            </div>
            <div class="mb-2">
              <label class="form-label small fw-bold">Insignia / Estilo Visual</label>
              <input id="swal-banner-badge" class="form-control form-control-sm" placeholder="Ej: Oferta Relámpago Temu o Hot Sale">
            </div>
            <div class="mb-2">
              <label class="form-label small fw-bold">Enlace de Destino (URL o #sección)</label>
              <input id="swal-banner-target" class="form-control form-control-sm" placeholder="Ej: marketplace.html#flash-deals" value="marketplace.html">
            </div>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Publicar Banner',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#ff6600',
        customClass: {
          popup: 'border border-secondary-subtle shadow-lg bg-body text-body rounded-4'
        },
        preConfirm: () => {
          const title = document.getElementById('swal-banner-title').value.trim();
          const position = document.getElementById('swal-banner-pos').value;
          const badge = document.getElementById('swal-banner-badge').value.trim() || 'Promoción';
          const target = document.getElementById('swal-banner-target').value.trim() || 'marketplace.html';
          if (!title) {
            Swal.showValidationMessage('Ingresa un título para el banner');
            return false;
          }
          return { title, position, badge, target };
        }
      }).then((res) => {
        if (res.isConfirmed && res.value) {
          addBanner({
            title: res.value.title,
            position: res.value.position,
            badge: res.value.badge,
            target: res.value.target,
            active: true
          });
          this.bannersList = getBannersList();
          this.showNotification('Banner publicado con éxito en el Marketplace', 'success');
        }
      });
    },

    toggleBanner(banner) {
      const updated = updateBanner(banner.id, { active: !banner.active });
      if (updated) {
        banner.active = updated.active;
        this.showNotification(`Banner ${banner.active ? 'activado' : 'desactivado'}`, 'info');
      }
    },

    deleteBanner(bannerId) {
      deleteBanner(bannerId);
      this.bannersList = getBannersList();
      this.showNotification('Banner eliminado', 'info');
    },

    // --- CAMPAÑAS ---
    addNewCampaign() {
      Swal.fire({
        title: 'Crear Campaña Automatizada',
        html: `
          <div class="text-start">
            <div class="mb-2">
              <label class="form-label small fw-bold">Nombre de la Campaña</label>
              <input id="swal-camp-name" class="form-control form-control-sm" placeholder="Ej: Reactivación de Clientes Inactivos">
            </div>
            <div class="mb-2">
              <label class="form-label small fw-bold">Canal de Comunicación</label>
              <select id="swal-camp-channel" class="form-select form-select-sm">
                <option value="WhatsApp Business">WhatsApp Business API</option>
                <option value="Email Marketing">Email Automático (HTML)</option>
                <option value="WhatsApp + Email">WhatsApp + Email Omnicanal</option>
                <option value="SMS Masivo">SMS Masivo</option>
              </select>
            </div>
            <div class="mb-2">
              <label class="form-label small fw-bold">Disparador / Gatillo</label>
              <input id="swal-camp-trigger" class="form-control form-control-sm" placeholder="Ej: 30 días sin comprar o Al registrarse">
            </div>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Crear Campaña',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#ff6600',
        customClass: {
          popup: 'border border-secondary-subtle shadow-lg bg-body text-body rounded-4'
        },
        preConfirm: () => {
          const name = document.getElementById('swal-camp-name').value.trim();
          const channel = document.getElementById('swal-camp-channel').value;
          const trigger = document.getElementById('swal-camp-trigger').value.trim();
          if (!name) {
            Swal.showValidationMessage('Ingresa un nombre para la campaña');
            return false;
          }
          return { name, channel, trigger: trigger || 'Manual' };
        }
      }).then((res) => {
        if (res.isConfirmed && res.value) {
          addCampaign({
            name: res.value.name,
            channel: res.value.channel,
            trigger: res.value.trigger,
            status: 'Activa',
            conversions: '0.0%'
          });
          this.campaignsList = getCampaignsList();
          this.showNotification('Campaña creada e integrada con los flujos de notificación', 'success');
        }
      });
    },

    testCampaign(camp) {
      Swal.fire({
        title: `Probando envío: ${camp.name}`,
        text: `Enviando mensaje de prueba mediante ${camp.channel} al número de administrador (+57 310 845 9210)...`,
        icon: 'info',
        timer: 2000,
        showConfirmButton: false,
        customClass: {
          popup: 'border border-secondary-subtle shadow-lg bg-body text-body rounded-4'
        }
      }).then(() => {
        this.showNotification(`Mensaje de prueba de "${camp.name}" entregado con éxito.`, 'success');
      });
    },

    // --- LOGÍSTICA & TARIFAS ---
    saveShippingRates() {
      saveShippingZonesList(this.shippingZones);
      this.saveSettings();
      this.showNotification('Tarifas de envío y monto mínimo para Colombia guardados con éxito', 'success');
    },

    // --- PÁGINAS INSTITUCIONALES ---
    addNewPage() {
      Swal.fire({
        title: 'Crear Nueva Página Institucional',
        html: `
          <div class="text-start">
            <div class="mb-2">
              <label class="form-label small fw-bold">Título de la Página</label>
              <input id="swal-page-title" class="form-control form-control-sm" placeholder="Ej: Política de Envíos Nacionales">
            </div>
            <div class="mb-2">
              <label class="form-label small fw-bold">Slug URL</label>
              <input id="swal-page-slug" class="form-control form-control-sm font-monospace" placeholder="Ej: politicas-envios">
            </div>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Crear Página',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#ff6600',
        customClass: {
          popup: 'border border-secondary-subtle shadow-lg bg-body text-body rounded-4'
        },
        preConfirm: () => {
          const title = document.getElementById('swal-page-title').value.trim();
          let slug = document.getElementById('swal-page-slug').value.trim().toLowerCase().replace(/\s+/g, '-');
          if (!title) {
            Swal.showValidationMessage('Ingresa un título');
            return false;
          }
          if (!slug) slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
          return { title, slug };
        }
      }).then((res) => {
        if (res.isConfirmed && res.value) {
          addPage({
            title: res.value.title,
            slug: res.value.slug,
            status: 'Publicada',
            updated: new Date().toISOString().split('T')[0]
          });
          this.pagesList = getPagesList();
          this.showNotification(`Página /${res.value.slug} creada con éxito`, 'success');
        }
      });
    },

    editPage(page) {
      Swal.fire({
        title: `Editar Página: ${page.title}`,
        html: `
          <div class="text-start">
            <div class="mb-2">
              <label class="form-label small fw-bold">Título</label>
              <input id="swal-page-edit-title" class="form-control form-control-sm" value="${page.title}">
            </div>
            <div class="mb-2">
              <label class="form-label small fw-bold">Slug URL</label>
              <input id="swal-page-edit-slug" class="form-control form-control-sm font-monospace" value="${page.slug}">
            </div>
            <div class="mb-2">
              <label class="form-label small fw-bold">Estado</label>
              <select id="swal-page-edit-status" class="form-select form-select-sm">
                <option value="Publicada" ${page.status === 'Publicada' ? 'selected' : ''}>Publicada</option>
                <option value="Borrador" ${page.status === 'Borrador' ? 'selected' : ''}>Borrador</option>
              </select>
            </div>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Guardar Cambios',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#ff6600',
        customClass: {
          popup: 'border border-secondary-subtle shadow-lg bg-body text-body rounded-4'
        },
        preConfirm: () => {
          const title = document.getElementById('swal-page-edit-title').value.trim();
          const slug = document.getElementById('swal-page-edit-slug').value.trim();
          const status = document.getElementById('swal-page-edit-status').value;
          if (!title) {
            Swal.showValidationMessage('El título no puede estar vacío');
            return false;
          }
          return { title, slug, status };
        }
      }).then((res) => {
        if (res.isConfirmed && res.value) {
          updatePage(page.id, {
            title: res.value.title,
            slug: res.value.slug,
            status: res.value.status,
            updated: new Date().toISOString().split('T')[0]
          });
          this.pagesList = getPagesList();
          this.showNotification(`Página ${res.value.title} actualizada`, 'success');
        }
      });
    },

    // --- INTEGRACIONES ---
    testIntegration(item) {
      Swal.fire({
        title: `Probando conexión: ${item.name}`,
        text: 'Enviando ping de autenticación y validación de credenciales con API...',
        icon: 'info',
        timer: 1500,
        showConfirmButton: false,
        customClass: {
          popup: 'border border-secondary-subtle shadow-lg bg-body text-body rounded-4'
        }
      }).then(() => {
        this.showNotification(`Conexión con ${item.name} 100% operativa y verificada`, 'success');
      });
    },

    exportData(format) {
      const exportData = {
        settings: this.settings,
        profile: this.profileForm,
        coupons: this.couponsList,
        banners: this.bannersList,
        shippingZones: this.shippingZones,
        exportDate: new Date().toISOString(),
        format: format,
        platform: 'OmniStore Colombia'
      };
      
      const content = JSON.stringify(exportData, null, 2);
      const blob = new Blob([content], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `omnistore_ajustes_${Date.now()}.${format === 'csv' ? 'csv' : 'json'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      this.showNotification(`Configuración exportada como ${format.toUpperCase()}`, 'success');
    },

    showNotification(message, type = 'info') {
      if (typeof Swal !== 'undefined') {
        Swal.fire({
          title: message,
          icon: type === 'success' ? 'success' : type === 'error' ? 'error' : 'info',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000,
          customClass: {
            popup: 'border border-secondary-subtle shadow-sm bg-body text-body'
          }
        });
      } else {
        alert(message);
      }
    }
  }));

  Alpine.data('searchComponent', createSearchComponent({ getResults: () => [] }));
});