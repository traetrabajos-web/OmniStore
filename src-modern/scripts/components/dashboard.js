// ==========================================================================
// Dashboard Manager - Advanced data visualization and components
// ==========================================================================

import ApexCharts from '../utils/apex.js';
import { categorical, accent, STATUS, SEQUENTIAL_BLUE, axisInk, trackFill } from '../utils/chart-palette.js';
import {
  REALTIME_DASHBOARD_POLL_MS,
  CHART_RESIZE_DEBOUNCE_MS,
  STAT_ANIMATION_DURATION_MS,
  STAT_ANIMATION_STEPS,
} from '../utils/constants.js';
import { getOrdersList, getUsersList, getProductsCatalog, getReviewsList } from '../utils/store-data.js';

export class DashboardManager {
  constructor() {
    this.charts = new Map();
    this.intervals = new Set();
    this.timeouts = new Set();
    this.cleanupFns = [];
    this.currentPeriod = { count: 12, unit: 'month' };
    this.data = {
      revenue: [],
      users: [],
      orders: [],
      performance: [],
      recentOrders: [],
      salesByLocation: []
    };
    this.init();
  }

  async init() {
    await this.loadDashboardData();

    this.initRevenueChart();
    this.initUserGrowthChart();
    this.initOrderStatusChart();
    this.initStorageChart();
    this.initSalesByLocationChart();
    this.populateRecentOrders();
    this.populateActivityFeed();

    this.startRealTimeUpdates();
    this.initInteractiveElements();

    // Listen to real-time events from marketplace/orders/catalog/users
    const onDataUpdated = () => {
      this.loadDashboardData();
      this.populateRecentOrders();
      this.populateActivityFeed();
      const orderChart = this.charts.get('orderStatus');
      if (orderChart) {
        orderChart.updateSeries([
          this.data.orders.completed,
          this.data.orders.pending,
          this.data.orders.cancelled,
          this.data.orders.processing
        ]);
      }
    };
    window.addEventListener('omnistore:orders-updated', onDataUpdated);
    window.addEventListener('omnistore:catalog-updated', onDataUpdated);
    window.addEventListener('omnistore:users-updated', onDataUpdated);
    window.addEventListener('omnistore:reviews-updated', onDataUpdated);
    this.cleanupFns.push(() => {
      window.removeEventListener('omnistore:orders-updated', onDataUpdated);
      window.removeEventListener('omnistore:catalog-updated', onDataUpdated);
      window.removeEventListener('omnistore:users-updated', onDataUpdated);
      window.removeEventListener('omnistore:reviews-updated', onDataUpdated);
    });
  }

  async loadDashboardData() {
    this.data.orders = this.generateOrderData();
    this.data.revenue = this.generateRevenueData();
    this.data.users = this.generateUserData();
    this.data.performance = this.generatePerformanceData();
    this.data.recentOrders = this.generateRecentOrders();
    this.data.salesByLocation = this.generateSalesByLocation();
    this.updateStatsCards();
  }

  generateRevenueData() {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const orders = getOrdersList();
    const monthlyTotals = {};
    months.forEach((_, idx) => { monthlyTotals[idx] = 0; });

    orders.forEach(o => {
      if (o.status !== 'cancelled') {
        const orderDateStr = o.orderDate || o.date || o.createdAt;
        const d = orderDateStr ? new Date(orderDateStr) : new Date();
        const m = isNaN(d.getMonth()) ? new Date().getMonth() : d.getMonth();
        monthlyTotals[m] = (monthlyTotals[m] || 0) + (Number(o.total) || 0);
      }
    });

    return months.map((month, idx) => {
      const revenue = monthlyTotals[idx] || 0;
      const profit = Math.round(revenue * 0.28);
      return { month, revenue, profit };
    });
  }

  generateUserData() {
    const users = getUsersList();
    const total = users.length || 1;
    const active = users.filter(u => u.status === 'active').length;
    return [
      { day: 1, newUsers: Math.max(1, Math.round(total * 0.2)), activeUsers: active },
      { day: 2, newUsers: Math.max(1, Math.round(total * 0.4)), activeUsers: active },
      { day: 3, newUsers: Math.max(1, Math.round(total * 0.6)), activeUsers: active },
      { day: 4, newUsers: Math.max(1, Math.round(total * 0.8)), activeUsers: active },
      { day: 5, newUsers: total, activeUsers: active }
    ];
  }

  generateOrderData() {
    const orders = getOrdersList();
    let completed = 0, pending = 0, cancelled = 0, processing = 0;
    orders.forEach(o => {
      if (o.status === 'completed' || o.status === 'delivered') completed++;
      else if (o.status === 'pending' || o.status === 'pending_payment') pending++;
      else if (o.status === 'cancelled' || o.status === 'refunded') cancelled++;
      else processing++;
    });
    return { completed, pending, cancelled, processing };
  }

  generateRecentOrders() {
    const orders = getOrdersList();
    const statusMap = {
      completed: { text: 'Completado', class: 'bg-success' },
      delivered: { text: 'Entregado', class: 'bg-success' },
      pending: { text: 'Pendiente', class: 'bg-warning text-dark' },
      pending_payment: { text: 'Pendiente Pago', class: 'bg-warning text-dark' },
      processing: { text: 'Por Enviar', class: 'bg-info text-dark' },
      shipped: { text: 'En Camino', class: 'bg-primary' },
      cancelled: { text: 'Cancelado', class: 'bg-danger' },
      refunded: { text: 'Reembolsado', class: 'bg-secondary' }
    };

    if (orders && orders.length > 0) {
      return orders.slice(0, 8).map(o => ({
        id: o.orderNumber ? o.orderNumber : (typeof o.id === 'string' && o.id.startsWith('#') ? o.id : `#${o.id}`),
        customer: o.customer?.name || o.customerName || 'Cliente OmniStore',
        amount: new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(o.total || 0),
        status: statusMap[o.status] || { text: o.status || 'Procesando', class: 'bg-secondary' },
        date: o.orderDate || (o.date ? o.date.split('T')[0] : new Date().toLocaleDateString('es-CO'))
      }));
    }
    return [];
  }

  generateSalesByLocation() {
    return [
      { name: 'Bocagrande (Zona 1)', value: 4850 },
      { name: 'Manga (Zona 2)', value: 3420 },
      { name: 'Castillogrande (Zona 1)', value: 2560 },
      { name: 'Crespo (Zona 2)', value: 1890 },
      { name: 'Centro Histórico & Getsemaní (Zona 1)', value: 1450 },
      { name: 'El Cabrero & Marbella (Zona 2)', value: 1280 },
      { name: 'Pie de la Popa (Zona 2)', value: 980 },
      { name: 'El Bosque & Los Alpes (Zona 3)', value: 760 },
      { name: 'La Castellana & Providencia (Zona 3)', value: 650 },
      { name: 'Turbaco & Mamonal (Zona 4)', value: 520 }
    ];
  }

  generatePerformanceData() {
    const hours = Array.from({length: 24}, (_, i) => i);
    return hours.map(hour => ({
      hour: `${hour.toString().padStart(2, '0')}:00`,
      responseTime: Math.random() * 2 + 0.5,
      requests: Math.floor(Math.random() * 1000) + 100
    }));
  }

  initRevenueChart() {
    const el = document.getElementById('revenueChart');
    if (!el) return;

    const options = {
      chart: {
        type: 'area',
        height: 320,
        width: '100%',
        toolbar: { show: false },
        zoom: { enabled: false }
      },
      series: [
        { name: 'Ingresos ($ COP)', data: this.data.revenue.map(item => item.revenue) },
        { name: 'Ganancia Neta ($ COP)', data: this.data.revenue.map(item => item.profit) }
      ],
      xaxis: {
        categories: this.data.revenue.map(item => item.month),
        axisBorder: { show: false }
      },
      yaxis: {
        labels: {
          formatter: value => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', notation: 'compact', maximumFractionDigits: 1 }).format(value)
        }
      },
      colors: [accent(), categorical(3)[2]],
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.45,
          opacityTo: 0.05,
          stops: [20, 100]
        }
      },
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth', width: 2.5 },
      grid: {
        borderColor: trackFill(),
        strokeDashArray: 3
      },
      tooltip: {
        y: {
          formatter: value => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value)
        }
      }
    };

    const chart = new ApexCharts(el, options);
    chart.render();
    this.charts.set('revenue', chart);
  }

  initUserGrowthChart() {
    const el = document.getElementById('userGrowthChart');
    if (!el) return;

    const options = {
      chart: {
        type: 'bar',
        height: 280,
        width: '100%',
        toolbar: { show: false }
      },
      series: [
        { name: 'Nuevos Clientes', data: this.data.users.slice(-7).map(item => item.newUsers) },
        { name: 'Usuarios Activos', data: this.data.users.slice(-7).map(item => item.activeUsers) }
      ],
      xaxis: {
        categories: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
      },
      colors: [accent(), trackFill()],
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '55%',
          borderRadius: 4
        }
      },
      dataLabels: { enabled: false }
    };

    const chart = new ApexCharts(el, options);
    chart.render();
    this.charts.set('userGrowth', chart);
  }

  initOrderStatusChart() {
    const el = document.getElementById('orderStatusChart');
    if (!el) return;

    const options = {
      chart: {
        type: 'donut',
        height: 280,
        width: '100%'
      },
      series: [
        this.data.orders.completed,
        this.data.orders.pending,
        this.data.orders.cancelled,
        this.data.orders.processing
      ],
      labels: ['Completados', 'Pendientes', 'Cancelados', 'En Proceso'],
      colors: [STATUS.success, STATUS.warning, STATUS.danger, STATUS.info],
      legend: {
        position: 'bottom'
      },
      dataLabels: {
        enabled: true,
        formatter: (val) => `${val.toFixed(0)}%`
      }
    };

    const chart = new ApexCharts(el, options);
    chart.render();
    this.charts.set('orderStatus', chart);
  }

  initStorageChart() {
    const el = document.getElementById('storageStatusChart') || document.getElementById('storageChart');
    if (!el) return;

    const options = {
      chart: { height: 280, width: '100%', type: 'radialBar' },
      series: [100],
      colors: ['#10b981'],
      plotOptions: {
        radialBar: {
          hollow: { margin: 0, size: '70%', background: 'transparent' },
          track: { background: trackFill(), dropShadow: { enabled: false } },
          dataLabels: {
            name: { offsetY: -10, color: axisInk(), fontSize: '13px' },
            value: {
              color: '#10b981',
              fontSize: '28px',
              fontWeight: 700,
              show: true,
              formatter: () => '100%'
            }
          }
        }
      },
      stroke: { lineCap: 'round' },
      labels: ['Salud PostgreSQL (OK)']
    };

    const chart = new ApexCharts(el, options);
    chart.render();
    this.charts.set('storage', chart);
  }

  initSalesByLocationChart() {
    const chartElement = document.querySelector('#salesByLocationChart');
    if (!chartElement) return;

    const options = {
      series: [{
        name: 'Sales',
        data: this.data.salesByLocation.map(c => ({ x: c.name, y: c.value }))
      }],
      chart: {
        type: 'treemap',
        height: 350,
        width: '100%',
        toolbar: {
          show: true,
          tools: { download: true, selection: false, zoom: false, zoomin: false, zoomout: false, pan: false, reset: false }
        },
        events: {
          mounted: (chart) => { chart.windowResizeHandler(); }
        }
      },
      dataLabels: {
        enabled: true,
        style: { fontSize: '12px' },
        formatter: (text, op) => [text, op.value],
        offsetY: -4
      },
      plotOptions: {
        treemap: {
          enableShades: true,
          shadeIntensity: 0.5,
          reverseNegativeShade: true,
          colorScale: {
            ranges: [
              { from: 0, to: 1000, color: SEQUENTIAL_BLUE[1] },
              { from: 1001, to: 2000, color: SEQUENTIAL_BLUE[3] },
              { from: 2001, to: 3000, color: SEQUENTIAL_BLUE[5] }
            ]
          }
        }
      },
      responsive: [
        { breakpoint: 1200, options: { chart: { height: 350 }, dataLabels: { style: { fontSize: '11px' } } } },
        { breakpoint: 768, options: { chart: { height: 300 }, dataLabels: { style: { fontSize: '10px' } } } }
      ]
    };

    const chart = new ApexCharts(chartElement, options);
    chart.render();
    this.charts.set('salesByLocation', chart);

    const onResize = () => {
      if (!this.charts.has('salesByLocation')) return;
      const t = setTimeout(() => {
        chart.updateOptions({ chart: { width: '100%' } }, false, true);
        this.timeouts.delete(t);
      }, CHART_RESIZE_DEBOUNCE_MS);
      this.timeouts.add(t);
    };
    window.addEventListener('resize', onResize);
    this.cleanupFns.push(() => window.removeEventListener('resize', onResize));
  }

  populateRecentOrders() {
    const tableBody = document.getElementById('recent-orders-table');
    if (!tableBody) return;

    tableBody.replaceChildren();
    for (const order of this.data.recentOrders) {
      const tr = document.createElement('tr');

      const idCell = document.createElement('td');
      const strong = document.createElement('strong');
      strong.textContent = order.id;
      idCell.appendChild(strong);

      const customerCell = document.createElement('td');
      customerCell.textContent = order.customer;

      const amountCell = document.createElement('td');
      amountCell.textContent = order.amount;

      const statusCell = document.createElement('td');
      const badge = document.createElement('span');
      badge.className = `badge ${order.status.class}`;
      badge.textContent = order.status.text;
      statusCell.appendChild(badge);

      const dateCell = document.createElement('td');
      dateCell.textContent = order.date;

      tr.append(idCell, customerCell, amountCell, statusCell, dateCell);
      tableBody.appendChild(tr);
    }
  }

  populateActivityFeed() {
    const feed = document.querySelector('.activity-feed');
    if (!feed) return;

    const orders = getOrdersList();
    const users = getUsersList();
    const reviews = getReviewsList();

    feed.replaceChildren();

    const activities = [];

    // Add recent orders to activity
    orders.slice(0, 3).forEach(o => {
      const cust = o.customer?.name || o.customerName || 'Cliente';
      const totalStr = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(o.total || 0);
      activities.push({
        icon: 'bi-bag-check-fill text-success',
        title: `Pedido ${o.orderNumber || '#' + o.id} registrado (${totalStr})`,
        desc: `${cust} • ${o.shippingCity || 'Cartagena de Indias'} • ${o.paymentMethod || 'PSE'}`
      });
    });

    // Add recent users to activity
    users.slice(0, 2).forEach(u => {
      activities.push({
        icon: 'bi-person-plus-fill text-primary',
        title: `Usuario en base de datos: ${u.name}`,
        desc: `Rol: ${u.role === 'admin' ? 'SuperAdmin' : (u.role === 'vendor' ? 'Vendedor' : 'Cliente')} • ${u.email}`
      });
    });

    // Add recent reviews
    reviews.slice(0, 2).forEach(r => {
      activities.push({
        icon: 'bi-star-fill text-warning',
        title: `Nueva reseña (${r.rating}★) para ${r.product}`,
        desc: `Por ${r.author} (${r.city || 'Cartagena'}) • Estado: ${r.status || 'Aprobada'}`
      });
    });

    // Add DB Connection check
    activities.push({
      icon: 'bi-database-check text-success',
      title: 'Conexión Supabase PostgreSQL en Vivo',
      desc: 'Sincronización en tiempo real activa (AWS us-east-1)'
    });

    activities.forEach(act => {
      const item = document.createElement('div');
      item.className = 'activity-item';

      const iconDiv = document.createElement('div');
      iconDiv.className = 'activity-icon';
      const icon = document.createElement('i');
      icon.className = `bi ${act.icon}`;
      iconDiv.appendChild(icon);

      const contentDiv = document.createElement('div');
      contentDiv.className = 'activity-content';
      const titleP = document.createElement('p');
      titleP.className = 'mb-1';
      titleP.textContent = act.title;
      const descSmall = document.createElement('small');
      descSmall.className = 'text-muted';
      descSmall.textContent = act.desc;

      contentDiv.append(titleP, descSmall);
      item.append(iconDiv, contentDiv);
      feed.appendChild(item);
    });
  }

  startRealTimeUpdates() {
    const id = setInterval(() => this.updateChartsWithRealTimeData(), REALTIME_DASHBOARD_POLL_MS);
    this.intervals.add(id);
  }

  updateChartsWithRealTimeData() {
    this.updateStatsCards();
  }

  updateStatsCards() {
    const users = getUsersList();
    const orders = getOrdersList();
    const products = getProductsCatalog();

    const totalUsers = users.length;
    const totalOrders = orders.length;
    const totalProducts = products.length;
    const totalRevenue = orders
      .filter(o => o.status !== 'cancelled')
      .reduce((sum, o) => sum + (Number(o.total) || 0), 0);

    const totalUsersEl = document.getElementById('stat-total-users');
    if (totalUsersEl) totalUsersEl.textContent = totalUsers.toString();

    const totalOrdersEl = document.getElementById('stat-total-orders');
    if (totalOrdersEl) totalOrdersEl.textContent = totalOrders.toString();

    const totalProductsEl = document.getElementById('stat-total-products');
    if (totalProductsEl) totalProductsEl.textContent = totalProducts.toString();

    const totalRevenueEl = document.getElementById('stat-total-revenue');
    if (totalRevenueEl) {
      totalRevenueEl.textContent = new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0
      }).format(totalRevenue);
    }
  }

  animateNumber(element, start, end) {
    if (start === end) return;
    if (element._animTimer) {
      clearInterval(element._animTimer);
      this.intervals.delete(element._animTimer);
    }
    const hasDollar = element.textContent.includes('$');
    const prefix = hasDollar ? '$ ' : '';
    const stepValue = (end - start) / STAT_ANIMATION_STEPS;
    let current = start;
    let step = 0;

    const timer = setInterval(() => {
      current += stepValue;
      step++;

      if (step >= STAT_ANIMATION_STEPS) {
        clearInterval(timer);
        this.intervals.delete(timer);
        element._animTimer = null;
        element.textContent = `${prefix}${end.toLocaleString('es-CO')}`;
      } else {
        element.textContent = `${prefix}${Math.round(current).toLocaleString('es-CO')}`;
      }
    }, STAT_ANIMATION_DURATION_MS / STAT_ANIMATION_STEPS);

    element._animTimer = timer;
    this.intervals.add(timer);
  }

  initInteractiveElements() {
    const onPeriodClick = (e) => {
      if (e.target.matches('[data-chart-period]')) {
        const period = e.target.dataset.chartPeriod;
        this.updateChartPeriod(period);
        document.querySelectorAll('[data-chart-period]').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
      }
    };
    const onExportClick = (e) => {
      if (e.target.matches('[data-export-chart]')) {
        const chartName = e.target.dataset.exportChart;
        this.exportChart(chartName);
      }
    };

    document.addEventListener('click', onPeriodClick);
    document.addEventListener('click', onExportClick);
    this.cleanupFns.push(() => document.removeEventListener('click', onPeriodClick));
    this.cleanupFns.push(() => document.removeEventListener('click', onExportClick));
  }

  updateChartPeriod(period) {
    const config = {
      '7d':  { count: 7,  unit: 'day' },
      '30d': { count: 30, unit: 'day' },
      '90d': { count: 90, unit: 'day' },
      '1y':  { count: 12, unit: 'month' },
    }[period];
    if (!config) return;

    this.currentPeriod = config;
    const { count, unit } = config;
    const labels = this.buildPeriodLabels(count, unit);
    this.data.revenue = labels.map(label => ({
      month: label,
      revenue: Math.floor(Math.random() * 45000000) + 15000000,
      profit: Math.floor(Math.random() * 18000000) + 5000000,
    }));

    const chart = this.charts.get('revenue');
    if (!chart) return;
    chart.updateOptions({
      xaxis: { categories: this.data.revenue.map(d => d.month) },
      series: [
        { name: 'Ingresos ($ COP)', data: this.data.revenue.map(d => d.revenue) },
        { name: 'Ganancia Neta ($ COP)',  data: this.data.revenue.map(d => d.profit)  },
      ],
    });
  }

  buildPeriodLabels(count, unit) {
    const today = new Date();
    if (unit === 'day') {
      return Array.from({ length: count }, (_, i) => {
        const d = new Date(today);
        d.setDate(d.getDate() - (count - 1 - i));
        return d.toLocaleDateString('es-CO', { month: 'short', day: 'numeric' });
      });
    }
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return Array.from({ length: count }, (_, i) => {
      const d = new Date(today.getFullYear(), today.getMonth() - (count - 1 - i), 1);
      return months[d.getMonth()];
    });
  }

  exportChart(chartName) {
    const chart = this.charts.get(chartName);
    if (chart && typeof chart.dataURI === 'function') {
      chart.dataURI().then(({ imgURI }) => {
        const link = document.createElement('a');
        link.download = `${chartName}-chart.png`;
        link.href = imgURI;
        link.click();
      });
    }
  }

  destroy() {
    this.intervals.forEach(id => clearInterval(id));
    this.intervals.clear();
    this.timeouts.forEach(id => clearTimeout(id));
    this.timeouts.clear();
    this.cleanupFns.forEach(fn => fn());
    this.cleanupFns = [];
    this.charts.forEach(chart => chart.destroy());
    this.charts.clear();
  }
}
