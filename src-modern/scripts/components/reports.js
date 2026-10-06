import Alpine from 'alpinejs';
import Swal from 'sweetalert2';
import ApexCharts from '../utils/apex.js';
import { categorical, accent, trackFill, surfacePanel, axisInk, gridLine } from '../utils/chart-palette.js';
import { createSearchComponent } from '../utils/search-component.js';
import {
  getOrdersList,
  getInvoicesList,
  addInvoice,
  getProductsCatalog,
  getUsersList
} from '../utils/store-data.js';

function isDarkMode() {
  return document.documentElement.getAttribute('data-bs-theme') === 'dark';
}

document.addEventListener('alpine:init', () => {
  Alpine.data('reportsComponent', () => ({
    // Tab selection
    activeTab: 'reports',

    // Filter settings
    dateRange: '30d',
    reportType: 'overview',
    exportFormat: 'pdf',
    
    // Data
    recentReports: [],
    topProducts: [],
    invoicesList: [],
    invoiceSearch: '',
    invoiceFilterStatus: 'all',
    chartsInitialized: false,
    charts: {
      revenueTrends: null,
      topProducts: null,
      customerAcquisition: null,
      regionSales: null
    },

    // KPI Data in COP
    kpis: {
      revenue: 125750000,
      revenueChange: 14.8,
      orders: 1420,
      ordersChange: 8.3,
      customers: 892,
      customersChange: 15.2,
      conversionRate: 4.6,
      conversionChange: 0.8
    },

    // Invoicing KPIs (DIAN)
    dianKpis: {
      totalInvoiced: 149642500,
      ivaCollected: 23892500,
      invoicesCount: 142,
      dianApprovalRate: 99.3
    },

    handleRouteNavigation(search) {
      const urlParams = new URLSearchParams(search !== undefined ? search : window.location.search);
      const tabParam = urlParams.get('tab');
      if (tabParam === 'invoices') {
        this.activeTab = 'invoices';
      } else {
        this.activeTab = 'reports';
      }
    },

    init() {
      this.handleRouteNavigation();
      this.loadStoreData();

      window.addEventListener('omnistore:navigate', (e) => {
        this.handleRouteNavigation(e.detail?.search);
      });

      window.addEventListener('popstate', () => {
        this.handleRouteNavigation();
      });

      window.addEventListener('omnistore:orders-updated', () => {
        this.loadStoreData();
      });

      window.addEventListener('omnistore:invoices-updated', () => {
        this.loadStoreData();
      });

      window.addEventListener('omnistore:theme-change', () => {
        this.destroyCharts();
        setTimeout(() => {
          this.initCharts();
        }, 50);
      });
      
      // Delay chart initialization to ensure DOM is fully ready
      setTimeout(() => {
        this.initCharts();
      }, 300);
    },

    loadStoreData() {
      const orders = getOrdersList();
      const invoices = getInvoicesList();
      const products = getProductsCatalog();
      const users = getUsersList();

      this.invoicesList = invoices;

      // Calculate dynamic revenue and orders
      const ordersRevenue = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
      const totalRevenue = Math.max(ordersRevenue, 125750000);
      const totalOrdersCount = Math.max(orders.length, 1420);
      const totalCustomersCount = Math.max(users.length, 892);

      this.kpis.revenue = totalRevenue;
      this.kpis.orders = totalOrdersCount;
      this.kpis.customers = totalCustomersCount;

      // DIAN KPIs
      const totalInvoiced = invoices.reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);
      const ivaCollected = invoices.reduce((sum, inv) => sum + (Number(inv.iva) || 0), 0);
      const approvedCount = invoices.filter(inv => inv.status === 'approved').length;

      this.dianKpis.totalInvoiced = totalInvoiced || 149642500;
      this.dianKpis.ivaCollected = ivaCollected || 23892500;
      this.dianKpis.invoicesCount = invoices.length || 142;
      this.dianKpis.dianApprovalRate = invoices.length ? Number(((approvedCount / invoices.length) * 100).toFixed(1)) : 99.3;

      // Dynamic Top Products
      if (products && products.length > 0) {
        this.topProducts = products.slice(0, 5).map(p => ({
          name: p.name,
          revenue: (p.price || 500000) * (p.salesCount || Math.floor(Math.random() * 50) + 10),
          units: `${p.salesCount || Math.floor(Math.random() * 50) + 10} vendidos`
        }));
      } else {
        this.topProducts = [
          { name: 'MacBook Pro 16" M3 Max', revenue: 48500000, units: '42 vendidos' },
          { name: 'iPhone 15 Pro Max 256GB', revenue: 36200000, units: '68 vendidos' },
          { name: 'Sony WH-1000XM5', revenue: 18450000, units: '124 vendidos' },
          { name: 'iPad Pro 12.9" M2', revenue: 15200000, units: '38 vendidos' },
          { name: 'Monitor Samsung Odyssey G9', revenue: 12400000, units: '19 vendidos' }
        ];
      }

      this.recentReports = [
        {
          id: 'RPT-2026-001',
          name: 'Reporte Consolidado de Ventas PSE & Nequi',
          type: 'Ventas',
          dateRange: '1 - 31 Ene 2026',
          generated: '2026-02-01',
          status: 'ready'
        },
        {
          id: 'RPT-2026-002',
          name: 'Análisis de Clientes y Retención en Cartagena',
          type: 'Clientes',
          dateRange: 'Q4 2025',
          generated: '2026-01-15',
          status: 'ready'
        },
        {
          id: 'RPT-2026-003',
          name: 'Resumen de Stock e Inventario Crítico',
          type: 'Inventario',
          dateRange: 'Enero 2026',
          generated: '2026-01-31',
          status: 'ready'
        },
        {
          id: 'RPT-2026-004',
          name: 'Balance Financiero e Impuestos DIAN (IVA 19%)',
          type: 'Financiero',
          dateRange: '1 - 15 Feb 2026',
          generated: '2026-02-16',
          status: 'ready'
        },
        {
          id: 'RPT-2026-005',
          name: 'Rendimiento de Productos Tecnología & Laptops',
          type: 'Productos',
          dateRange: 'Últimos 90 días',
          generated: '2026-01-20',
          status: 'ready'
        }
      ];
    },

    get filteredInvoices() {
      return this.invoicesList.filter(inv => {
        const matchesSearch = !this.invoiceSearch || 
          inv.id.toLowerCase().includes(this.invoiceSearch.toLowerCase()) ||
          inv.customerName.toLowerCase().includes(this.invoiceSearch.toLowerCase()) ||
          (inv.customerDoc && inv.customerDoc.toLowerCase().includes(this.invoiceSearch.toLowerCase())) ||
          (inv.orderId && inv.orderId.toLowerCase().includes(this.invoiceSearch.toLowerCase()));

        const matchesStatus = this.invoiceFilterStatus === 'all' || inv.status === this.invoiceFilterStatus;
        return matchesSearch && matchesStatus;
      });
    },

    viewDianDetails(invoice) {
      Swal.fire({
        title: `Factura Electrónica ${invoice.id}`,
        html: `
          <div class="text-start small">
            <div class="mb-2 p-2 bg-light rounded border">
              <strong>Estado DIAN:</strong> <span class="badge ${invoice.status === 'approved' ? 'bg-success' : 'bg-warning text-dark'}">${invoice.status === 'approved' ? 'Validación DIAN Exitosa (Aprobada)' : 'En Cola de Validación DIAN'}</span><br>
              <strong>CUFE:</strong> <span class="font-monospace text-break" style="font-size: 0.75rem;">${invoice.cufe}</span><br>
              <strong>Resolución:</strong> <span>${invoice.dianResolution}</span>
            </div>
            <div class="row g-2 mb-2">
              <div class="col-6"><strong>Cliente:</strong> ${invoice.customerName}</div>
              <div class="col-6"><strong>Doc/NIT:</strong> ${invoice.customerDoc}</div>
              <div class="col-6"><strong>Email:</strong> ${invoice.customerEmail}</div>
              <div class="col-6"><strong>Ciudad:</strong> ${invoice.customerCity}</div>
            </div>
            <table class="table table-sm table-bordered mt-3">
              <tr><td>Subtotal Gravable</td><td class="text-end font-monospace">$ ${(invoice.subtotal || 0).toLocaleString('es-CO')} COP</td></tr>
              <tr><td>IVA (19%)</td><td class="text-end font-monospace text-primary">$ ${(invoice.iva || 0).toLocaleString('es-CO')} COP</td></tr>
              <tr class="table-light fw-bold"><td>Total Facturado</td><td class="text-end font-monospace text-success">$ ${(invoice.total || 0).toLocaleString('es-CO')} COP</td></tr>
            </table>
          </div>
        `,
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: '<i class="bi bi-file-earmark-pdf me-1"></i> Descargar PDF',
        cancelButtonText: 'Cerrar',
        confirmButtonColor: '#ff6600'
      }).then((result) => {
        if (result.isConfirmed) {
          this.downloadPdfInvoice(invoice);
        }
      });
    },

    downloadPdfInvoice(invoice) {
      const pdfContent = `
=====================================================
          OMNISTORE CARTAGENA S.A.S.
       NIT: 901.849.201-4  |  Régimen Común
     Cra 3 # 7-15, Bocagrande, Cartagena de Indias
=====================================================
FACTURA ELECTRÓNICA DE VENTA: ${invoice.id}
CUFE: ${invoice.cufe}
Fecha de Emisión: ${invoice.issuedAt}
Resolución DIAN: ${invoice.dianResolution}

DATOS DEL ADQUIRIENTE:
Cliente: ${invoice.customerName}
NIT/CC: ${invoice.customerDoc}
Email: ${invoice.customerEmail}
Ciudad: ${invoice.customerCity}
Pedido Ref: ${invoice.orderId}
Medio de Pago: ${invoice.paymentMethod}

DETALLE ECONÓMICO:
Subtotal: $ ${(invoice.subtotal || 0).toLocaleString('es-CO')} COP
IVA (19%): $ ${(invoice.iva || 0).toLocaleString('es-CO')} COP
TOTAL A PAGAR: $ ${(invoice.total || 0).toLocaleString('es-CO')} COP

DOCUMENTO VALIDADO POR LA DIAN - CÓDIGO QR / FIRMA DIGITAL
      `;
      const blob = new Blob([pdfContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Factura_${invoice.id}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      this.showNotification(`Factura ${invoice.id} descargada exitosamente.`, 'success');
    },

    viewXmlInvoice(invoice) {
      Swal.fire({
        title: `XML UBL 2.1 - ${invoice.id}`,
        html: `
          <div class="text-start">
            <p class="small text-muted mb-2">Archivo XML estándar DIAN con firma digital XAdES-BES y CUFE.</p>
            <textarea class="form-control font-monospace small" rows="8" readonly style="font-size: 0.75rem;">&lt;?xml version="1.0" encoding="UTF-8"?&gt;
&lt;Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"&gt;
  &lt;cbc:UBLVersionID&gt;UBL 2.1&lt;/cbc:UBLVersionID&gt;
  &lt;cbc:CustomizationID&gt;10&lt;/cbc:CustomizationID&gt;
  &lt;cbc:ID&gt;${invoice.id}&lt;/cbc:ID&gt;
  &lt;cbc:UUID schemeName="CUFE-SHA384"&gt;${invoice.cufe}&lt;/cbc:UUID&gt;
  &lt;cbc:IssueDate&gt;${(invoice.issuedAt || '').split(' ')[0]}&lt;/cbc:IssueDate&gt;
  &lt;cac:AccountingSupplierParty&gt;
    &lt;cac:Party&gt;
      &lt;cac:PartyLegalEntity&gt;
        &lt;cbc:RegistrationName&gt;OmniStore Colombia S.A.S.&lt;/cbc:RegistrationName&gt;
        &lt;cbc:CompanyID schemeAgencyID="195"&gt;901.849.201-4&lt;/cbc:CompanyID&gt;
      &lt;/cac:PartyLegalEntity&gt;
    &lt;/cac:Party&gt;
  &lt;/cac:AccountingSupplierParty&gt;
  &lt;cac:AccountingCustomerParty&gt;
    &lt;cac:Party&gt;
      &lt;cac:PartyLegalEntity&gt;
        &lt;cbc:RegistrationName&gt;${invoice.customerName}&lt;/cbc:RegistrationName&gt;
        &lt;cbc:CompanyID&gt;${invoice.customerDoc}&lt;/cbc:CompanyID&gt;
      &lt;/cac:PartyLegalEntity&gt;
    &lt;/cac:Party&gt;
  &lt;/cac:AccountingCustomerParty&gt;
  &lt;cac:LegalMonetaryTotal&gt;
    &lt;cbc:PayableAmount currencyID="COP"&gt;${invoice.total}&lt;/cbc:PayableAmount&gt;
  &lt;/cac:LegalMonetaryTotal&gt;
&lt;/Invoice&gt;</textarea>
          </div>
        `,
        confirmButtonText: 'Cerrar'
      });
    },

    resendToDian(invoice) {
      Swal.fire({
        title: 'Sincronizando con DIAN...',
        text: `Transmitiendo factura ${invoice.id} a los servidores de validación previa DIAN...`,
        icon: 'info',
        timer: 1500,
        showConfirmButton: false
      }).then(() => {
        invoice.status = 'approved';
        this.showNotification(`Factura ${invoice.id} validada y aprobada por la DIAN exitosamente.`, 'success');
      });
    },

    emitNewInvoice() {
      Swal.fire({
        title: 'Emitir Nueva Factura Electrónica',
        html: `
          <div class="text-start">
            <div class="mb-3">
              <label class="form-label small fw-bold">Número de Pedido Asociado</label>
              <input type="text" id="swal-inv-order" class="form-control form-control-sm" placeholder="Ej: ORD-2026-006">
            </div>
            <div class="mb-3">
              <label class="form-label small fw-bold">Razón Social o Nombre del Cliente</label>
              <input type="text" id="swal-inv-name" class="form-control form-control-sm" placeholder="Nombre o Empresa">
            </div>
            <div class="mb-3">
              <label class="form-label small fw-bold">Tipo y Número de Documento (NIT / CC)</label>
              <input type="text" id="swal-inv-doc" class="form-control form-control-sm" placeholder="Ej: NIT 900.123.456-1 o CC 1.090...">
            </div>
            <div class="mb-3">
              <label class="form-label small fw-bold">Valor Total (COP)</label>
              <input type="number" id="swal-inv-amount" class="form-control form-control-sm" placeholder="Ej: 3500000">
            </div>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Emitir y Firmar con DIAN',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#ff6600',
        preConfirm: () => {
          const orderId = document.getElementById('swal-inv-order').value.trim();
          const name = document.getElementById('swal-inv-name').value.trim();
          const doc = document.getElementById('swal-inv-doc').value.trim();
          const amount = parseFloat(document.getElementById('swal-inv-amount').value);

          if (!name || !doc || !amount || amount <= 0) {
            Swal.showValidationMessage('Por favor completa todos los campos con valores válidos.');
            return false;
          }
          return { orderId: orderId || 'ORD-2026-NUEVO', name, doc, amount };
        }
      }).then((result) => {
        if (result.isConfirmed) {
          const { orderId, name, doc, amount } = result.value;
          const subtotal = Math.round(amount / 1.19);
          const iva = amount - subtotal;
          const nextIdNum = this.invoicesList.length + 483;
          const newInvoice = {
            id: `FE-2026-${String(nextIdNum).padStart(5, '0')}`,
            cufe: Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join(''),
            orderId: orderId,
            customerName: name,
            customerDoc: doc,
            customerEmail: 'cliente@ejemplo.co',
            customerCity: 'Cartagena de Indias',
            subtotal: subtotal,
            iva: iva,
            total: amount,
            paymentMethod: 'PSE / Transferencia Electrónica',
            status: 'approved',
            issuedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
            dianResolution: 'Res. DIAN No. 18764000001 (Rango FE-1 a FE-50000)'
          };
          addInvoice(newInvoice);
          this.loadStoreData();
          this.showNotification(`Factura ${newInvoice.id} emitida, firmada digitalmente y validada por la DIAN.`, 'success');
        }
      });
    },

    updateDateRange() {
      this.loadStoreData();
      this.showNotification(`Rango de fecha actualizado a ${this.dateRange}`, 'info');
    },

    updateReportType() {
      this.loadStoreData();
      this.showNotification(`Tipo de reporte: ${this.reportType}`, 'info');
    },

    applyFilters() {
      this.loadStoreData();
      this.showNotification('Filtros aplicados y métricas actualizadas.', 'success');
    },

    scheduleReport() {
      Swal.fire({
        title: 'Programar Envío de Reporte',
        text: 'Se programará un reporte automático enviado a tu correo semanalmente.',
        icon: 'info',
        confirmButtonText: 'Entendido'
      });
    },

    generateReport() {
      Swal.fire({
        title: 'Generando Reporte Completo',
        text: 'Consolidando transacciones, inventario y facturación electrónica...',
        icon: 'info',
        timer: 1500,
        showConfirmButton: false
      }).then(() => {
        this.loadStoreData();
        this.showNotification('Reporte generado exitosamente.', 'success');
      });
    },

    exportData() {
      const fileName = `reporte_${this.reportType}_${Date.now()}.${this.exportFormat}`;
      const exportContent = JSON.stringify({
        kpis: this.kpis,
        dianKpis: this.dianKpis,
        topProducts: this.topProducts,
        invoices: this.invoicesList,
        generatedAt: new Date().toISOString()
      }, null, 2);

      const blob = new Blob([exportContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      this.showNotification(`Exportando archivo ${fileName}...`, 'success');
    },

    refreshReports() {
      this.loadStoreData();
      this.showNotification('Historial de reportes sincronizado.', 'success');
    },

    downloadReport(report) {
      this.showNotification(`Descargando ${report.name}...`, 'success');
    },

    shareReport(report) {
      Swal.fire({
        title: 'Compartir Reporte',
        text: `Enlace seguro generado para: ${report.name}`,
        icon: 'info',
        confirmButtonText: 'Copiar Enlace'
      });
    },

    duplicateReport(report) {
      this.recentReports.unshift({
        ...report,
        id: `RPT-2026-${String(Date.now()).slice(-3)}`,
        name: `${report.name} (Copia)`,
        generated: new Date().toISOString().split('T')[0]
      });
      this.showNotification('Reporte duplicado', 'success');
    },

    deleteReport(reportId) {
      this.recentReports = this.recentReports.filter(r => r.id !== reportId);
      this.showNotification('Reporte eliminado del historial', 'info');
    },

    destroyCharts() {
      Object.keys(this.charts).forEach(key => {
        if (this.charts[key]) {
          try {
            this.charts[key].destroy();
          } catch (e) {
            // ignore
          }
          this.charts[key] = null;
        }
      });
      this.chartsInitialized = false;
    },

    initCharts() {
      this.initRevenueTrendsChart();
      this.initTopProductsChart();
      this.initCustomerAcquisitionChart();
      this.initRegionSalesChart();
      this.chartsInitialized = true;
    },

    initRevenueTrendsChart() {
      const chartElement = document.getElementById('revenueTrendsChart');
      if (!chartElement) return;
      chartElement.innerHTML = '';

      const isDark = isDarkMode();
      const chartData = {
        series: [{
          name: 'Ingresos Totales COP',
          data: [18500000, 24200000, 21800000, 29400000, 34100000, 31200000, 42500000]
        }],
        chart: {
          type: 'area',
          height: 320,
          toolbar: { show: false },
          background: 'transparent',
          fontFamily: 'inherit'
        },
        theme: {
          mode: isDark ? 'dark' : 'light'
        },
        colors: [accent()],
        stroke: {
          curve: 'smooth',
          width: 3
        },
        fill: {
          type: 'gradient',
          gradient: {
            shadeIntensity: 1,
            opacityFrom: isDark ? 0.45 : 0.6,
            opacityTo: 0.05,
            stops: [0, 95, 100]
          }
        },
        dataLabels: { enabled: false },
        grid: {
          borderColor: gridLine(),
          strokeDashArray: 4,
          xaxis: { lines: { show: false } },
          yaxis: { lines: { show: true } }
        },
        xaxis: {
          categories: ['1 Feb', '5 Feb', '10 Feb', '15 Feb', '20 Feb', '25 Feb', 'Hoy'],
          labels: {
            style: { colors: axisInk(), fontSize: '12px' }
          },
          axisBorder: { color: gridLine() },
          axisTicks: { color: gridLine() }
        },
        yaxis: {
          labels: {
            style: { colors: axisInk(), fontSize: '12px' },
            formatter: (val) => '$ ' + (val / 1000000).toFixed(0) + 'M'
          }
        },
        tooltip: {
          theme: isDark ? 'dark' : 'light',
          y: {
            formatter: (val) => '$ ' + Number(val).toLocaleString('es-CO') + ' COP'
          }
        }
      };

      try {
        const chart = new ApexCharts(chartElement, chartData);
        chart.render();
        this.charts.revenueTrends = chart;
      } catch (err) {
        console.error('Error rendering revenue trends chart:', err);
      }
    },

    initTopProductsChart() {
      const chartElement = document.getElementById('topProductsChart');
      if (!chartElement) return;
      chartElement.innerHTML = '';

      const isDark = isDarkMode();
      try {
        const chartData = {
          series: [{
            name: 'Ventas COP',
            data: this.topProducts.map(p => p.revenue)
          }],
          chart: {
            type: 'bar',
            height: 220,
            toolbar: { show: false },
            background: 'transparent',
            fontFamily: 'inherit'
          },
          theme: {
            mode: isDark ? 'dark' : 'light'
          },
          colors: [accent()],
          plotOptions: {
            bar: {
              borderRadius: 4,
              horizontal: true,
              barHeight: '60%'
            }
          },
          grid: {
            borderColor: gridLine(),
            strokeDashArray: 4
          },
          dataLabels: {
            enabled: false
          },
          xaxis: {
            categories: this.topProducts.map(p => p.name.substring(0, 18)),
            labels: {
              style: { colors: axisInk(), fontSize: '11px' },
              formatter: function (val) {
                return "$ " + (val / 1000000).toFixed(0) + "M";
              }
            },
            axisBorder: { color: gridLine() },
            axisTicks: { color: gridLine() }
          },
          yaxis: {
            labels: {
              style: { colors: axisInk(), fontSize: '11px' }
            }
          },
          tooltip: {
            theme: isDark ? 'dark' : 'light',
            y: {
              formatter: function (val) {
                return "$ " + Number(val).toLocaleString('es-CO') + " COP";
              }
            }
          }
        };

        const chart = new ApexCharts(chartElement, chartData);
        chart.render();
        this.charts.topProducts = chart;
      } catch (error) {
        console.error('Error rendering top products chart:', error);
      }
    },

    initCustomerAcquisitionChart() {
      const chartElement = document.getElementById('customerAcquisitionChart');
      if (!chartElement) return;
      chartElement.innerHTML = '';

      const isDark = isDarkMode();
      try {
        const chartData = {
          series: [{
            name: 'Nuevos Compradores',
            data: [23, 31, 45, 38, 52, 41, 67]
          }, {
            name: 'Clientes Recurrentes',
            data: [67, 58, 72, 83, 76, 89, 94]
          }],
          chart: {
            type: 'bar',
            height: 250,
            width: '100%',
            stacked: true,
            toolbar: { show: false },
            background: 'transparent',
            fontFamily: 'inherit'
          },
          theme: {
            mode: isDark ? 'dark' : 'light'
          },
          colors: [accent(), isDark ? '#38bdf8' : '#0ea5e9'],
          plotOptions: {
            bar: {
              horizontal: false,
              columnWidth: '55%',
              borderRadius: 4
            }
          },
          grid: {
            borderColor: gridLine(),
            strokeDashArray: 4
          },
          dataLabels: { enabled: false },
          xaxis: {
            categories: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
            labels: {
              style: { colors: axisInk(), fontSize: '12px' }
            },
            axisBorder: { color: gridLine() },
            axisTicks: { color: gridLine() }
          },
          yaxis: {
            labels: {
              style: { colors: axisInk(), fontSize: '12px' }
            },
            title: {
              text: 'Compradores',
              style: { color: axisInk(), fontWeight: 500 }
            }
          },
          legend: {
            position: 'top',
            labels: { colors: axisInk() }
          },
          tooltip: {
            theme: isDark ? 'dark' : 'light'
          }
        };

        const chart = new ApexCharts(chartElement, chartData);
        chart.render();
        this.charts.customerAcquisition = chart;
      } catch (error) {
        console.error('Error rendering customer acquisition chart:', error);
      }
    },

    initRegionSalesChart() {
      const chartElement = document.getElementById('regionSalesChart');
      if (!chartElement) return;
      chartElement.innerHTML = '';

      const isDark = isDarkMode();
      try {
        const chartData = {
          series: [{
            name: 'Ventas (Millones COP)',
            data: [64, 48, 35, 28, 18, 14]
          }],
          chart: {
            type: 'radar',
            height: 250,
            width: '100%',
            toolbar: { show: false },
            background: 'transparent',
            fontFamily: 'inherit'
          },
          theme: {
            mode: isDark ? 'dark' : 'light'
          },
          colors: [accent()],
          xaxis: {
            categories: ['Bocagrande', 'Manga', 'Crespo', 'Centro Histórico', 'El Bosque', 'Turbaco'],
            labels: {
              style: { colors: [axisInk(), axisInk(), axisInk(), axisInk(), axisInk(), axisInk()], fontSize: '11px' }
            }
          },
          yaxis: {
            show: false,
            tickAmount: 4
          },
          markers: {
            size: 4,
            colors: [accent()],
            strokeColors: surfacePanel(),
            strokeWidth: 2
          },
          tooltip: {
            theme: isDark ? 'dark' : 'light'
          }
        };

        const chart = new ApexCharts(chartElement, chartData);
        chart.render();
        this.charts.regionSales = chart;
      } catch (error) {
        console.error('Error rendering region sales chart:', error);
      }
    },

    updateCharts() {
      this.destroyCharts();
      this.initCharts();
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

  Alpine.data('searchComponent', createSearchComponent({ getResults: () => [] }));
});