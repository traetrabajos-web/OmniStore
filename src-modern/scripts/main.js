// ==========================================================================
// Bootstrap Admin Template - Modern JavaScript Entry Point
// ES6+ Modules with Bootstrap 5
// ==========================================================================

// Import Bootstrap 5 JavaScript components (only those actively used)
import {
  Collapse,
  Dropdown,
  Modal,
  Offcanvas,
  Tab,
  Toast,
  Tooltip,
} from 'bootstrap';

// Import our custom modules
import { ThemeManager } from './utils/theme-manager.js';
import { DashboardManager } from './components/dashboard.js';
import { NotificationManager } from './utils/notifications.js';
import { SidebarManager } from './components/sidebar.js';
import { iconManager } from './utils/icon-manager.js';

import Alpine from 'alpinejs';
import './components/supabase-modal.js';
import { initUserHeaderDropdown, enforceAuthAndRoles } from './utils/auth-service.js';
import { applySidebarPermissions, hasPermission } from './utils/permissions-service.js';

// Immediately enforce authentication and role access before any execution
enforceAuthAndRoles();

// Import styles (Bootstrap Icons are included in SCSS)
// Inter, self-hosted. Replaces the render-blocking fonts.googleapis.com
// stylesheet that every page used to load: one fewer third-party origin on the
// critical path, no IP leak to a third party on first paint (a GDPR concern for
// EU deployments), and the template renders correctly offline. The variable
// font covers the full 100–900 range in a single file, so the weights the
// template uses (300/400/500/600/700) all come from one request.
import '@fontsource-variable/inter';

import '../styles/scss/main.scss';

// Import user components
// import { UsersComponent } from './components/users.js';
// import { AnalyticsComponent } from './components/analytics.js';
// import { FormsComponent } from './components/forms.js';

// Application Class
class AdminApp {
  constructor() {
    this.components = new Map();
    this.isInitialized = false;
  }

  // Initialize the application
  async init() {
    if (this.isInitialized) return;

    try {
      // Enforce authentication & role permissions before rendering protected admin views
      enforceAuthAndRoles();

      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        await new Promise(resolve => {
          document.addEventListener('DOMContentLoaded', resolve);
        });
      }

      // Initialize core managers
      this.themeManager = new ThemeManager();
      this.notificationManager = new NotificationManager();
      this.sidebarManager = new SidebarManager();
      this.iconManager = iconManager;

      // Initialize Bootstrap components
      this.initBootstrapComponents();

      // Initialize page-specific components and wait for them to complete
      await this.initPageComponents();

      // Setup global event listeners
      this.setupEventListeners();

      // Localize shortcut hints in search placeholders (⌘K on Mac, Ctrl+K elsewhere)
      this.localizeShortcutHints();

      // Initialize navigation & active link highlight
      this.initNavigation();

      // Initialize tooltips and popovers globally
      this.initTooltipsAndPopovers();

      // Initialize Alpine.js
      this.initAlpine();

      // Initialize authenticated user profile dropdown & logout listeners
      initUserHeaderDropdown();

      // Apply granular permissions to navigation and sidebar
      applySidebarPermissions();
      window.addEventListener('omnistore:permissions-updated', () => applySidebarPermissions());
      window.addEventListener('omnistore:auth-changed', () => applySidebarPermissions());

      // Register PWA Service Worker for offline support & fast caching
      if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        navigator.serviceWorker.register('./service-worker.js').catch(() => {});
      }

      this.isInitialized = true;

      // Deliberately no "loaded successfully" toast here. Every one of the 21
      // pages fired a green success toast on load, which trained the user to
      // dismiss toasts without reading them — so the ones that carry real
      // information (a failed save, a deleted record) got ignored too. A tool
      // should not announce its own boot.

    } catch (error) {
      console.error('❌ Failed to initialize Admin App:', error);
    }
  }

  // Initialize Bootstrap components
  initBootstrapComponents() {
    // Initialize dropdowns
    document.querySelectorAll('[data-bs-toggle="dropdown"]').forEach(element => {
      new Dropdown(element);
    });

    // Initialize modals
    document.querySelectorAll('.modal').forEach(element => {
      new Modal(element);
    });

    // Initialize collapse elements (toggle:false — don't auto-open on construction)
    document.querySelectorAll('[data-bs-toggle="collapse"]').forEach(element => {
      new Collapse(element, { toggle: false });
    });

    // Initialize tabs
    document.querySelectorAll('[data-bs-toggle="tab"]').forEach(element => {
      new Tab(element);
    });

    // Initialize toasts
    document.querySelectorAll('.toast').forEach(element => {
      new Toast(element);
    });

    // Initialize offcanvas
    document.querySelectorAll('.offcanvas').forEach(element => {
      new Offcanvas(element);
    });
  }

  // Initialize tooltips
  initTooltipsAndPopovers() {
    document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(element => {
      new Tooltip(element);
    });
  }

  // Initialize page-specific components
  async initPageComponents() {
    const currentPage = document.body.dataset.page;

    switch (currentPage) {
      case 'dashboard':
        this.components.set('dashboard', new DashboardManager());
        break;
      case 'marketplace':
        await this.initMarketplacePage();
        break;
      case 'users':
        await this.initUsersPage();
        break;
      case 'analytics':
        await this.initAnalyticsPage();
        break;
      case 'forms':
        await this.initFormsPage();
        break;
      case 'products':
        await this.initProductsPage();
        break;
      case 'orders':
        await this.initOrdersPage();
        break;
      case 'reports':
        await this.initReportsPage();
        break;
      case 'messages':
        await this.initMessagesPage();
        break;
      case 'calendar':
        await this.initCalendarPage();
        break;
      case 'settings':
        await this.initSettingsPage();
        break;
      case 'security':
        await this.initSecurityPage();
        break;
      case 'files':
        await this.initFilesPage();
        break;
      case 'help':
        await this.initHelpPage();
        break;
      case 'elements':
        await this.initElementsPage();
        break;
      // Add more page-specific initializations here
      default:
        console.log('Page-specific components loading complete');
    }
  }

  // Initialize marketplace page
  async initMarketplacePage() {
    try {
      await import('./components/marketplace.js');
      console.log('🛍️ Marketplace page script loaded successfully');
    } catch (error) {
      console.error('Failed to load marketplace page script:', error);
    }
  }

  // Initialize forms page
  async initFormsPage() {
    try {
      // Dynamically load the forms component script (it self-registers with Alpine)
      await import('./components/forms.js');
      console.log('📝 Forms page script loaded successfully');
    } catch (error) {
      console.warn('Forms components not available:', error);
    }
  }

  async initUsersPage() {
    try {
      await import('./components/users.js');
      console.log('👥 Users page script loaded successfully');
    } catch (error) {
      console.error('Failed to load users page script:', error);
    }
  }

  async initAnalyticsPage() {
    try {
      await import('./components/analytics.js');
      console.log('📊 Analytics page script loaded successfully');
    } catch (error) {
      console.error('Failed to load analytics page script:', error);
    }
  }

  async initProductsPage() {
    try {
      await import('./components/products.js');
      console.log('📦 Products page script loaded successfully');
    } catch (error) {
      console.error('Failed to load products page script:', error);
    }
  }

  async initOrdersPage() {
    try {
      await import('./components/orders.js');
      console.log('🛒 Orders page script loaded successfully');
    } catch (error) {
      console.error('Failed to load orders page script:', error);
    }
  }

  async initReportsPage() {
    try {
      await import('./components/reports.js');
      console.log('📊 Reports page script loaded successfully');
    } catch (error) {
      console.error('Failed to load reports page script:', error);
    }
  }

  async initMessagesPage() {
    try {
      await import('./components/messages.js');
      console.log('💬 Messages page script loaded successfully');
    } catch (error) {
      console.error('Failed to load messages page script:', error);
    }
  }

  async initCalendarPage() {
    try {
      await import('./components/calendar.js');
      console.log('📅 Calendar page script loaded successfully');
    } catch (error) {
      console.error('Failed to load calendar page script:', error);
    }
  }

  async initSettingsPage() {
    try {
      await import('./components/settings.js');
      console.log('⚙️ Settings page script loaded successfully');
    } catch (error) {
      console.error('Failed to load settings page script:', error);
    }
  }

  async initSecurityPage() {
    try {
      await import('./components/security.js');
      console.log('🔒 Security page script loaded successfully');
    } catch (error) {
      console.error('Failed to load security page script:', error);
    }
  }

  async initFilesPage() {
    try {
      await import('./components/files.js');
      console.log('📁 Files page script loaded successfully');
    } catch (error) {
      console.error('Failed to load files page script:', error);
    }
  }

  async initHelpPage() {
    try {
      await import('./components/help.js');
      console.log('❓ Help page script loaded successfully');
    } catch (error) {
      console.error('Failed to load help page script:', error);
    }
  }

  async initElementsPage() {
    try {
      await import('./components/elements.js');
      console.log('🧩 Elements page script loaded successfully');
    } catch (error) {
      console.error('Failed to load elements page script:', error);
    }
  }

  // Setup global event listeners
  setupEventListeners() {
    // Theme toggle
    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-theme-toggle]')) {
        this.themeManager.toggleTheme();
      }
    });

    // Full screen toggle
    document.addEventListener('click', (e) => {
      const fullscreenButton = e.target.closest('[data-fullscreen-toggle]');
      if (fullscreenButton) {
        e.preventDefault();
        this.toggleFullscreen();
      }
    });

    // Same-page dynamic subview navigation interceptor
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href]');
      if (!link) return;

      const rawHref = link.getAttribute('href');
      if (!rawHref || rawHref === '#' || rawHref.startsWith('#') || rawHref.startsWith('javascript:') || rawHref.startsWith('mailto:') || rawHref.startsWith('tel:')) return;

      try {
        const targetUrl = new URL(link.href, window.location.href);
        const currentUrl = new URL(window.location.href);

        const targetBase = targetUrl.pathname.split('/').pop() || 'index.html';
        const currentBase = currentUrl.pathname.split('/').pop() || 'index.html';

        // If clicking a link on the same HTML page with different query/hash
        if (targetBase === currentBase && targetUrl.origin === currentUrl.origin) {
          if (targetUrl.search !== currentUrl.search || targetUrl.hash !== currentUrl.hash) {
            e.preventDefault();
            window.history.pushState({}, '', targetUrl.href);
            window.dispatchEvent(new CustomEvent('omnistore:navigate', {
              detail: {
                search: targetUrl.search,
                pathname: targetUrl.pathname,
                href: targetUrl.href
              }
            }));
            this.initNavigation();
          }
        }
      } catch (err) {
        console.warn('Navigation intercept error:', err);
      }
    });

    // Browser Back / Forward navigation
    window.addEventListener('popstate', () => {
      window.dispatchEvent(new CustomEvent('omnistore:navigate', {
        detail: {
          search: window.location.search,
          pathname: window.location.pathname,
          href: window.location.href
        }
      }));
      this.initNavigation();
    });

    // Global keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      this.handleKeyboardShortcuts(e);
    });
  }

  // Handle keyboard shortcuts
  handleKeyboardShortcuts(event) {
    // Ctrl/Cmd + K for search. event.code is layout-independent (KeyK regardless
    // of locale or modifier-shifted key value); event.key can vary by layout.
    const isSearchShortcut =
      (event.ctrlKey || event.metaKey) &&
      !event.altKey &&
      !event.shiftKey &&
      (event.code === 'KeyK' || event.key === 'k' || event.key === 'K');

    if (isSearchShortcut) {
      event.preventDefault();
      const searchInput = document.querySelector('[data-search-input]');
      if (searchInput) searchInput.focus();
    }
  }

  // Replace the literal "Ctrl+K" placeholder hint with the platform-correct one.
  // Mac users expect ⌘K, not Ctrl+K — and the keydown handler already accepts both.
  localizeShortcutHints() {
    const isMac = /Mac|iPhone|iPad|iPod/i.test(
      (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || ''
    );
    if (!isMac) return; // Ctrl+K is already correct for Windows/Linux

    document.querySelectorAll('[data-search-input]').forEach((el) => {
      if (el.placeholder && el.placeholder.includes('Ctrl+K')) {
        el.placeholder = el.placeholder.replace('Ctrl+K', '⌘K'); // ⌘K
      }
    });
  }

  // Toggle fullscreen
  async toggleFullscreen() {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('Fullscreen toggle failed:', error);
    }
  }

  // Get component instance
  getComponent(name) {
    return this.components.get(name);
  }

  // Initialize navigation functionality
  initNavigation() {
    const currentPath = window.location.pathname;
    let currentFile = currentPath.substring(currentPath.lastIndexOf('/') + 1) || 'index.html';
    if (currentFile === '' || currentFile === '/') currentFile = 'index.html';
    const currentSearch = window.location.search || '';

    const allNavLinks = Array.from(document.querySelectorAll('.sidebar-nav .nav-link'));
    allNavLinks.forEach(link => link.classList.remove('active'));

    // 1. Find best match: exact file + search param first (for tabs/filters)
    let activeLink = null;
    if (currentSearch) {
      activeLink = allNavLinks.find(link => {
        const href = link.getAttribute('href') || '';
        return href === `${currentFile}${currentSearch}` || href === `./${currentFile}${currentSearch}`;
      });
    }

    // 2. Fallback: match without search param if no exact query match found
    if (!activeLink) {
      activeLink = allNavLinks.find(link => {
        const href = (link.getAttribute('href') || '').split('?')[0];
        return href === currentFile || href === `./${currentFile}`;
      });
    }

    if (activeLink) {
      activeLink.classList.add('active');
      const parentSubmenu = activeLink.closest('.collapse');
      if (parentSubmenu) {
        parentSubmenu.classList.add('show');
        const toggleBtn = document.querySelector(`[data-bs-target="#${parentSubmenu.id}"]`);
        if (toggleBtn) {
          toggleBtn.setAttribute('aria-expanded', 'true');
        }
      }
    }

    // Handle submenu toggle persistence
    document.addEventListener('click', (e) => {
      const toggleButton = e.target.closest('[data-bs-toggle="collapse"]');
      if (toggleButton) {
        const targetId = toggleButton.getAttribute('data-bs-target');
        const isExpanded = toggleButton.getAttribute('aria-expanded') === 'true';
        // Store submenu state
        if (targetId) {
          localStorage.setItem(`submenu-${targetId}`, (!isExpanded).toString());
        }
      }
    });

    // Restore user submenu preferences from localStorage
    const submenuToggles = document.querySelectorAll('[data-bs-toggle="collapse"]');
    submenuToggles.forEach(toggle => {
      const targetId = toggle.getAttribute('data-bs-target');
      if (targetId) {
        const savedState = localStorage.getItem(`submenu-${targetId}`);
        if (savedState === 'true') {
          const targetElement = document.querySelector(targetId);
          if (targetElement) {
            targetElement.classList.add('show');
            toggle.setAttribute('aria-expanded', 'true');
          }
        }
      }
    });
  }

  // Initialize Alpine.js
  initAlpine() {
    // Register Alpine data components
    Alpine.data('searchComponent', () => ({
      query: '',
      results: [],
      isLoading: false,
      
      async search() {
        if (this.query.length < 2) {
          this.results = [];
          return;
        }
        
        this.isLoading = true;
        // Simulate API search
        await new Promise(resolve => setTimeout(resolve, 300));
        
        this.results = [
          { title: 'Dashboard General', url: './index.html', type: 'page' },
          { title: 'Catálogo de Productos', url: './products.html', type: 'page' },
          { title: 'Pedidos & Ventas', url: './orders.html', type: 'page' },
          { title: 'Clientes & Usuarios', url: './users.html', type: 'page' },
          { title: 'Métricas & Analytics', url: './analytics.html', type: 'page' },
          { title: 'Ajustes de Tienda', url: './settings.html', type: 'page' },
          { title: 'Marketplace Tienda', url: './marketplace.html', type: 'page' }
        ].filter(item => 
          item.title.toLowerCase().includes(this.query.toLowerCase())
        );
        
        this.isLoading = false;
      }
    }));

    Alpine.data('statsCounter', (initialValue = 12426, increment = 3) => ({
      raw: Number(initialValue) || 0,
      
      init() {
        // Safe auto-increment: keeps raw numeric state distinct from display format
        setInterval(() => {
          this.raw += Math.floor(Math.random() * increment) + 1;
        }, 6000);
      },

      get formatted() {
        return this.raw.toLocaleString('es-CO');
      }
    }));

    Alpine.data('themeSwitch', () => ({
      currentTheme: 'light',
      
      init() {
        this.currentTheme = localStorage.getItem('theme') || 'light';
      },
      
      toggle() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-bs-theme', this.currentTheme);
        localStorage.setItem('theme', this.currentTheme);
      }
    }));

    Alpine.data('iconDemo', () => ({
      getIcon(iconName) {
        return iconManager.get(iconName);
      }
    }));

    // Quick Add Form for Dashboard
    Alpine.data('quickAddForm', () => ({
      itemType: 'task',
      title: '',
      description: '',
      priority: 'medium',
      dateTime: '',
      assignee: '',

      init() {
        // Set default date to now
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        this.dateTime = now.toISOString().slice(0, 16);
      },

      resetForm() {
        this.itemType = 'task';
        this.title = '';
        this.description = '';
        this.priority = 'medium';
        this.assignee = '';
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        this.dateTime = now.toISOString().slice(0, 16);
      },

      saveItem() {
        if (!this.title.trim()) {
          window.AdminApp.notificationManager.warning('Por favor ingresa un título o asunto.');
          return;
        }

        const item = {
          type: this.itemType,
          title: this.title,
          description: this.description,
          priority: this.itemType === 'task' ? this.priority : null,
          dateTime: ['event', 'reminder'].includes(this.itemType) ? this.dateTime : null,
          assignee: this.itemType === 'task' ? this.assignee : null,
          createdAt: new Date().toISOString()
        };

        console.log('Nuevo registro creado:', item);

        // Show success notification with item type
        const typeLabels = {
          task: 'Tarea',
          note: 'Nota Kardex',
          event: 'Despacho',
          reminder: 'Recordatorio'
        };

        window.AdminApp.notificationManager.success(
          `${typeLabels[this.itemType] || 'Registro'} "${this.title}" guardado con éxito.`
        );

        // Reset form for next use
        this.resetForm();
      }
    }));

    // Start Alpine.js
    Alpine.start();
    window.Alpine = Alpine;
  }

  // Show demo notifications
  showDemoNotifications() {
    setTimeout(() => {
      this.notificationManager.info('Nuevo pedido recibido (#OMNI-9482)', {
        action: {
          text: 'Ver',
          handler: 'window.location.href="./orders.html"'
        }
      });
    }, 3000);

    setTimeout(() => {
      this.notificationManager.warning('Sincronización de catálogo PostgreSQL activa');
    }, 6000);

    setTimeout(() => {
      this.notificationManager.success('Base de datos respaldada correctamente');
    }, 9000);
  }

  // Cleanup method
  destroy() {
    this.components.forEach(component => {
      if (component.destroy) {
        component.destroy();
      }
    });
    this.components.clear();
    this.isInitialized = false;
  }
}

// Create global app instance
const app = new AdminApp();

// Initialize app when module loads
app.init();

// Tear down on page hide so listeners/intervals don't leak across SPA-style nav
window.addEventListener('pagehide', () => app.destroy(), { once: true });

// Export for global access
window.AdminApp = app;
window.IconManager = iconManager;

// Export the app instance for module imports
export default app; 