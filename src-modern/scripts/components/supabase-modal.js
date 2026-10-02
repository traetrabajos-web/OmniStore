// ==============================================================================
// OmniStore Supabase Connection Component & Modal Controller
// ==============================================================================

import Alpine from 'alpinejs';
import Swal from 'sweetalert2';
import { Modal } from 'bootstrap';
import {
  getSupabaseConfig,
  saveSupabaseConfig,
  disconnectSupabase,
  testSupabaseConnection,
  isSupabaseConnected,
  syncLocalToSupabase
} from '../utils/supabase.js';
import { getProductsCatalog, getOrdersList, initSupabaseDataSync } from '../utils/store-data.js';

document.addEventListener('alpine:init', () => {
  Alpine.data('supabaseConnection', () => ({
    url: '',
    anonKey: '',
    isConnected: false,
    configSource: 'none',
    isTesting: false,
    isSyncing: false,
    testResult: null,
    modalInstance: null,

    init() {
      this.refreshStatus();

      window.addEventListener('omnistore:supabase-status', () => {
        this.refreshStatus();
      });

      // Setup Bootstrap Modal
      setTimeout(() => {
        const modalEl = document.getElementById('supabaseModal');
        if (modalEl) {
          this.modalInstance = new Modal(modalEl);
        }
      }, 300);
    },

    refreshStatus() {
      const config = getSupabaseConfig();
      this.url = config.url || 'https://hbxxwodvhqkzfktldkbi.supabase.co';
      this.anonKey = config.anonKey || '';
      this.configSource = config.source;
      this.isConnected = isSupabaseConnected();
    },

    openModal() {
      this.refreshStatus();
      this.testResult = null;
      if (this.modalInstance) {
        this.modalInstance.show();
      } else {
        const modalEl = document.getElementById('supabaseModal');
        if (modalEl) {
          this.modalInstance = new Modal(modalEl);
          this.modalInstance.show();
        }
      }
    },

    closeModal() {
      if (this.modalInstance) {
        this.modalInstance.hide();
      }
    },

    async testConnection() {
      if (!this.url.trim() || !this.anonKey.trim()) {
        this.testResult = {
          success: false,
          message: 'Por favor ingresa la Project URL y la Anon Key de tu proyecto en Supabase.'
        };
        return;
      }

      this.isTesting = true;
      this.testResult = null;

      try {
        const res = await testSupabaseConnection(this.url.trim(), this.anonKey.trim());
        if (res.success) {
          this.testResult = {
            success: true,
            message: '¡Conexión exitosa con Supabase PostgreSQL! La base de datos está lista.'
          };
        } else {
          this.testResult = {
            success: false,
            message: res.error || 'Error al conectar con Supabase. Revisa las credenciales y que el script SQL haya sido ejecutado.'
          };
        }
      } catch (e) {
        this.testResult = {
          success: false,
          message: e.message || 'Error de conexión.'
        };
      } finally {
        this.isTesting = false;
      }
    },

    async saveAndConnect() {
      if (!this.url.trim() || !this.anonKey.trim()) {
        Swal.fire('Campos requeridos', 'Ingresa la URL y Anon Key de Supabase.', 'warning');
        return;
      }

      this.isTesting = true;
      const test = await testSupabaseConnection(this.url.trim(), this.anonKey.trim());
      this.isTesting = false;

      if (!test.success) {
        Swal.fire({
          icon: 'error',
          title: 'Error de Conexión',
          html: `<p>${test.error}</p><small class="text-muted">Asegúrate de haber ejecutado el archivo <code>supabase-schema.sql</code> en el SQL Editor de supabase.com</small>`,
          confirmButtonColor: '#ff5722'
        });
        return;
      }

      // Save credentials
      saveSupabaseConfig(this.url, this.anonKey);
      this.refreshStatus();

      // Trigger sync
      await initSupabaseDataSync();

      this.closeModal();

      Swal.fire({
        icon: 'success',
        title: '¡OmniStore Conectado a Supabase PostgreSQL!',
        html: `
          <div class="text-start small p-2">
            <p class="mb-1"><i class="bi bi-check-circle-fill text-success me-2"></i> Base de datos PostgreSQL conectada en la nube.</p>
            <p class="mb-1"><i class="bi bi-broadcast text-primary me-2"></i> Sincronización en tiempo real (Realtime WebSockets) activada.</p>
            <p class="mb-0 text-muted mt-2">Ahora los productos creados en el admin y las compras de los clientes se guardan directamente en PostgreSQL.</p>
          </div>
        `,
        confirmButtonColor: '#ff5722'
      });
    },

    async uploadLocalData() {
      this.isSyncing = true;
      try {
        const products = getProductsCatalog();
        const orders = getOrdersList();
        const res = await syncLocalToSupabase(products, orders);
        if (res.success) {
          Swal.fire({
            icon: 'success',
            title: '¡Datos Sincronizados!',
            text: `Se han subido ${res.productsCount} productos y ${res.ordersCount} pedidos a Supabase PostgreSQL.`,
            confirmButtonColor: '#ff5722'
          });
        } else {
          Swal.fire('Error al subir datos', res.error, 'error');
        }
      } catch (e) {
        Swal.fire('Error', e.message, 'error');
      } finally {
        this.isSyncing = false;
      }
    },

    disconnectDb() {
      Swal.fire({
        title: '¿Desconectar Supabase?',
        text: 'La tienda volverá a funcionar en Modo Local (LocalStorage).',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, desconectar',
        cancelButtonText: 'Cancelar'
      }).then((result) => {
        if (result.isConfirmed) {
          disconnectSupabase();
          this.refreshStatus();
          this.closeModal();
          Swal.fire({
            icon: 'info',
            title: 'Desconectado',
            text: 'OmniStore ahora está operando en Modo Local.',
            timer: 2000,
            showConfirmButton: false
          });
        }
      });
    }
  }));
});
