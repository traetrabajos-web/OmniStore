import Alpine from 'alpinejs';
import Swal from 'sweetalert2';
import { Modal } from 'bootstrap';
import ApexCharts from '../utils/apex.js';
import { axisInk } from '../utils/chart-palette.js';
import {
  getUsersList,
  saveUsersList,
  addUser,
  updateUser,
  deleteUser,
  getReviewsList,
  saveReviewsList,
  addReview,
  updateReviewStatus,
  deleteReview
} from '../utils/store-data.js';
import {
  MODULES_PERMISSIONS_CONFIG,
  ROLE_DEFAULT_PERMISSIONS,
  getUserPermissions,
  saveUserPermissions,
  hasPermission,
  getAllAvailablePermissionIds
} from '../utils/permissions-service.js';

const DEMO_COLOMBIAN_USERS = [
  {
    id: 1,
    name: 'Alejandro Morales (SuperAdmin)',
    email: 'admin@omnistore.com',
    role: 'admin',
    status: 'active',
    lastActive: 'Hace 2 min',
    joinDate: '2025-01-15',
    avatar: './assets/images/avatar-placeholder.svg',
    phone: '+57 (310) 845-9210',
    department: 'Bolívar',
    city: 'Bocagrande, Cartagena',
    country: 'Colombia'
  },
  {
    id: 2,
    name: 'Sofía Valenzuela (Store Manager)',
    email: 'vendor@omnistore.com',
    role: 'vendor',
    status: 'active',
    lastActive: 'Hace 1 hora',
    joinDate: '2025-02-20',
    avatar: './assets/images/avatar-placeholder.svg',
    phone: '+57 (315) 720-4491',
    department: 'Bolívar',
    city: 'Manga, Cartagena',
    country: 'Colombia'
  },
  {
    id: 3,
    name: 'Carlos Mendoza (Cliente)',
    email: 'cliente@omnistore.com',
    role: 'customer',
    status: 'active',
    lastActive: 'Hace 3 horas',
    joinDate: '2025-03-10',
    avatar: './assets/images/avatar-placeholder.svg',
    phone: '+57 (301) 630-1845',
    department: 'Bolívar',
    city: 'Crespo, Cartagena',
    country: 'Colombia'
  },
  {
    id: 4,
    name: 'Valeria Restrepo',
    email: 'valeria.restrepo@gmail.com',
    role: 'customer',
    status: 'active',
    lastActive: 'Hace 15 min',
    joinDate: '2025-04-05',
    avatar: './assets/images/avatar-placeholder.svg',
    phone: '+57 (318) 492-3301',
    department: 'Bolívar',
    city: 'Castillogrande, Cartagena',
    country: 'Colombia'
  },
  {
    id: 5,
    name: 'Mateo Gómez (Tienda Tech)',
    email: 'mateo.gomez@techstore.co',
    role: 'vendor',
    status: 'active',
    lastActive: 'Hace 5 horas',
    joinDate: '2025-01-30',
    avatar: './assets/images/avatar-placeholder.svg',
    phone: '+57 (320) 811-9042',
    department: 'Bolívar',
    city: 'Centro Histórico, Cartagena',
    country: 'Colombia'
  },
  {
    id: 6,
    name: 'Camila Osorio',
    email: 'camila.osorio@hotmail.com',
    role: 'customer',
    status: 'pending',
    lastActive: 'Ayer',
    joinDate: '2025-05-12',
    avatar: './assets/images/avatar-placeholder.svg',
    phone: '+57 (314) 205-6712',
    department: 'Bolívar',
    city: 'Pie de la Popa, Cartagena',
    country: 'Colombia'
  },
  {
    id: 7,
    name: 'Andrés Jaramillo',
    email: 'andres.jaramillo@outlook.com',
    role: 'customer',
    status: 'active',
    lastActive: 'Hace 30 min',
    joinDate: '2025-06-01',
    avatar: './assets/images/avatar-placeholder.svg',
    phone: '+57 (300) 934-5511',
    department: 'Bolívar',
    city: 'El Cabrero, Cartagena',
    country: 'Colombia'
  }
];

document.addEventListener('alpine:init', () => {
  Alpine.data('userTable', () => ({
    users: [],
    filteredUsers: [],
    selectedUsers: [],
    currentPage: 1,
    itemsPerPage: 10,
    searchQuery: '',
    statusFilter: '',
    roleFilter: '',
    sortField: 'name',
    sortDirection: 'asc',
    isLoading: false,

    charts: {},

    // Cartagena Zones Distribution
    departmentStats: [
      { name: 'Bocagrande, Castillogrande & Laguito (Zona 1)', percentage: 38, count: 1680, color: '#ff5722' },
      { name: 'Manga, Crespo, Marbella & Cabrero (Zona 2)', percentage: 28, count: 1240, color: '#3b82f6' },
      { name: 'Centro Histórico & Getsemaní (Zona 1)', percentage: 16, count: 710, color: '#10b981' },
      { name: 'El Bosque, Los Alpes & La Castellana (Zona 3)', percentage: 12, count: 530, color: '#8b5cf6' },
      { name: 'Turbaco, Mamonal & Pasacaballos (Zona 4)', percentage: 6, count: 265, color: '#f59e0b' }
    ],

    // Recent Cartagena User Activities
    recentActivities: [
      { id: 1, type: 'login', user: 'Alejandro Morales', action: 'inició sesión desde Bocagrande, Cartagena', time: 'Hace 2 min', icon: 'box-arrow-in-right', details: 'IP: 181.129.45.12 (Fibra Óptica)' },
      { id: 2, type: 'register', user: 'Valeria Restrepo', action: 'se registró como Cliente en Castillogrande', time: 'Hace 15 min', icon: 'person-plus', details: 'Cupón de bienvenida BIENVENIDO50K reclamado' },
      { id: 3, type: 'login', user: 'Sofía Valenzuela', action: 'actualizó stock de productos en CEDI El Bosque', time: 'Hace 1 hora', icon: 'box-seam', details: 'Sincronizado con Supabase PostgreSQL' },
      { id: 4, type: 'register', user: 'Carlos Mendoza', action: 'realizó un pago exitoso vía Nequi/PSE', time: 'Hace 3 horas', icon: 'credit-card', details: 'Orden #OMNI-2026-84920 ($ 6.475.000 COP) - Entrega en Crespo' }
    ],

    // Tab state
    activeTab: 'users', // 'users' | 'roles' | 'reviews'

    // Granular Permissions System
    modulesConfig: MODULES_PERMISSIONS_CONFIG,
    selectedUserForPermissions: null,
    editingPermissions: [],
    permissionsSearchQuery: '',
    permissionsFilterModule: '',
    permissionsModalInstance: null,
    totalSystemPermissions: getAllAvailablePermissionIds().length,

    // Roles Matrix with granular permissions mapping
    rolesMatrix: [
      { id: 'admin', name: 'SuperAdmin / Propietario', badge: 'bg-primary', usersCount: 2, desc: 'Acceso total sin restricciones a todos los módulos, ajustes, finanzas y base de datos.', permissions: ['dashboard.*', 'products.*', 'orders.*', 'users.*', 'analytics.*', 'reports.*', 'messages.*', 'calendar.*', 'settings.*', 'security.*', 'files.*', 'help.*'] },
      { id: 'vendor', name: 'Vendedor / Store Manager', badge: 'bg-info', usersCount: 5, desc: 'Gestión de catálogo de productos, stock, despacho de órdenes, atención de mensajes y agenda.', permissions: ['dashboard.view', 'products.view', 'products.create', 'products.edit', 'products.kardex', 'products.suppliers', 'products.export', 'orders.view', 'orders.edit_status', 'orders.shipping', 'orders.export', 'messages.*', 'calendar.*', 'help.view'] },
      { id: 'support', name: 'Soporte & Atención al Cliente', badge: 'bg-warning text-dark', usersCount: 8, desc: 'Atención de tickets PQRS, chat en directo con clientes, seguimiento de órdenes y moderación de reseñas.', permissions: ['dashboard.view', 'orders.view', 'users.view', 'users.reviews', 'messages.*', 'calendar.view', 'help.*'] },
      { id: 'accountant', name: 'Contador / Facturación DIAN', badge: 'bg-success', usersCount: 3, desc: 'Descarga de reportes fiscales, facturación electrónica DIAN con CUFE, IVA del 19% y exportación contable.', permissions: ['dashboard.view', 'orders.view', 'orders.payments', 'orders.export', 'reports.*', 'help.view'] }
    ],

    openPermissionsModal(user) {
      this.selectedUserForPermissions = { ...user };
      const currentPerms = getUserPermissions(user);
      if (currentPerms.includes('*')) {
        this.editingPermissions = getAllAvailablePermissionIds();
      } else {
        this.editingPermissions = [...currentPerms];
      }
      this.permissionsSearchQuery = '';
      this.permissionsFilterModule = '';
      const modalEl = document.getElementById('permissionsModal');
      if (modalEl) {
        this.permissionsModalInstance = Modal.getOrCreateInstance(modalEl);
        this.permissionsModalInstance.show();
      }
    },

    getUserPermissionsCount(user) {
      const perms = getUserPermissions(user);
      return perms.includes('*') ? this.totalSystemPermissions : perms.length;
    },

    getUserPermissionsPercentage(user) {
      return Math.round((this.getUserPermissionsCount(user) / this.totalSystemPermissions) * 100);
    },

    isPermissionChecked(permId) {
      return this.editingPermissions.includes('*') || this.editingPermissions.includes(permId);
    },

    togglePermission(permId) {
      if (this.editingPermissions.includes('*')) {
        this.editingPermissions = getAllAvailablePermissionIds();
      }
      const idx = this.editingPermissions.indexOf(permId);
      if (idx > -1) {
        this.editingPermissions.splice(idx, 1);
      } else {
        this.editingPermissions.push(permId);
      }
    },

    isModuleAllChecked(moduleConfig) {
      if (this.editingPermissions.includes('*')) return true;
      if (!moduleConfig || !moduleConfig.actions) return false;
      return moduleConfig.actions.every(act => this.editingPermissions.includes(act.id));
    },

    toggleEntireModule(moduleConfig) {
      if (this.editingPermissions.includes('*')) {
        this.editingPermissions = getAllAvailablePermissionIds();
      }
      const allChecked = this.isModuleAllChecked(moduleConfig);
      const actionIds = moduleConfig.actions.map(a => a.id);
      if (allChecked) {
        this.editingPermissions = this.editingPermissions.filter(id => !actionIds.includes(id));
      } else {
        actionIds.forEach(id => {
          if (!this.editingPermissions.includes(id)) {
            this.editingPermissions.push(id);
          }
        });
      }
    },

    grantAllPermissions() {
      this.editingPermissions = getAllAvailablePermissionIds();
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Acceso Total Concedido',
        text: 'Todos los módulos y acciones habilitados',
        showConfirmButton: false,
        timer: 1500
      });
    },

    revokeAllPermissions() {
      this.editingPermissions = [];
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'info',
        title: 'Permisos Revocados',
        text: 'Se han desmarcado todos los módulos',
        showConfirmButton: false,
        timer: 1500
      });
    },

    resetToRoleDefault() {
      if (!this.selectedUserForPermissions) return;
      const role = this.selectedUserForPermissions.role || 'customer';
      const defaults = ROLE_DEFAULT_PERMISSIONS[role] || [];
      if (defaults.includes('*')) {
        this.editingPermissions = getAllAvailablePermissionIds();
      } else {
        this.editingPermissions = [...defaults];
      }
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: `Plantilla del Rol Aplicada`,
        text: `Se cargaron los permisos por defecto para "${role}"`,
        showConfirmButton: false,
        timer: 1500
      });
    },

    savePermissions() {
      if (!this.selectedUserForPermissions) return;
      
      saveUserPermissions(this.selectedUserForPermissions.id, this.editingPermissions);
      
      const uIdx = this.users.findIndex(u => u.id === this.selectedUserForPermissions.id);
      if (uIdx !== -1) {
        this.users[uIdx].permissions = [...this.editingPermissions];
      }
      this.filterUsers();

      if (this.permissionsModalInstance) {
        this.permissionsModalInstance.hide();
      }

      Swal.fire({
        icon: 'success',
        title: '¡Permisos Guardados con Éxito!',
        html: `Se han configurado <b>${this.editingPermissions.length} de ${this.totalSystemPermissions}</b> permisos para <b>${this.selectedUserForPermissions.name}</b>.`,
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#ff5722'
      });
    },

    // Product Customer Reviews in Cartagena
    reviewsList: [
      { id: 1, product: 'Apple MacBook Pro M3 14"', rating: 5, author: 'Carlos Mendoza', city: 'Bocagrande, Cartagena', comment: 'Excelente máquina para desarrollo y diseño. Llegó en menos de 2 horas a Bocagrande en caja sellada con factura.', date: '2026-10-02', status: 'Aprobada' },
      { id: 2, product: 'Sony WH-1000XM5 Noise Canceling', rating: 5, author: 'Sofía Valenzuela', city: 'Manga, Cartagena', comment: 'El mejor sonido y cancelación de ruido para oficina. 100% original con garantía oficial de Sony Colombia.', date: '2026-10-01', status: 'Aprobada' },
      { id: 3, product: 'Logitech G502 HERO Gaming Mouse', rating: 4, author: 'Mateo Gómez', city: 'Crespo, Cartagena', comment: 'Muy buen mouse gamer, peso ajustable y respuesta instantánea. El domicilio llegó puntual el mismo día.', date: '2026-09-30', status: 'Aprobada' },
      { id: 4, product: 'Sony PlayStation 5 Slim 1TB', rating: 5, author: 'Valeria Restrepo', city: 'Castillogrande, Cartagena', comment: 'Envío ultra rápido, empaque impecable con sello de garantía. Muy contenta con la compra en OmniStore.', date: '2026-09-28', status: 'Aprobada' }
    ],

    setTab(tab) {
      this.activeTab = tab;
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tab);
      window.history.replaceState({}, '', url.toString());
    },

    handleRouteNavigation(search) {
      const urlParams = new URLSearchParams(search !== undefined ? search : window.location.search);
      const tabParam = urlParams.get('tab');
      const roleParam = urlParams.get('role');

      if (tabParam === 'roles' || tabParam === 'reviews' || tabParam === 'users') {
        this.activeTab = tabParam;
      } else {
        this.activeTab = 'users';
      }

      if (roleParam) {
        this.roleFilter = roleParam;
      } else {
        this.roleFilter = '';
      }

      if (this.users.length > 0) {
        this.filterUsers();
        this.calculateStats();
      }
    },

    async init() {
      this.handleRouteNavigation();

      window.addEventListener('omnistore:navigate', (e) => {
        this.handleRouteNavigation(e.detail?.search);
      });

      window.addEventListener('popstate', () => {
        this.handleRouteNavigation();
      });

      window.addEventListener('omnistore:users-updated', (e) => {
        if (e.detail && Array.isArray(e.detail)) {
          this.users = e.detail;
          this.filterUsers();
        }
      });

      window.addEventListener('omnistore:reviews-updated', (e) => {
        if (e.detail && Array.isArray(e.detail)) {
          this.reviewsList = e.detail;
        }
      });

      this.loadUsers();
      this.filterUsers();
      this.$nextTick(() => {
        this.initCharts();
        this.initPeriodSelector();
      });
    },

    get stats() {
      const total = this.users.length;
      const active = this.users.filter(u => u.status === 'active').length;
      const newThisMonth = Math.max(1, Math.floor(total * 0.35));
      const activePercentage = total > 0 ? Math.round((active / total) * 100) : 100;
      return { total, active, newThisMonth, activePercentage };
    },

    loadUsers() {
      this.isLoading = true;
      this.users = getUsersList();
      this.reviewsList = getReviewsList();
      this.isLoading = false;
    },

    approveReview(review) {
      updateReviewStatus(review.id, 'Aprobada');
      this.reviewsList = getReviewsList();
      this.showToast('Reseña aprobada con éxito', 'success');
    },

    rejectReview(review) {
      updateReviewStatus(review.id, 'Rechazada');
      this.reviewsList = getReviewsList();
      this.showToast('Reseña rechazada', 'info');
    },

    deleteReviewPrompt(review) {
      Swal.fire({
        title: '¿Eliminar reseña?',
        text: 'Esta acción no se puede deshacer.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#d33'
      }).then(res => {
        if (res.isConfirmed) {
          deleteReview(review.id);
          this.reviewsList = getReviewsList();
          this.showToast('Reseña eliminada', 'info');
        }
      });
    },

    replyReviewPrompt(review) {
      Swal.fire({
        title: `Responder a ${review.author}`,
        input: 'textarea',
        inputPlaceholder: 'Escribe tu respuesta como OmniStore Colombia...',
        showCancelButton: true,
        confirmButtonText: 'Publicar Respuesta',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#ff5722'
      }).then(res => {
        if (res.isConfirmed && res.value) {
          this.showToast('Respuesta publicada en la tienda pública', 'success');
        }
      });
    },

    addReviewPrompt() {
      Swal.fire({
        title: 'Añadir Reseña de Cliente',
        html: `
          <div class="text-start">
            <label class="form-label small fw-bold">Nombre del Cliente:</label>
            <input id="swal-rev-author" class="form-control form-control-sm mb-2" placeholder="Ej. Carlos Mendoza">
            <label class="form-label small fw-bold">Barrio / Sector (Cartagena):</label>
            <input id="swal-rev-city" class="form-control form-control-sm mb-2" placeholder="Ej. Bocagrande / Manga / Crespo">
            <label class="form-label small fw-bold">Producto:</label>
            <input id="swal-rev-prod" class="form-control form-control-sm mb-2" placeholder="Ej. Apple iPhone 16 Pro Max">
            <label class="form-label small fw-bold">Calificación:</label>
            <select id="swal-rev-stars" class="form-select form-select-sm mb-2">
              <option value="5">⭐⭐⭐⭐⭐ (5 Estrellas - Excelente)</option>
              <option value="4">⭐⭐⭐⭐ (4 Estrellas - Muy Bueno)</option>
              <option value="3">⭐⭐⭐ (3 Estrellas - Regular)</option>
            </select>
            <label class="form-label small fw-bold">Comentario:</label>
            <textarea id="swal-rev-comm" class="form-control form-control-sm mb-2" placeholder="Opinión sobre el producto y los tiempos de entrega en Cartagena..."></textarea>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Publicar Reseña',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#ff5722',
        preConfirm: () => {
          const author = document.getElementById('swal-rev-author').value.trim();
          const city = document.getElementById('swal-rev-city').value.trim() || 'Cartagena de Indias';
          const product = document.getElementById('swal-rev-prod').value.trim();
          const rating = Number(document.getElementById('swal-rev-stars').value) || 5;
          const comment = document.getElementById('swal-rev-comm').value.trim();
          if (!author || !comment) {
            Swal.showValidationMessage('Completa autor y comentario');
            return false;
          }
          return { author, city, product, rating, comment, status: 'Aprobada' };
        }
      }).then(res => {
        if (res.isConfirmed && res.value) {
          addReview(res.value);
          this.reviewsList = getReviewsList();
          this.showToast('Reseña añadida al catálogo de Cartagena', 'success');
        }
      });
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

    generateGrowthData(count) {
      return Array.from({ length: count }, () => Math.floor(Math.random() * 25) + 3);
    },

    initPeriodSelector() {
      const map = { growth7d: 7, growth30d: 30, growth90d: 90 };
      document.querySelectorAll('input[name="growthPeriod"]').forEach(input => {
        input.addEventListener('change', (e) => {
          const count = map[e.target.id];
          if (!count || !this.charts.userGrowth) return;
          this.charts.userGrowth.updateOptions({
            xaxis: { categories: this.buildDayLabels(count) },
            series: [{ name: 'Nuevos Usuarios', data: this.generateGrowthData(count) }],
          });
        });
      });
    },

    // Filtering and Search
    filterUsers() {
      this.filteredUsers = this.users.filter(user => {
        const query = this.searchQuery.toLowerCase();
        const matchesSearch = query === '' || 
          (user.name && user.name.toLowerCase().includes(query)) ||
          (user.email && user.email.toLowerCase().includes(query)) ||
          (user.department && user.department.toLowerCase().includes(query)) ||
          (user.phone && user.phone.toLowerCase().includes(query));
        
        const matchesStatus = this.statusFilter === '' || user.status === this.statusFilter;
        const matchesRole = this.roleFilter === '' || user.role === this.roleFilter;
        
        return matchesSearch && matchesStatus && matchesRole;
      });
      
      this.sortUsers();
      this.currentPage = 1;
    },

    // Sorting
    sortBy(field) {
      if (this.sortField === field) {
        this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        this.sortField = field;
        this.sortDirection = 'asc';
      }
      this.sortUsers();
    },

    sortUsers() {
      this.filteredUsers.sort((a, b) => {
        let aVal = a[this.sortField] || '';
        let bVal = b[this.sortField] || '';
        
        if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase();
          bVal = bVal.toLowerCase();
        }
        
        if (this.sortDirection === 'asc') {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      });
    },

    // Pagination
    get paginatedUsers() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      const end = start + this.itemsPerPage;
      return this.filteredUsers.slice(start, end);
    },

    get totalPages() {
      return Math.ceil(this.filteredUsers.length / this.itemsPerPage) || 1;
    },

    get visiblePages() {
      const delta = 2;
      const range = [];
      for (let i = Math.max(2, this.currentPage - delta); i <= Math.min(this.totalPages - 1, this.currentPage + delta); i++) {
        range.push(i);
      }
      if (this.currentPage - delta > 2) {
        range.unshift('...');
      }
      if (this.currentPage + delta < this.totalPages - 1) {
        range.push('...');
      }
      range.unshift(1);
      if (this.totalPages > 1) {
        range.push(this.totalPages);
      }
      return range;
    },

    goToPage(page) {
      if (page === '...') return;
      if (page >= 1 && page <= this.totalPages) {
        this.currentPage = page;
      }
    },

    // Selection Management
    toggleAll(checked) {
      if (checked) {
        this.selectedUsers = this.paginatedUsers.map(user => user.id);
      } else {
        this.selectedUsers = [];
      }
    },

    toggleUser(userId) {
      if (this.selectedUsers.includes(userId)) {
        this.selectedUsers = this.selectedUsers.filter(id => id !== userId);
      } else {
        this.selectedUsers = [...this.selectedUsers, userId];
      }
    },

    // CRUD Operations with Supabase API
    async createUser(userData) {
      const newUser = {
        name: `${userData.firstName} ${userData.lastName}`.trim(),
        email: userData.email.trim(),
        role: userData.role || 'customer',
        status: userData.status || 'active',
        phone: userData.phone || '+57 300 000 0000',
        city: userData.city || 'Bocagrande, Cartagena'
      };

      try {
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newUser)
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user) {
            this.users.unshift({
              ...data.user,
              lastActive: 'Hace un momento',
              joinDate: new Date().toLocaleDateString('es-CO'),
              department: data.user.city || 'Cartagena de Indias'
            });
            this.filterUsers();
            Swal.fire({
              icon: 'success',
              title: '¡Usuario Creado!',
              text: 'El usuario fue registrado en Supabase PostgreSQL.',
              timer: 2000,
              showConfirmButton: false
            });
            return;
          }
        }
      } catch (e) {
        console.warn('API error saving user:', e);
      }

      // Local fallback
      this.users.unshift({
        id: Date.now(),
        ...newUser,
        lastActive: 'Hace un momento',
        joinDate: new Date().toLocaleDateString('es-CO'),
        avatar: './assets/images/avatar-placeholder.svg',
        department: newUser.city
      });
      this.filterUsers();
      Swal.fire({
        icon: 'success',
        title: 'Usuario Agregado',
        timer: 1500,
        showConfirmButton: false
      });
    },

    editUser(user) {
      const userForm = Alpine.$data(document.querySelector('[x-data="userForm"]'));
      if (userForm) {
        const nameParts = (user.name || '').split(' ');
        userForm.form.firstName = nameParts[0] || '';
        userForm.form.lastName = nameParts.slice(1).join(' ') || '';
        userForm.form.email = user.email || '';
        userForm.form.role = user.role || 'customer';
        userForm.form.status = user.status || 'active';
        userForm.form.phone = user.phone || '';
        userForm.form.city = user.city || user.department || 'Cartagena de Indias';
        userForm.editingUserId = user.id;

        const modalEl = document.getElementById('userModal');
        if (modalEl) {
          const bsModal = new Modal(modalEl);
          bsModal.show();
        }
      }
    },

    async deleteUser(user) {
      const result = await Swal.fire({
        title: '¿Eliminar usuario?',
        text: `¿Estás seguro de que deseas eliminar a ${user.name}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
      });

      if (result.isConfirmed) {
        try {
          await fetch(`/api/users/${user.id}`, { method: 'DELETE' });
        } catch {
          // Ignore
        }
        this.users = this.users.filter(u => u.id !== user.id);
        this.filterUsers();
        Swal.fire({
          icon: 'success',
          title: 'Usuario Eliminado',
          timer: 1500,
          showConfirmButton: false
        });
      }
    },

    // Bulk Operations
    async bulkAction(action) {
      if (this.selectedUsers.length === 0) {
        Swal.fire('Atención', 'Por favor selecciona al menos un usuario.', 'info');
        return;
      }

      const selectedUserObjects = this.users.filter(u => this.selectedUsers.includes(u.id));
      
      switch (action) {
        case 'activate':
          selectedUserObjects.forEach(user => user.status = 'active');
          Swal.fire('Completado', 'Usuarios activados con éxito.', 'success');
          break;
        case 'deactivate':
          selectedUserObjects.forEach(user => user.status = 'inactive');
          Swal.fire('Completado', 'Usuarios desactivados.', 'info');
          break;
        case 'delete':
          this.users = this.users.filter(u => !this.selectedUsers.includes(u.id));
          Swal.fire('Completado', 'Usuarios seleccionados eliminados.', 'success');
          break;
      }
      
      this.selectedUsers = [];
      this.filterUsers();
    },

    exportUsers() {
      const csvContent = "data:text/csv;charset=utf-8," + 
        ["ID,Nombre,Email,Rol,Estado,Teléfono,Sector_Cartagena"].concat(
          this.filteredUsers.map(u => `"${u.id}","${u.name}","${u.email}","${u.role}","${u.status}","${u.phone || ''}","${u.city || u.department || 'Cartagena'}"`)
        ).join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `usuarios_cartagena_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },

    initCharts() {
      const growthEl = document.querySelector('#userGrowthChart');
      if (growthEl) {
        const growthOptions = {
          series: [{ name: 'Nuevos Usuarios', data: this.generateGrowthData(7) }],
          chart: { type: 'area', height: 260, toolbar: { show: false } },
          colors: ['#ff5722'],
          fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.45, opacityTo: 0.05, stops: [20, 100] } },
          dataLabels: { enabled: false },
          stroke: { curve: 'smooth', width: 2.5 },
          xaxis: { categories: this.buildDayLabels(7), labels: { style: { colors: axisInk() } } },
          yaxis: { labels: { style: { colors: axisInk() } } }
        };
        this.charts.userGrowth = new ApexCharts(growthEl, growthOptions);
        this.charts.userGrowth.render();
      }

      const roleEl = document.querySelector('#roleDistributionChart');
      if (roleEl) {
        const roleOptions = {
          series: [70, 20, 10],
          chart: { type: 'donut', height: 180 },
          labels: ['Clientes', 'Vendedores', 'SuperAdmins'],
          colors: ['#10b981', '#3b82f6', '#ff5722'],
          legend: { position: 'bottom' }
        };
        new ApexCharts(roleEl, roleOptions).render();
      }
    }
  }));

  // User Form Component for Modal
  Alpine.data('userForm', () => ({
    form: {
      firstName: '',
      lastName: '',
      email: '',
      role: 'customer',
      status: 'active',
      phone: '+57 310 ',
      city: 'Bocagrande, Cartagena'
    },
    editingUserId: null,

    init() {
      this.resetForm();
    },

    resetForm() {
      this.form = {
        firstName: '',
        lastName: '',
        email: '',
        role: 'customer',
        status: 'active',
        phone: '+57 310 ',
        city: 'Bocagrande, Cartagena'
      };
      this.editingUserId = null;
    },

    async saveUser() {
      if (!this.form.firstName || !this.form.email) {
        Swal.fire('Campos requeridos', 'Por favor completa el nombre y el correo electrónico.', 'warning');
        return;
      }

      const userTable = Alpine.$data(document.querySelector('[x-data="userTable"]'));
      if (!userTable) return;

      if (this.editingUserId) {
        const user = userTable.users.find(u => u.id === this.editingUserId);
        if (user) {
          user.name = `${this.form.firstName} ${this.form.lastName}`.trim();
          user.email = this.form.email;
          user.role = this.form.role;
          user.status = this.form.status;
          user.phone = this.form.phone;
          user.department = this.form.city;
          userTable.filterUsers();

          try {
            await fetch(`/api/users/${this.editingUserId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: user.name,
                role: user.role,
                status: user.status,
                phone: user.phone,
                city: user.department
              })
            });
          } catch {
            // Ignore
          }
        }
      } else {
        await userTable.createUser(this.form);
      }

      const modalEl = document.getElementById('userModal');
      if (modalEl) {
        const bsModal = Modal.getInstance(modalEl);
        if (bsModal) bsModal.hide();
      }

      this.resetForm();
    }
  }));
});