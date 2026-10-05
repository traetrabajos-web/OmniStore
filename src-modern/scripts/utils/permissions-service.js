// ==============================================================================
// OmniStore - Granular Permissions & Role-Based Access Control (RBAC) Service
// Allows SuperAdmins to configure granular permissions per user or load role templates
// ==============================================================================

import { getUsersList, saveUsersList } from './store-data.js';

const SESSION_STORAGE_KEY = 'omnistore_user_session';

function getActiveSessionUser() {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Full catalogue of modules and granular actions available in OmniStore
 */
export const MODULES_PERMISSIONS_CONFIG = [
  {
    module: 'dashboard',
    label: 'Panel Principal (Dashboard)',
    icon: 'bi-grid-1x2-fill',
    badgeClass: 'bg-primary',
    description: 'Acceso a las métricas globales, ingresos COP y gráficos en tiempo real.',
    pageFile: 'index.html',
    pageDataAttr: 'dashboard',
    actions: [
      { id: 'dashboard.view', label: 'Ver Dashboard General', description: 'Visualizar KPIs de ventas, gráficos y pedidos recientes.', default: true }
    ]
  },
  {
    module: 'pos',
    label: 'Punto de Venta Mostrador (POS)',
    icon: 'bi-calculator-fill',
    badgeClass: 'bg-warning text-dark',
    description: 'Ventas rápidas en mostrador, escáner de código de barras y tirilla térmica.',
    pageFile: 'pos.html',
    pageDataAttr: 'pos',
    actions: [
      { id: 'pos.view', label: 'Acceso a Terminal POS', description: 'Abrir interfaz de cobro táctil en mostrador.', default: true },
      { id: 'pos.create_sale', label: 'Registrar Ventas y Cobros', description: 'Facturar productos y recibir pagos en efectivo/tarjeta.', default: true },
      { id: 'pos.cash_management', label: 'Arqueo y Cierre de Caja', description: 'Realizar cuadre de caja, apertura y cierre Z.', default: false },
      { id: 'pos.print_ticket', label: 'Imprimir Tirilla Térmica', description: 'Generar comprobantes POS de 80mm/58mm.', default: true }
    ]
  },
  {
    module: 'products',
    label: 'Catálogo de Productos & Inventario',
    icon: 'bi-box-seam-fill',
    badgeClass: 'bg-success',
    description: 'Gestión de productos, control de stock, precios y proveedores.',
    pageFile: 'products.html',
    pageDataAttr: 'products',
    actions: [
      { id: 'products.view', label: 'Ver Catálogo y Stock', description: 'Consultar listado de productos, precios y disponibilidad.', default: true },
      { id: 'products.create', label: 'Crear Nuevos Productos', description: 'Añadir productos al catálogo con precios y variantes.', default: false },
      { id: 'products.edit', label: 'Editar Precios y Detalles', description: 'Modificar descripciones, precios, ofertas y fotos.', default: false },
      { id: 'products.delete', label: 'Eliminar Productos', description: 'Eliminar permanentemente artículos del catálogo.', default: false },
      { id: 'products.kardex', label: 'Gestionar Kardex / Stock', description: 'Registrar entradas, salidas y ajustes de inventario.', default: false },
      { id: 'products.suppliers', label: 'Administrar Proveedores', description: 'Gestionar lista de proveedores y compras.', default: false },
      { id: 'products.export', label: 'Exportar Inventario CSV', description: 'Descargar reporte completo de catálogo.', default: false }
    ]
  },
  {
    module: 'orders',
    label: 'Pedidos, Ventas & Envíos',
    icon: 'bi-cart-check-fill',
    badgeClass: 'bg-info',
    description: 'Procesamiento de órdenes de compra, pasarelas de pago y guías de envío.',
    pageFile: 'orders.html',
    pageDataAttr: 'orders',
    actions: [
      { id: 'orders.view', label: 'Ver Lista de Pedidos', description: 'Consultar historial y estado de pedidos de clientes.', default: true },
      { id: 'orders.edit_status', label: 'Cambiar Estado de Pedidos', description: 'Avanzar pedidos a Procesando, Enviado o Entregado.', default: false },
      { id: 'orders.delete', label: 'Cancelar / Eliminar Pedidos', description: 'Anular o borrar pedidos del sistema.', default: false },
      { id: 'orders.payments', label: 'Ver Pasarelas de Pago', description: 'Consultar transacciones en Nequi, Daviplata, PSE y tarjetas.', default: false },
      { id: 'orders.shipping', label: 'Generar Guías de Transporte', description: 'Crear guías de Servientrega, Coordinadora, Interrapidísimo.', default: false },
      { id: 'orders.export', label: 'Exportar Pedidos a CSV', description: 'Descargar archivo Excel/CSV de órdenes.', default: false }
    ]
  },
  {
    module: 'users',
    label: 'Usuarios, Roles & Permisos',
    icon: 'bi-people-fill',
    badgeClass: 'bg-danger',
    description: 'Administración de cuentas, asignación de roles, permisos y moderación.',
    pageFile: 'users.html',
    pageDataAttr: 'users',
    actions: [
      { id: 'users.view', label: 'Ver Directorio de Usuarios', description: 'Consultar clientes, vendedores y administradores.', default: false },
      { id: 'users.create', label: 'Crear Cuentas de Usuario', description: 'Registrar nuevos miembros del equipo o clientes.', default: false },
      { id: 'users.edit', label: 'Editar Datos y Roles', description: 'Actualizar correos, teléfonos, roles y estados.', default: false },
      { id: 'users.delete', label: 'Eliminar / Suspender Cuentas', description: 'Dar de baja usuarios de la plataforma.', default: false },
      { id: 'users.manage_permissions', label: 'Administrar Permisos Individuales', description: 'Conceder o revocar permisos específicos a usuarios.', default: false },
      { id: 'users.reviews', label: 'Moderar Reseñas de Clientes', description: 'Aprobar, rechazar o borrar comentarios en productos.', default: false }
    ]
  },
  {
    module: 'analytics',
    label: 'Analítica, Tráfico & Métricas',
    icon: 'bi-graph-up-arrow',
    badgeClass: 'bg-primary',
    description: 'Monitoreo de tráfico, fuentes, embudo de conversión y dispositivos.',
    pageFile: 'analytics.html',
    pageDataAttr: 'analytics',
    actions: [
      { id: 'analytics.view', label: 'Ver Métricas y Tráfico', description: 'Consultar visitantes en vivo, fuentes y zonas geográficas.', default: false },
      { id: 'analytics.export', label: 'Exportar Reportes de Métricas', description: 'Descargar datos analíticos.', default: false }
    ]
  },
  {
    module: 'reports',
    label: 'Reportes Financieros & DIAN',
    icon: 'bi-file-earmark-bar-graph-fill',
    badgeClass: 'bg-secondary',
    description: 'Facturación electrónica DIAN, cálculo de IVA del 19% e informes contables.',
    pageFile: 'reports.html',
    pageDataAttr: 'reports',
    actions: [
      { id: 'reports.view', label: 'Ver Reportes Financieros', description: 'Consultar ventas totales, márgenes e IVA acumulado.', default: false },
      { id: 'reports.dian', label: 'Gestionar Facturación DIAN', description: 'Emitir, sincronizar y descargar facturas electrónicas CUFE.', default: false },
      { id: 'reports.export', label: 'Exportar Informes Contables', description: 'Descargar balances en PDF y Excel.', default: false }
    ]
  },
  {
    module: 'messages',
    label: 'Mensajería & Atención en Vivo',
    icon: 'bi-chat-dots-fill',
    badgeClass: 'bg-warning text-dark',
    description: 'Comunicación en directo con compradores y soporte al cliente.',
    pageFile: 'messages.html',
    pageDataAttr: 'messages',
    actions: [
      { id: 'messages.view', label: 'Ver Conversaciones y Chats', description: 'Leer mensajes enviados por clientes.', default: true },
      { id: 'messages.send', label: 'Responder y Enviar Mensajes', description: 'Enviar respuestas y adjuntos en tiempo real.', default: true }
    ]
  },
  {
    module: 'calendar',
    label: 'Calendario & Agenda de Entregas',
    icon: 'bi-calendar-event-fill',
    badgeClass: 'bg-info',
    description: 'Programación de despachos, lanzamientos, reuniones y tareas.',
    pageFile: 'calendar.html',
    pageDataAttr: 'calendar',
    actions: [
      { id: 'calendar.view', label: 'Ver Calendario y Eventos', description: 'Visualizar cronograma mensual, semanal y diario.', default: true },
      { id: 'calendar.manage', label: 'Crear y Modificar Eventos', description: 'Programar nuevas citas, tareas y recordatorios.', default: false }
    ]
  },
  {
    module: 'settings',
    label: 'Ajustes de Tienda, Cupones & CMS',
    icon: 'bi-gear-fill',
    badgeClass: 'bg-dark',
    description: 'Configuración general de OmniStore, cupones, banners y zonas de envío.',
    pageFile: 'settings.html',
    pageDataAttr: 'settings',
    actions: [
      { id: 'settings.view', label: 'Ver Configuración General', description: 'Consultar datos de contacto, NIT y parámetros de tienda.', default: false },
      { id: 'settings.edit', label: 'Editar Datos de Tienda', description: 'Cambiar razón social, teléfonos y umbrales de envío.', default: false },
      { id: 'settings.coupons', label: 'Administrar Cupones de Descuento', description: 'Crear códigos promocionales y porcentajes de descuento.', default: false },
      { id: 'settings.banners', label: 'Gestionar Banners y Campañas', description: 'Configurar slider principal y campañas promocionales.', default: false },
      { id: 'settings.shipping_zones', label: 'Configurar Zonas y Tarifas de Envío', description: 'Ajustar precios de flete para Cartagena (Z1 a Z4).', default: false }
    ]
  },
  {
    module: 'security',
    label: 'Seguridad, Auditoría & Sesiones',
    icon: 'bi-shield-lock-fill',
    badgeClass: 'bg-danger',
    description: 'Puntuación de seguridad, autenticación 2FA y cierre de sesiones remotas.',
    pageFile: 'security.html',
    pageDataAttr: 'security',
    actions: [
      { id: 'security.view', label: 'Ver Auditoría de Seguridad', description: 'Consultar logs de acceso y puntuación del sistema.', default: false },
      { id: 'security.manage', label: 'Gestionar Políticas y Sesiones', description: 'Cerrar sesiones activas y modificar reglas de acceso.', default: false }
    ]
  },
  {
    module: 'files',
    label: 'Gestor de Archivos & Multimedia',
    icon: 'bi-folder-fill',
    badgeClass: 'bg-secondary',
    description: 'Almacenamiento de imágenes de productos, documentos y facturas.',
    pageFile: 'files.html',
    pageDataAttr: 'files',
    actions: [
      { id: 'files.view', label: 'Explorar Archivos y Carpetas', description: 'Visualizar documentos e imágenes en el servidor.', default: false },
      { id: 'files.upload', label: 'Subir Nuevos Archivos', description: 'Cargar imágenes de productos y documentos.', default: false },
      { id: 'files.delete', label: 'Eliminar Archivos', description: 'Borrar archivos y carpetas del almacenamiento.', default: false }
    ]
  },
  {
    module: 'help',
    label: 'Centro de Ayuda, FAQ & PQRS',
    icon: 'bi-question-circle-fill',
    badgeClass: 'bg-info',
    description: 'Atención a tickets de soporte, preguntas frecuentes y guías.',
    pageFile: 'help.html',
    pageDataAttr: 'help',
    actions: [
      { id: 'help.view', label: 'Ver Centro de Ayuda y FAQ', description: 'Consultar documentación y preguntas frecuentes.', default: true },
      { id: 'help.tickets', label: 'Gestionar Tickets de Soporte / PQRS', description: 'Responder y resolver solicitudes de clientes.', default: false }
    ]
  }
];

/**
 * Default permission templates based on user role
 */
export const ROLE_DEFAULT_PERMISSIONS = {
  admin: ['*'], // SuperAdmin has wildcard full access to all features
  
  vendor: [
    'dashboard.view',
    'pos.view',
    'pos.create_sale',
    'pos.print_ticket',
    'products.view',
    'products.create',
    'products.edit',
    'products.kardex',
    'products.suppliers',
    'products.export',
    'orders.view',
    'orders.edit_status',
    'orders.shipping',
    'orders.export',
    'messages.view',
    'messages.send',
    'calendar.view',
    'calendar.manage',
    'help.view',
    'help.tickets'
  ],

  support: [
    'dashboard.view',
    'orders.view',
    'users.view',
    'users.reviews',
    'messages.view',
    'messages.send',
    'calendar.view',
    'help.view',
    'help.tickets'
  ],

  accountant: [
    'dashboard.view',
    'orders.view',
    'orders.payments',
    'orders.export',
    'reports.view',
    'reports.dian',
    'reports.export',
    'help.view'
  ],

  customer: [
    'marketplace.view',
    'help.view'
  ]
};

/**
 * Returns a flat array of all permission IDs available in the system
 */
export function getAllAvailablePermissionIds() {
  const ids = [];
  MODULES_PERMISSIONS_CONFIG.forEach(mod => {
    mod.actions.forEach(act => {
      ids.push(act.id);
    });
  });
  return ids;
}

/**
 * Get active permissions list for a specific user.
 * If user has explicitly customized permissions (array in user.permissions), uses those.
 * Otherwise, falls back to the role's default permission template.
 */
export function getUserPermissions(user) {
  if (!user) return [];
  
  // SuperAdmin role always has complete access
  if (user.role === 'admin') {
    return ['*'];
  }

  // If user has custom individual permissions configured by the admin
  if (Array.isArray(user.permissions) && user.permissions.length > 0) {
    return user.permissions;
  }

  // Fallback to role-based template
  return ROLE_DEFAULT_PERMISSIONS[user.role] || [];
}

/**
 * Checks whether a given user has a specific permission
 * @param {string} permissionId - E.g. 'products.create', 'orders.delete', 'settings.view'
 * @param {object} [user] - User object (defaults to currently logged-in user)
 * @returns {boolean}
 */
export function hasPermission(permissionId, user = getActiveSessionUser()) {
  if (!user) return false;
  if (user.role === 'admin') return true;

  const permissions = getUserPermissions(user);
  if (permissions.includes('*')) return true;
  if (permissions.includes(permissionId)) return true;

  // Check module level wildcard e.g. 'products.*'
  const moduleName = permissionId.split('.')[0];
  if (permissions.includes(`${moduleName}.*`)) return true;

  return false;
}

/**
 * Checks whether a user has permission to access a specific page file
 * @param {string} pageName - Page identifier (e.g. 'products', 'settings', 'products.html', 'index.html')
 * @param {object} [user] - User object (defaults to currently logged-in user)
 * @returns {boolean}
 */
export function canAccessPage(pageName, user = getActiveSessionUser()) {
  if (!user) return false;
  if (user.role === 'admin') return true;

  // Clean page string
  const clean = (pageName || '')
    .toLowerCase()
    .replace('.html', '')
    .replace('./', '')
    .trim();

  // Public / general pages
  if (['marketplace', 'login', 'register', 'forgot-password', 'reset-password', '404', '500'].includes(clean)) {
    return true;
  }

  // Find module matching page
  const mod = MODULES_PERMISSIONS_CONFIG.find(m => 
    m.pageDataAttr === clean || 
    m.module === clean || 
    m.pageFile === `${clean}.html` || 
    m.pageFile === clean ||
    (clean === 'index' && m.module === 'dashboard')
  );

  if (!mod) {
    // Unknown page, allow by default if admin or view permission
    return true;
  }

  // Check view action for that module
  return hasPermission(`${mod.module}.view`, user);
}

/**
 * Updates permissions for an individual user in the database/localStorage
 * @param {number|string} userId - User ID to update
 * @param {string[]} permissions - Array of permission string IDs
 * @returns {object} Updated user object
 */
export function saveUserPermissions(userId, permissions) {
  const users = getUsersList();
  const numId = parseInt(userId, 10);
  const userIndex = users.findIndex(u => u.id === numId || u.id === userId);

  if (userIndex === -1) {
    throw new Error(`Usuario con ID #${userId} no encontrado en el sistema.`);
  }

  users[userIndex].permissions = Array.isArray(permissions) ? permissions : [];
  users[userIndex].updatedAt = new Date().toISOString();
  saveUsersList(users);

  // If updating the currently logged-in user, update their active session storage too
  const currentUser = getActiveSessionUser();
  if (currentUser && (currentUser.id === numId || currentUser.id === userId)) {
    currentUser.permissions = users[userIndex].permissions;
    try {
      localStorage.setItem('omnistore_user_session', JSON.stringify(currentUser));
      window.dispatchEvent(new CustomEvent('omnistore:auth-changed', { detail: currentUser }));
    } catch {}
  }

  // Persist permissions in PostgreSQL database via API
  fetch(`/api/users/${users[userIndex].id}/permissions`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ permissions: users[userIndex].permissions })
  }).catch(() => {});

  // Notify system of permission changes
  window.dispatchEvent(new CustomEvent('omnistore:permissions-updated', {
    detail: {
      userId: users[userIndex].id,
      permissions: users[userIndex].permissions
    }
  }));

  return users[userIndex];
}

/**
 * Dynamically filters and hides/shows sidebar navigation links according to the logged-in user's permissions
 * @param {object} [user] - User object (defaults to current user)
 */
export function applySidebarPermissions(user = getActiveSessionUser()) {
  if (!user) return;

  const isSuperAdmin = user.role === 'admin';
  const sidebar = document.getElementById('admin-sidebar');
  if (!sidebar) return;

  // Map of URL patterns to required permission
  const NAV_PERMISSION_MAP = [
    { selector: 'a[href*="index.html"]', perm: 'dashboard.view' },
    { selector: 'a[href*="products.html"]', perm: 'products.view' },
    { selector: 'a[href*="orders.html"]', perm: 'orders.view' },
    { selector: 'a[href*="orders.html?tab=shipping"]', perm: 'orders.shipping' },
    { selector: 'a[href*="users.html"]', perm: 'users.view' },
    { selector: 'a[href*="users.html?tab=roles"]', perm: 'users.manage_permissions' },
    { selector: 'a[href*="analytics.html"]', perm: 'analytics.view' },
    { selector: 'a[href*="reports.html"]', perm: 'reports.view' },
    { selector: 'a[href*="reports.html?tab=invoices"]', perm: 'reports.dian' },
    { selector: 'a[href*="messages.html"]', perm: 'messages.view' },
    { selector: 'a[href*="calendar.html"]', perm: 'calendar.view' },
    { selector: 'a[href*="settings.html"]', perm: 'settings.view' },
    { selector: 'a[href*="settings.html?tab=coupons"]', perm: 'settings.coupons' },
    { selector: 'a[href*="settings.html?tab=banners"]', perm: 'settings.banners' },
    { selector: 'a[href*="settings.html?tab=shipping-rates"]', perm: 'settings.shipping_zones' },
    { selector: 'a[href*="security.html"]', perm: 'security.view' },
    { selector: 'a[href*="files.html"]', perm: 'files.view' },
    { selector: 'a[href*="help.html"]', perm: 'help.view' }
  ];

  NAV_PERMISSION_MAP.forEach(({ selector, perm }) => {
    const links = sidebar.querySelectorAll(selector);
    links.forEach(link => {
      const navItem = link.closest('.nav-item');
      if (navItem) {
        if (isSuperAdmin || hasPermission(perm, user)) {
          navItem.style.display = '';
        } else {
          navItem.style.display = 'none';
        }
      }
    });
  });

  // Clean up empty section headers in sidebar
  sidebar.querySelectorAll('.nav-item').forEach(item => {
    const header = item.querySelector('small.text-uppercase');
    if (header) {
      // Check if subsequent items before next header are visible
      let next = item.nextElementSibling;
      let hasVisibleChild = false;
      while (next && !next.querySelector('small.text-uppercase')) {
        if (next.style.display !== 'none') {
          hasVisibleChild = true;
          break;
        }
        next = next.nextElementSibling;
      }
      if (!isSuperAdmin && !hasVisibleChild) {
        item.style.display = 'none';
      } else {
        item.style.display = '';
      }
    }
  });
}

// Global expose helper for easy Alpine template access: x-show="can('products.create')"
if (typeof window !== 'undefined') {
  window.can = (permissionId) => hasPermission(permissionId);
  window.hasPermission = hasPermission;
  window.canAccessPage = canAccessPage;
  window.MODULES_PERMISSIONS_CONFIG = MODULES_PERMISSIONS_CONFIG;
}
