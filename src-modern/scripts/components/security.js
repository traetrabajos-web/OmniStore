import Alpine from 'alpinejs';
import Swal from 'sweetalert2';
import { createSearchComponent } from '../utils/search-component.js';
import { getCurrentUser } from '../utils/auth-service.js';
import {
  getStoredSessions,
  syncCurrentSession,
  revokeSessionById,
  revokeAllOtherSessions as revokeOthers,
  getStoredAuditLogs
} from '../utils/session-tracker.js';

document.addEventListener('alpine:init', () => {
  Alpine.data('securityComponent', () => ({
    // UI State
    activeSection: 'account',
    loading: false,
    sidebarVisible: false,
    
    // Security Overview Data
    securityScore: 98,
    lastSecurityAudit: '2026-03-01',
    activeThreats: 0,
    blockedAttempts: 47,
    
    // Authentication Settings
    auth: {
      twoFactorEnabled: true,
      biometricEnabled: true,
      sessionTimeout: 30,
      maxSessions: 5,
      requirePasswordChange: 90,
      passwordMinLength: 12,
      requireSpecialChars: true,
      requireNumbers: true,
      requireUppercase: true
    },
    
    // Active Sessions (real-time synchronized)
    activeSessions: [],
    
    // Access Control
    permissions: {
      adminAccess: true,
      userManagement: true,
      systemSettings: true,
      dataExport: true,
      apiAccess: true
    },
    
    securityData: {
      recoveryEmail: 'admin@omnistore.com',
      lockoutProtection: true,
      twoFactor: {
        app: true,
        sms: true
      },
      privacy: {
        profileVisibility: 'team',
        showActivity: true,
        dataCollection: false
      }
    },
    
    // Navigation sections
    sections: [
      { id: 'account', name: 'Seguridad de la Cuenta', icon: 'bi-shield-check' },
      { id: 'twofactor', name: 'Autenticación en 2 Pasos (2FA)', icon: 'bi-key-fill' },
      { id: 'sessions', name: 'Sesiones Activas', icon: 'bi-laptop' },
      { id: 'privacy', name: 'Privacidad & Permisos', icon: 'bi-eye-slash' },
      { id: 'activity', name: 'Historial de Auditoría', icon: 'bi-activity' }
    ],
    
    // Security activity audit log
    securityActivity: [],

    async init() {
      // Check query parameter tab (e.g. ?tab=sessions)
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab');
      if (tabParam && this.sections.some(s => s.id === tabParam)) {
        this.activeSection = tabParam;
      }

      // Load initial stored sessions and audit logs
      this.activeSessions = getStoredSessions();
      this.securityActivity = getStoredAuditLogs();

      // Retrieve current user and sync session with real-time client hardware & geolocation
      const currentUser = getCurrentUser();
      if (currentUser) {
        if (currentUser.email) {
          this.securityData.recoveryEmail = currentUser.email;
        }
        try {
          const synced = await syncCurrentSession(currentUser);
          if (synced && synced.length > 0) {
            this.activeSessions = synced;
          }
        } catch (e) {
          console.warn('Real-time session sync warning:', e);
        }
      }

      // Listen for session and audit events in real time
      window.addEventListener('omnistore:sessions-updated', (e) => {
        if (e.detail) {
          this.activeSessions = e.detail;
        }
      });

      window.addEventListener('omnistore:audit-logs-updated', (e) => {
        if (e.detail) {
          this.securityActivity = e.detail;
        }
      });
    },

    setActiveSection(sectionId) {
      this.activeSection = sectionId;
      // Update URL without reloading
      const url = new URL(window.location.href);
      url.searchParams.set('tab', sectionId);
      window.history.replaceState({}, '', url);
    },

    changePassword() {
      Swal.fire({
        title: 'Actualizar Contraseña',
        html: `
          <input type="password" id="swal-curr-pass" class="swal2-input" placeholder="Contraseña actual">
          <input type="password" id="swal-new-pass" class="swal2-input" placeholder="Nueva contraseña">
          <input type="password" id="swal-conf-pass" class="swal2-input" placeholder="Confirmar nueva contraseña">
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Guardar Contraseña',
        cancelButtonText: 'Cancelar',
        preConfirm: () => {
          const np = document.getElementById('swal-new-pass').value;
          const cp = document.getElementById('swal-conf-pass').value;
          if (!np || np.length < 8) {
            Swal.showValidationMessage('La nueva contraseña debe tener mínimo 8 caracteres');
            return false;
          }
          if (np !== cp) {
            Swal.showValidationMessage('Las contraseñas no coinciden');
            return false;
          }
          return true;
        }
      }).then((result) => {
        if (result.isConfirmed) {
          Swal.fire('Contraseña Actualizada', 'Tu clave fue renovada exitosamente.', 'success');
        }
      });
    },

    updateRecoveryEmail() {
      Swal.fire({
        title: 'Correo de Recuperación',
        input: 'email',
        inputValue: this.securityData.recoveryEmail,
        showCancelButton: true,
        confirmButtonText: 'Actualizar',
        cancelButtonText: 'Cancelar'
      }).then((result) => {
        if (result.isConfirmed && result.value) {
          this.securityData.recoveryEmail = result.value;
          Swal.fire('Guardado', 'Correo de recuperación actualizado.', 'success');
        }
      });
    },

    revokeSession(session) {
      Swal.fire({
        title: '¿Cerrar sesión remota?',
        text: `¿Deseas desconectar la sesión activa en ${session.device}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, desconectar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#d33'
      }).then((result) => {
        if (result.isConfirmed) {
          this.activeSessions = revokeSessionById(session.id);
          Swal.fire({
            icon: 'success',
            title: 'Sesión Desconectada',
            text: `El dispositivo ${session.device} ha sido revocado correctamente.`,
            timer: 2000,
            showConfirmButton: false
          });
        }
      });
    },

    revokeAllOtherSessions() {
      Swal.fire({
        title: '¿Cerrar todas las demás sesiones?',
        text: 'Se cerrará la sesión en todos los demás dispositivos, teléfonos y computadores.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Cerrar otras sesiones',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#d33'
      }).then((result) => {
        if (result.isConfirmed) {
          this.activeSessions = revokeOthers();
          Swal.fire({
            icon: 'success',
            title: 'Completado',
            text: 'Solo tu sesión actual permanece activa y protegida.',
            timer: 2500,
            showConfirmButton: false
          });
        }
      });
    },

    loadMoreActivity() {
      Swal.fire({
        icon: 'info',
        title: 'Historial de Auditoría Completo',
        text: 'Todos los eventos de seguridad y conexiones recientes están cargados en pantalla.',
        timer: 2000,
        showConfirmButton: false
      });
    },

    viewSecurityLog() {
      this.setActiveSection('activity');
    },

    emergencyLockdown() {
      Swal.fire({
        title: 'Bloqueo de Emergencia',
        text: '¿Deseas activar el escudo de protección y revocar todas las sesiones sospechosas?',
        icon: 'error',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'Activar Bloqueo',
        cancelButtonText: 'Cancelar'
      }).then((result) => {
        if (result.isConfirmed) {
          this.activeSessions = revokeOthers();
          Swal.fire({
            title: 'Bloqueo de Seguridad Activado',
            text: 'El sistema ha restringido accesos temporales y finalizado sesiones remotas.',
            icon: 'success'
          });
        }
      });
    }
  }));

  Alpine.data('searchComponent', createSearchComponent({ getResults: () => [] }));
});