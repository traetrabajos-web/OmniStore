import Alpine from 'alpinejs';
import Swal from 'sweetalert2';
import { createSearchComponent } from '../utils/search-component.js';
import {
  getTicketsList,
  addTicket,
  updateTicketStatus,
  replyTicket,
  deleteTicket
} from '../utils/store-data.js';

document.addEventListener('alpine:init', () => {
  Alpine.data('helpComponent', () => ({
    // UI State
    activeSection: 'getting-started',
    loading: false,
    
    // Search functionality
    faqSearch: '',
    filteredFAQ: [],
    
    // Documentation
    selectedDocCategory: 'getting-started',
    
    // Support ticket form
    supportTicket: {
      name: '',
      email: '',
      priority: '',
      category: '',
      subject: '',
      description: ''
    },
    submittingTicket: false,
    
    // Feature request form
    featureRequest: {
      title: '',
      category: '',
      description: ''
    },

    // Reactive tickets list from store
    ticketsList: [],
    ticketFilterStatus: 'all',
    
    // Navigation sections
    sections: [
      { id: 'getting-started', name: 'Primeros Pasos', icon: 'bi-play-circle' },
      { id: 'tickets', name: 'Tickets de Soporte & PQRS', icon: 'bi-ticket-detailed' },
      { id: 'faq', name: 'Preguntas Frecuentes (FAQ)', icon: 'bi-question-circle' },
      { id: 'documentation', name: 'Documentación & Guías', icon: 'bi-book' },
      { id: 'contact', name: 'Radicar Ticket / Contacto', icon: 'bi-headset' },
      { id: 'features', name: 'Sugerencias de Funcionalidad', icon: 'bi-lightbulb' }
    ],
    
    // FAQ data en Español / Colombia
    faqData: [
      {
        question: '¿Cómo funciona la integración con pasarelas de pago (PSE, Wompi, Nequi)?',
        answer: 'OmniStore se conecta con Wompi, Bancolombia, QR y PSE para procesar pagos instantáneos en pesos colombianos ($ COP) con conciliación automática de estados.',
        open: false
      },
      {
        question: '¿Cómo se generan las guías de transporte con Servientrega o Coordinadora?',
        answer: 'Al pasar un pedido a estado "Por Enviar" o "En Camino", el sistema genera automáticamente el número de rastreo y guía logística vinculada a la transportadora seleccionada.',
        open: false
      },
      {
        question: '¿Cómo emito facturas electrónicas avaladas por la DIAN?',
        answer: 'En el módulo Reportes > Facturación & Impuestos puedes consultar y emitir facturas con código CUFE y formato XML UBL 2.1 con validación previa DIAN.',
        open: false
      },
      {
        question: '¿Cómo aplicar cupones de descuento y envíos gratis?',
        answer: 'Desde Ajustes > Cupones puedes crear códigos porcentuales o fijos en COP. El Marketplace los valida y deduce automáticamente en el checkout.',
        open: false
      },
      {
        question: '¿Qué navegadores y dispositivos son compatibles?',
        answer: 'OmniStore es 100% responsive y funciona en Google Chrome, Mozilla Firefox, Safari, Microsoft Edge y navegadores móviles en iOS y Android.',
        open: false
      }
    ],
    
    // Documentation categories
    docCategories: [
      { id: 'getting-started', name: 'Primeros Pasos', icon: 'bi-play-circle', count: 5 },
      { id: 'user-management', name: 'Gestión de Usuarios & Roles', icon: 'bi-people', count: 8 },
      { id: 'analytics', name: 'Métricas & Reportes', icon: 'bi-graph-up', count: 12 },
      { id: 'security', name: 'Seguridad & DIAN', icon: 'bi-shield-check', count: 6 },
      { id: 'integrations', name: 'Integraciones Pasarelas', icon: 'bi-puzzle', count: 10 },
      { id: 'api', name: 'API & Webhooks', icon: 'bi-code-slash', count: 15 }
    ],
    
    // Documentation articles
    documentationData: {
      'getting-started': [
        {
          id: 'quick-start',
          title: 'Guía de Inicio Rápido OmniStore',
          description: 'Aprende los fundamentos para administrar tu tienda en 5 minutos',
          type: 'Guía',
          lastUpdated: 'Feb 15, 2026',
          readTime: 5
        },
        {
          id: 'dashboard-overview',
          title: 'Visión General del Dashboard',
          description: 'Comprende los indicadores clave, ventas y gráficos en tiempo real',
          type: 'Tutorial',
          lastUpdated: 'Feb 12, 2026',
          readTime: 8
        }
      ],
      'user-management': [
        {
          id: 'adding-users',
          title: 'Administración de Clientes & Roles',
          description: 'Paso a paso para crear roles de administrador, operador y clientes',
          type: 'Tutorial',
          lastUpdated: 'Feb 18, 2026',
          readTime: 7
        }
      ],
      'analytics': [
        {
          id: 'custom-reports',
          title: 'Generación de Reportes Financieros',
          description: 'Exporta ventas, kardex y facturas electrónicas a Excel y PDF',
          type: 'Tutorial',
          lastUpdated: 'Feb 20, 2026',
          readTime: 10
        }
      ],
      'security': [
        {
          id: 'two-factor-auth',
          title: 'Seguridad y Protección de Datos (Habeas Data)',
          description: 'Cumplimiento de la Ley 1581 y auditoría de transacciones',
          type: 'Guía',
          lastUpdated: 'Feb 22, 2026',
          readTime: 6
        }
      ],
      'integrations': [
        {
          id: 'third-party',
          title: 'Configuración Wompi, PSE y Bold',
          description: 'Llaves de producción y pruebas para cobro con tarjetas y QR',
          type: 'Guía',
          lastUpdated: 'Feb 25, 2026',
          readTime: 12
        }
      ],
      'api': [
        {
          id: 'endpoints',
          title: 'Referencia de Endpoints & Supabase',
          description: 'Sincronización bidireccional de pedidos y catálogo PostgreSQL',
          type: 'Referencia',
          lastUpdated: 'Feb 26, 2026',
          readTime: 15
        }
      ]
    },
    
    // System status
    systemStatus: [
      { name: 'Pasarela Wompi & PSE', status: 'operational', statusText: 'Operacional' },
      { name: 'Base de Datos Supabase PostgreSQL', status: 'operational', statusText: 'Operacional' },
      { name: 'Facturación Electrónica DIAN', status: 'operational', statusText: 'Operacional' },
      { name: 'Webhooks Transportadoras (Servientrega)', status: 'operational', statusText: 'Operacional' },
      { name: 'Notificaciones WhatsApp & Email', status: 'operational', statusText: 'Operacional' }
    ],
    
    // Popular feature requests
    popularRequests: [
      {
        id: 1,
        title: 'Integración con Mercado Libre API Colombia',
        description: 'Sincronizar stock y ventas automáticamente con la cuenta de MeLi',
        category: 'Integraciones',
        votes: 342,
        status: 'En Desarrollo',
        voted: false
      },
      {
        id: 2,
        title: 'Impresión térmica directa de guías PDF (Zebra / POS)',
        description: 'Impresión rápida de etiquetas de envío formato 10x15cm',
        category: 'Logística',
        votes: 215,
        status: 'Planeado',
        voted: true
      },
      {
        id: 3,
        title: 'Bot de WhatsApp con IA para atención a clientes',
        description: 'Respuestas automáticas de estado de pedido y seguimiento de guías',
        category: 'Marketing',
        votes: 189,
        status: 'En Revisión',
        voted: false
      }
    ],
    
    handleRouteNavigation(search) {
      const urlParams = new URLSearchParams(search !== undefined ? search : window.location.search);
      const sectionParam = urlParams.get('section') || urlParams.get('tab');
      if (sectionParam && this.sections.some(s => s.id === sectionParam)) {
        this.activeSection = sectionParam;
      }
    },

    init() {
      this.handleRouteNavigation();
      this.filteredFAQ = [...this.faqData];
      this.loadTickets();

      window.addEventListener('omnistore:navigate', (e) => {
        this.handleRouteNavigation(e.detail?.search);
      });

      window.addEventListener('popstate', () => {
        this.handleRouteNavigation();
      });

      window.addEventListener('omnistore:tickets-updated', () => {
        this.loadTickets();
      });
    },

    loadTickets() {
      this.ticketsList = getTicketsList();
    },

    get filteredTickets() {
      if (this.ticketFilterStatus === 'all') return this.ticketsList;
      return this.ticketsList.filter(t => t.status === this.ticketFilterStatus);
    },
    
    // Navigation
    setActiveSection(section) {
      this.activeSection = section;
      if (section === 'documentation' && !this.selectedDocCategory) {
        this.selectedDocCategory = 'getting-started';
      }
      const url = new URL(window.location.href);
      url.searchParams.set('tab', section);
      window.history.replaceState({}, '', url.toString());
    },
    
    // FAQ functionality
    toggleFAQ(index) {
      this.filteredFAQ[index].open = !this.filteredFAQ[index].open;
    },
    
    filterFAQ() {
      if (!this.faqSearch.trim()) {
        this.filteredFAQ = [...this.faqData];
        return;
      }
      
      const searchTerm = this.faqSearch.toLowerCase();
      this.filteredFAQ = this.faqData.filter(faq => 
        faq.question.toLowerCase().includes(searchTerm) ||
        faq.answer.toLowerCase().includes(searchTerm)
      );
      
      this.filteredFAQ.forEach(faq => faq.open = false);
    },
    
    highlightText(text, searchTerm) {
      if (!searchTerm) return text;
      const regex = new RegExp(`(${searchTerm})`, 'gi');
      return text.replace(regex, '<span class="search-highlight">$1</span>');
    },
    
    // Documentation functionality
    selectDocCategory(categoryId) {
      this.selectedDocCategory = categoryId;
    },
    
    get selectedDocs() {
      return this.documentationData[this.selectedDocCategory] || [];
    },
    
    openDoc(docId) {
      this.showNotification(`Abriendo guía: ${docId}`, 'info');
    },
    
    openArticle(articleId) {
      this.showNotification(`Abriendo artículo de ayuda: ${articleId}`, 'info');
    },
    
    playVideo(videoId) {
      Swal.fire({
        title: 'Video Tutorial OmniStore',
        text: 'Reproduciendo video instructivo de configuración de la plataforma.',
        icon: 'info',
        confirmButtonText: 'Cerrar'
      });
    },
    
    startLiveChat() {
      Swal.fire({
        title: 'Chat de Soporte en Vivo',
        text: 'Un asesor técnico de OmniStore Colombia te atenderá en segundos.',
        icon: 'success',
        confirmButtonText: 'Iniciar Conversación'
      });
    },
    
    openEmailForm() {
      this.setActiveSection('contact');
    },
    
    showPhoneInfo() {
      Swal.fire({
        title: 'Línea Telefónica de Atención',
        html: `
          <div class="text-start">
            <p><strong>PBX Cartagena:</strong> +57 (605) 665-9000</p>
            <p><strong>Línea de Atención:</strong> +57 (605) 665-9001</p>
            <p><strong>WhatsApp Soporte:</strong> +57 310 845 9210</p>
            <p class="small text-muted mb-0">Horario de atención: Lunes a Sábado de 8:00 AM a 6:00 PM (Cartagena, Bolívar)</p>
          </div>
        `,
        icon: 'info',
        confirmButtonText: 'Entendido'
      });
    },
    
    submitTicket() {
      if (!this.validateTicketForm()) return;
      
      this.submittingTicket = true;
      
      setTimeout(() => {
        const newTicket = addTicket({
          customer: this.supportTicket.name,
          email: this.supportTicket.email,
          priority: this.supportTicket.priority,
          category: this.supportTicket.category,
          subject: this.supportTicket.subject,
          description: this.supportTicket.description,
          status: 'Abierto'
        });

        this.submittingTicket = false;
        this.loadTickets();
        this.showNotification(`¡Ticket #${newTicket.id} radicado con éxito! Recibirás respuesta a tu correo.`, 'success');
        this.resetTicketForm();
        this.setActiveSection('tickets');
      }, 800);
    },
    
    validateTicketForm() {
      const required = ['name', 'email', 'priority', 'category', 'subject', 'description'];
      const missing = required.filter(field => !this.supportTicket[field]);
      
      if (missing.length > 0) {
        this.showNotification('Por favor completa todos los campos obligatorios del formulario', 'error');
        return false;
      }
      return true;
    },
    
    resetTicketForm() {
      this.supportTicket = {
        name: '',
        email: '',
        priority: '',
        category: '',
        subject: '',
        description: ''
      };
    },

    // Ticket Moderation & Reply
    viewTicketDetails(ticket) {
      Swal.fire({
        title: `Ticket #${ticket.id}: ${ticket.subject}`,
        html: `
          <div class="text-start small">
            <div class="mb-2 p-2 bg-light rounded border">
              <strong>Cliente:</strong> ${ticket.customer} &bull; <strong>Email:</strong> ${ticket.email}<br>
              <strong>Prioridad:</strong> <span class="badge ${ticket.priority === 'urgent' || ticket.priority === 'Alta' ? 'bg-danger' : 'bg-primary'}">${ticket.priority}</span> &bull; 
              <strong>Estado:</strong> <span class="badge ${ticket.status === 'Resuelto' ? 'bg-success' : (ticket.status === 'En Proceso' ? 'bg-warning text-dark' : 'bg-secondary')}">${ticket.status}</span><br>
              <strong>Fecha:</strong> ${ticket.date || new Date().toISOString().split('T')[0]}
            </div>
            <div class="mb-3">
              <label class="fw-bold">Mensaje / Detalle del Caso:</label>
              <div class="p-2 border rounded bg-white text-muted">${ticket.description || ticket.subject}</div>
            </div>
            ${ticket.adminReply ? `
              <div class="mb-3">
                <label class="fw-bold text-success">Respuesta del Agente de Soporte:</label>
                <div class="p-2 border rounded bg-success-subtle text-success-emphasis">${ticket.adminReply}</div>
              </div>
            ` : ''}
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: '<i class="bi bi-reply-fill me-1"></i> Responder al Cliente',
        cancelButtonText: 'Cerrar',
        confirmButtonColor: '#ff6600'
      }).then((result) => {
        if (result.isConfirmed) {
          this.promptReplyTicket(ticket);
        }
      });
    },

    promptReplyTicket(ticket) {
      Swal.fire({
        title: `Responder Ticket #${ticket.id}`,
        input: 'textarea',
        inputLabel: `Escribe la respuesta oficial para ${ticket.customer}:`,
        inputPlaceholder: 'Ingresa la solución o instrucciones para el usuario...',
        showCancelButton: true,
        confirmButtonText: 'Enviar Respuesta & Resolver',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#ff6600',
        inputValidator: (val) => {
          if (!val || !val.trim()) {
            return 'Por favor escribe una respuesta antes de enviar.';
          }
        }
      }).then((res) => {
        if (res.isConfirmed && res.value) {
          replyTicket(ticket.id, res.value.trim());
          this.loadTickets();
          this.showNotification(`Respuesta enviada a ${ticket.email} y ticket marcado como Resuelto.`, 'success');
        }
      });
    },

    changeTicketStatus(ticket, newStatus) {
      updateTicketStatus(ticket.id, newStatus);
      this.loadTickets();
      this.showNotification(`Ticket #${ticket.id} cambiado a estado "${newStatus}".`, 'info');
    },

    deleteTicketPrompt(ticketId) {
      Swal.fire({
        title: '¿Eliminar ticket?',
        text: 'Esta acción removerá el registro de PQRS de forma permanente.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#dc3545'
      }).then((result) => {
        if (result.isConfirmed) {
          deleteTicket(ticketId);
          this.loadTickets();
          this.showNotification('Ticket eliminado correctamente.', 'info');
        }
      });
    },
    
    // Feature request functionality
    submitFeatureRequest() {
      if (!this.featureRequest.title || !this.featureRequest.category || !this.featureRequest.description) {
        this.showNotification('Por favor completa todos los campos requeridos', 'error');
        return;
      }
      
      const newRequest = {
        id: this.popularRequests.length + 1,
        title: this.featureRequest.title,
        description: this.featureRequest.description,
        category: this.featureRequest.category,
        votes: 1,
        status: 'En Revisión',
        voted: true
      };
      
      this.popularRequests.unshift(newRequest);
      this.showNotification('¡Sugerencia de funcionalidad radicada exitosamente!', 'success');
      
      this.featureRequest = {
        title: '',
        category: '',
        description: ''
      };
    },
    
    voteFeature(requestId) {
      const request = this.popularRequests.find(r => r.id === requestId);
      if (request && !request.voted) {
        request.votes++;
        request.voted = true;
        this.showNotification('¡Gracias por votar por esta mejora!', 'success');
      }
    },
    
    viewSystemStatus() {
      Swal.fire({
        title: 'Estado Operacional de Servicios',
        html: `
          <div class="text-start">
            <p><span class="badge bg-success me-2">OK</span> <strong>Pasarela PSE / Wompi:</strong> 100% Operativa</p>
            <p><span class="badge bg-success me-2">OK</span> <strong>Supabase PostgreSQL:</strong> 100% Operativa</p>
            <p><span class="badge bg-success me-2">OK</span> <strong>Facturación DIAN:</strong> 100% Operativa</p>
            <p><span class="badge bg-success me-2">OK</span> <strong>Webhooks Servientrega:</strong> 100% Operativa</p>
          </div>
        `,
        icon: 'success',
        confirmButtonText: 'Cerrar'
      });
    },
    
    downloadGuide() {
      this.showNotification('Descargando Guía Completa de Administrador en PDF...', 'info');
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
    }
  }));

  Alpine.data('searchComponent', createSearchComponent({
    minLength: 3,
    getResults(query) {
      const q = query.toLowerCase();
      return [
        { title: 'Primeros Pasos en OmniStore', url: '#getting-started', type: 'Guía' },
        { title: 'Preguntas Frecuentes (FAQ)', url: '#faq', type: 'Ayuda' },
        { title: 'Tickets de Soporte & PQRS', url: '#tickets', type: 'Soporte' },
        { title: 'Radicar Ticket de Soporte', url: '#contact', type: 'Contacto' },
      ].filter((item) => item.title.toLowerCase().includes(q));
    },
  }));

  Alpine.data('themeSwitch', () => ({
    currentTheme: 'light',

    init() {
      this.currentTheme = document.documentElement.getAttribute('data-bs-theme') ||
                         localStorage.getItem('theme') || 'light';
    },

    toggle() {
      this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-bs-theme', this.currentTheme);
      localStorage.setItem('theme', this.currentTheme);
    }
  }));
});