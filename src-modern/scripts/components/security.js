import Alpine from 'alpinejs';
import Swal from 'sweetalert2';
import { createSearchComponent } from '../utils/search-component.js';

document.addEventListener('alpine:init', () => {
  Alpine.data('securityComponent', () => ({
    // UI State
    activeSection: 'account',
    loading: false,
    sidebarVisible: false,
    
    // Security Overview Data
    securityScore: 96,
    lastSecurityAudit: '2026-02-15',
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
    
    // Session Management (Cartagena)
    activeSessions: [
      {
        id: 1,
        device: 'Computador Windows - Chrome',
        deviceIcon: 'bi-laptop',
        location: 'Bocagrande, Cartagena, Colombia',
        ip: '181.129.45.12',
        lastActive: 'Hace 2 minutos',
        current: true,
        isCurrent: true
      },
      {
        id: 2,
        device: 'iPhone 15 Pro - Safari',
        deviceIcon: 'bi-phone',
        location: 'Manga, Cartagena, Colombia',
        ip: '190.27.88.34',
        lastActive: 'Hace 1 hora',
        current: false,
        isCurrent: false
      },
      {
        id: 3,
        device: 'iPad Air - Safari',
        deviceIcon: 'bi-tablet',
        location: 'Crespo, Cartagena, Colombia',
        ip: '186.154.21.90',
        lastActive: 'Hace 2 días',
        current: false,
        isCurrent: false
      }
    ],
    
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
    
    // Security activity for the log
    securityActivity: [
      {
        id: 1,
        type: 'login_success',
        message: 'Inicio de sesión exitoso como SuperAdmin',
        timestamp: '2026-02-28 14:30:00',
        severity: 'info',
        icon: 'bi-check-circle',
        details: 'Chrome en Windows desde Bocagrande, Cartagena (Fibra Óptica)'
      },
      {
        id: 2,
        type: 'password_change',
        message: 'Contraseña y token JWT actualizados',
        timestamp: '2026-02-25 09:15:00',
        severity: 'success',
        icon: 'bi-shield-lock',
        details: 'Sincronizado con Supabase PostgreSQL Auth'
      },
      {
        id: 3,
        type: 'failed_login',
        message: 'Intento de acceso bloqueado por firewall',
        timestamp: '2026-02-20 16:45:00',
        severity: 'warning',
        icon: 'bi-exclamation-triangle',
        details: 'IP desconocida bloqueada tras 3 intentos'
      }
    ],

    init() {
      // Initialize security state
    },

    setActiveSection(sectionId) {
      this.activeSection = sectionId;
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
        title: '¿Cerrar sesión?',
        text: `¿Cerrar sesión remota en ${session.device}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, cerrar sesión',
        cancelButtonText: 'Cancelar'
      }).then((result) => {
        if (result.isConfirmed) {
          this.activeSessions = this.activeSessions.filter(s => s.id !== session.id);
          Swal.fire('Sesión cerrada', 'El dispositivo ha sido desconectado.', 'success');
        }
      });
    },

    revokeAllOtherSessions() {
      Swal.fire({
        title: '¿Cerrar todas las demás sesiones?',
        text: 'Se cerrará la sesión en todos los demás teléfonos y computadores.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Cerrar otras sesiones',
        cancelButtonText: 'Cancelar'
      }).then((result) => {
        if (result.isConfirmed) {
          this.activeSessions = this.activeSessions.filter(s => s.isCurrent || s.current);
          Swal.fire('Completado', 'Solo tu sesión actual permanece activa.', 'success');
        }
      });
    },

    viewSecurityLog() {
      this.activeSection = 'activity';
    },

    emergencyLockdown() {
      Swal.fire({
        title: 'Bloqueo de Emergencia',
        text: '¿Deseas bloquear el acceso a la tienda y congelar transacciones sospechosas?',
        icon: 'error',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'Activar Bloqueo',
        cancelButtonText: 'Cancelar'
      }).then((result) => {
        if (result.isConfirmed) {
          Swal.fire('Bloqueo Activado', 'El sistema ha restringido accesos temporales.', 'warning');
        }
      });
    }
  }));

  Alpine.data('searchComponent', createSearchComponent({ getResults: () => [] }));
});