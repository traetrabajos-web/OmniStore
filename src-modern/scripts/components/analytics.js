import Alpine from 'alpinejs';
import ApexCharts from '../utils/apex.js';
import { categorical, axisInk, gridLine, onFillInk, SEQUENTIAL_BLUE } from '../utils/chart-palette.js';
import { REALTIME_FAST_POLL_MS } from '../utils/constants.js';

document.addEventListener('alpine:init', () => {
  Alpine.data('analyticsComponent', () => ({
    // Core data in COP ($ Pesos Colombianos)
    metrics: {
        revenue: 148950000,
        visitors: 45672,
        conversionRate: 4.85,
        bounceRate: 21.3
    },
    
    // Real-time data
    realTimeUsers: 1420,
    pageViews: 12450,
    sessions: 3820,
    
    // Chart instances
    charts: {},
    
    // Traffic sources data
    trafficSources: [
        { name: 'Búsqueda Orgánica (Google Colombia)', percentage: 42.3, visitors: 19314, color: categorical(3)[0] },
        { name: 'Tráfico Directo (OmniStore.co)', percentage: 31.8, visitors: 14519, color: categorical(3)[1] },
        { name: 'Redes Sociales (Instagram / TikTok)', percentage: 16.4, visitors: 7490, color: categorical(3)[2] },
        { name: 'Campañas WhatsApp / Referidos', percentage: 9.5, visitors: 4349, color: categorical(4)[3] }
    ],
    
    // Top pages data
    topPages: [
        { path: '/marketplace.html', title: 'Marketplace Tienda Virtual', views: 24890, uniqueViews: 18450, avgTime: '5m 12s', bounceRate: 19.4, conversion: 9.8 },
        { path: '/products.html', title: 'Catálogo de Productos Tech', views: 14320, uniqueViews: 10240, avgTime: '4m 05s', bounceRate: 28.1, conversion: 8.2 },
        { path: '/orders.html', title: 'Gestión de Pedidos & Ventas', views: 8940, uniqueViews: 6510, avgTime: '6m 30s', bounceRate: 14.2, conversion: 14.5 },
        { path: '/index.html', title: 'Dashboard General Admin', views: 7650, uniqueViews: 5120, avgTime: '8m 45s', bounceRate: 11.0, conversion: 22.4 },
        { path: '/checkout', title: 'Pasarela de Pago PSE / Nequi', views: 5410, uniqueViews: 4890, avgTime: '2m 15s', bounceRate: 12.8, conversion: 78.5 }
    ],
    
    // Geographic data (Cartagena Zones)
    geographicData: [
        { name: 'Bocagrande, Castillogrande & Laguito (Zona 1)', code: 'Z1', percentage: 41.5, visitors: 18954 },
        { name: 'Manga, Crespo, Marbella & Cabrero (Zona 2)', code: 'Z2', percentage: 25.8, visitors: 11783 },
        { name: 'Centro Histórico & Getsemaní (Zona 1)', code: 'Z1B', percentage: 15.2, visitors: 6942 },
        { name: 'El Bosque, Los Alpes & La Castellana (Zona 3)', code: 'Z3', percentage: 10.1, visitors: 4612 },
        { name: 'Turbaco, Mamonal & Pasacaballos (Zona 4)', code: 'Z4', percentage: 7.4, visitors: 3381 }
    ],
    
    // Device data
    deviceData: [
        { type: 'Computador Escritorio', percentage: 58.4, users: 26672, icon: 'laptop', color: 'primary' },
        { type: 'Teléfono Móvil (Smartphones)', percentage: 36.8, users: 16807, icon: 'phone', color: 'success' },
        { type: 'Tablets / iPads', percentage: 4.8, users: 2193, icon: 'tablet', color: 'warning' }
    ],
    
    // Cleanup tracking
    _intervals: new Set(),
    _resizeHandler: null,

    // Initialize component
    init() {
        this.$nextTick(() => {
            this.initCharts();
            this.startRealTimeUpdates();
            this.initPeriodSelectors();
        });
        const onHide = () => this.destroy();
        window.addEventListener('pagehide', onHide, { once: true });
    },

    // Build x-axis labels for `count` periods of `unit` ('day', 'week', or 'month')
    buildLabels(count, unit) {
        const today = new Date();
        if (unit === 'day') {
            return Array.from({ length: count }, (_, i) => {
                const d = new Date(today);
                d.setDate(d.getDate() - (count - 1 - i));
                return count <= 7
                    ? d.toLocaleDateString('es-CO', { weekday: 'short' })
                    : d.toLocaleDateString('es-CO', { month: 'short', day: 'numeric' });
            });
        }
        if (unit === 'week') {
            return Array.from({ length: count }, (_, i) => `Sem ${i + 1}`);
        }
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        return Array.from({ length: count }, (_, i) => {
            const d = new Date(today.getFullYear(), today.getMonth() - (count - 1 - i), 1);
            return months[d.getMonth()];
        });
    },

    // Generate revenue + profit series of `count` points in millions of COP
    generateRevenueSeries(count) {
        return {
            revenue: Array.from({ length: count }, () => Math.floor(Math.random() * 8000000) + 7000000),
            profit:  Array.from({ length: count }, () => Math.floor(Math.random() * 4000000) + 2500000),
        };
    },

    // Update revenue chart for a given period count + unit ('day' or 'month')
    applyRevenuePeriod(count, unit) {
        if (!this.charts.revenue) return;
        const { revenue, profit } = this.generateRevenueSeries(count);
        this.charts.revenue.updateOptions({
            xaxis: { categories: this.buildLabels(count, unit) },
            series: [
                { name: 'Ventas Totales (COP)', data: revenue },
                { name: 'Ganancia Neta (COP)',  data: profit  },
            ],
        });
    },

    // Wire up the page-level dateRange (Hoy / 7D / 30D / 90D) and the
    // per-chart revenueView (Diario / Semanal / Mensual) selectors.
    initPeriodSelectors() {
        const dateRangeMap = { today: 1, week: 7, month: 30, quarter: 90 };
        document.querySelectorAll('input[name="dateRange"]').forEach(input => {
            input.addEventListener('change', (e) => {
                const count = dateRangeMap[e.target.id];
                if (count) this.applyRevenuePeriod(count, 'day');
            });
        });

        const revenueViewMap = {
            'revenue-daily':   { count: 30, unit: 'day'   },
            'revenue-weekly':  { count: 12, unit: 'week'  },
            'revenue-monthly': { count: 12, unit: 'month' },
        };
        document.querySelectorAll('input[name="revenueView"]').forEach(input => {
            input.addEventListener('change', (e) => {
                const cfg = revenueViewMap[e.target.id];
                if (cfg) this.applyRevenuePeriod(cfg.count, cfg.unit);
            });
        });
    },

    destroy() {
        this._intervals.forEach(id => clearInterval(id));
        this._intervals.clear();
        if (this._resizeHandler) {
            window.removeEventListener('resize', this._resizeHandler);
            this._resizeHandler = null;
        }
        this.clearExistingCharts();
    },
    
    // Clear existing charts to prevent duplicates
    clearExistingCharts() {
        Object.keys(this.charts).forEach(chartKey => {
            if (this.charts[chartKey] && this.charts[chartKey].destroy) {
                this.charts[chartKey].destroy();
            }
        });
        this.charts = {};
    },
    
    // Initialize all charts
    initCharts() {
        this.clearExistingCharts();
        
        this.initRevenueChart();
        this.initTrafficSourcesChart();
        this.initBehaviorChart();
        this.initRealTimeChart();
        this.initBrowserChart();
    },
    
    // Revenue analytics chart
    initRevenueChart() {
        const revenueOptions = {
            series: [{
                name: 'Ingresos Totales (COP)',
                data: [8200000, 9100000, 7800000, 10200000, 11500000, 9800000, 12400000, 11200000, 10800000, 13200000, 12100000, 14200000, 13800000, 15100000]
            }, {
                name: 'Margen de Ganancia (COP)',
                data: [3100000, 3800000, 2900000, 4200000, 4800000, 3900000, 5200000, 4600000, 4200000, 5800000, 5100000, 6200000, 5900000, 6800000]
            }],
            chart: {
                height: 350,
                width: '100%',
                type: 'area',
                toolbar: {
                    show: false
                },
                zoom: {
                    enabled: false
                },
                sparkline: {
                    enabled: false
                },
                redrawOnParentResize: true,
                redrawOnWindowResize: true
            },
            responsive: [{
                breakpoint: 1200,
                options: {
                    chart: {
                        height: 300
                    },
                    legend: {
                        position: 'bottom',
                        horizontalAlign: 'center'
                    }
                }
            }, {
                breakpoint: 768,
                options: {
                    chart: {
                        height: 250
                    },
                    xaxis: {
                        labels: {
                            rotate: -45,
                            rotateAlways: true
                        }
                    }
                }
            }],
            dataLabels: {
                enabled: false
            },
            stroke: {
                curve: 'smooth',
                width: 2
            },
            colors: categorical(2),
            fill: {
                type: 'gradient',
                gradient: {
                    shadeIntensity: 1,
                    opacityFrom: 0.4,
                    opacityTo: 0.1,
                    stops: [0, 90, 100]
                }
            },
            xaxis: {
                categories: ['1 Ene', '3 Ene', '5 Ene', '7 Ene', '9 Ene', '11 Ene', '13 Ene', '15 Ene', '17 Ene', '19 Ene', '21 Ene', '23 Ene', '25 Ene', '27 Ene'],
                labels: {
                    style: {
                        fontSize: '12px',
                        colors: axisInk()
                    }
                }
            },
            yaxis: {
                labels: {
                    formatter: function (val) {
                        return '$ ' + (val / 1000000).toFixed(1) + 'M COP';
                    },
                    style: {
                        fontSize: '12px',
                        colors: axisInk()
                    }
                }
            },
            grid: {
                borderColor: gridLine(),
                strokeDashArray: 3
            },
            legend: {
                position: 'top',
                horizontalAlign: 'right',
                fontSize: '12px'
            },
            tooltip: {
                y: {
                    formatter: function (val) {
                        return '$ ' + val.toLocaleString('es-CO') + ' COP';
                    }
                }
            }
        };

        const chartElement = document.querySelector("#revenueChart");
        if (chartElement) {
            if (this.charts.revenue) {
                this.charts.revenue.destroy();
            }

            this.charts.revenue = new ApexCharts(chartElement, revenueOptions);
            this.charts.revenue.render();

            if (this._resizeHandler) {
                window.removeEventListener('resize', this._resizeHandler);
            }
            this._resizeHandler = () => {
                if (this.charts.revenue) {
                    this.charts.revenue.updateOptions({ chart: { width: '100%' } });
                }
            };
            window.addEventListener('resize', this._resizeHandler);
        }
    },
    
    // Traffic sources pie chart
    initTrafficSourcesChart() {
        const trafficOptions = {
            series: this.trafficSources.map(source => source.percentage),
            chart: {
                width: '100%',
                height: 200,
                type: 'donut'
            },
            labels: this.trafficSources.map(source => source.name),
            colors: this.trafficSources.map(source => source.color),
            plotOptions: {
                pie: {
                    donut: {
                        size: '60%'
                    }
                }
            },
            legend: {
                show: false
            },
            dataLabels: {
                enabled: false
            },
            tooltip: {
                y: {
                    formatter: function (val, { seriesIndex }) {
                        const source = this.trafficSources[seriesIndex];
                        return `${val.toFixed(1)}% (${source.visitors.toLocaleString('es-CO')} visitas)`;
                    }.bind(this)
                }
            }
        };
        
        const el = document.querySelector("#trafficSourcesChart");
        if (el) {
            this.charts.trafficSources = new ApexCharts(el, trafficOptions);
            this.charts.trafficSources.render();
        }
    },
    
    // User behavior funnel chart
    initBehaviorChart() {
        const behaviorOptions = {
            series: [{
                name: 'Usuarios',
                data: [45672, 32148, 18934, 12567, 8234, 4512]
            }],
            chart: {
                type: 'bar',
                height: 300,
                width: '100%',
                toolbar: {
                    show: false
                }
            },
            plotOptions: {
                bar: {
                    horizontal: true,
                    distributed: true,
                    barHeight: '60%'
                }
            },
            colors: [...SEQUENTIAL_BLUE].reverse(),
            dataLabels: {
                enabled: true,
                formatter: function (val) {
                    return val.toLocaleString('es-CO');
                },
                style: {
                    colors: [onFillInk()]
                }
            },
            xaxis: {
                categories: ['Visitas al Marketplace', 'Visitantes Únicos', 'Usuarios Logueados', 'Añadidos al Carrito', 'Inicios de Pago PSE/Nequi', 'Compras Exitosas'],
                labels: {
                    formatter: function (val) {
                        return (val / 1000).toFixed(0) + 'K';
                    }
                }
            },
            yaxis: {
                labels: {
                    style: {
                        fontSize: '12px'
                    }
                }
            },
            grid: {
                show: false
            },
            legend: {
                show: false
            },
            tooltip: {
                y: {
                    formatter: function (val) {
                        return val.toLocaleString('es-CO') + ' usuarios';
                    }
                }
            }
        };
        
        const behaviorEl = document.querySelector("#behaviorChart");
        if (behaviorEl) {
            this.charts.behavior = new ApexCharts(behaviorEl, behaviorOptions);
            this.charts.behavior.render();

            if ('ResizeObserver' in window) {
                let raf = 0;
                new ResizeObserver(() => {
                    cancelAnimationFrame(raf);
                    raf = requestAnimationFrame(() => {
                        this.charts.behavior?.updateOptions({ chart: { width: '100%' } }, false, false);
                    });
                }).observe(behaviorEl);
            }
        }
    },
    
    // Real time visitors chart
    initRealTimeChart() {
        const realTimeOptions = {
            series: [{
                name: 'Usuarios en Vivo',
                data: this.generateRealTimeData(30, 1350, 1480)
            }],
            chart: {
                height: 150,
                width: '100%',
                type: 'line',
                animations: {
                    enabled: true,
                    easing: 'linear',
                    dynamicAnimation: {
                        speed: 1000
                    }
                },
                toolbar: {
                    show: false
                },
                zoom: {
                    enabled: false
                }
            },
            dataLabels: {
                enabled: false
            },
            stroke: {
                curve: 'smooth',
                width: 2
            },
            colors: [categorical(3)[2]],
            markers: {
                size: 0
            },
            xaxis: {
                type: 'datetime',
                range: 30000,
                labels: {
                    show: false
                },
                axisBorder: {
                    show: false
                }
            },
            yaxis: {
                min: 1200,
                max: 1600,
                labels: {
                    show: false
                }
            },
            grid: {
                show: false
            },
            legend: {
                show: false
            }
        };
        
        const el = document.querySelector("#realTimeChart");
        if (el) {
            this.charts.realTime = new ApexCharts(el, realTimeOptions);
            this.charts.realTime.render();
        }
    },

    // Browser usage chart
    initBrowserChart() {
        const browserOptions = {
            series: [58.6, 22.3, 8.1, 5.4, 5.6],
            chart: {
                type: 'polarArea',
                height: 350,
                width: '100%'
            },
            labels: ['Google Chrome', 'Mozilla Firefox', 'Apple Safari', 'Microsoft Edge', 'Otros'],
            stroke: {
                colors: [onFillInk()]
            },
            fill: {
                opacity: 0.85
            },
            legend: {
                position: 'bottom'
            },
            responsive: [{
                breakpoint: 480,
                options: {
                    chart: {
                        width: 200
                    },
                    legend: {
                        position: 'bottom'
                    }
                }
            }]
        };

        const el = document.querySelector("#browserChart");
        if (el) {
            this.charts.browser = new ApexCharts(el, browserOptions);
            this.charts.browser.render();
        }
    },
    
    // Generate data for real-time chart
    generateRealTimeData(count, min, max) {
        let i = 0;
        const series = [];
        const time = new Date().getTime();
        while (i < count) {
            const x = time - (count - 1 - i) * 1000;
            const y = Math.floor(Math.random() * (max - min + 1)) + min;
            series.push([x, y]);
            i++;
        }
        return series;
    },
    
    // Start real time updates
    startRealTimeUpdates() {
        const id = setInterval(() => {
            this.updateRealTimeData();
            this.updateRealTimeMetrics();
        }, REALTIME_FAST_POLL_MS);
        this._intervals.add(id);
    },
    
    // Update real time chart data
    updateRealTimeData() {
        if (this.charts.realTime) {
            const x = new Date().getTime();
            const y = Math.floor(Math.random() * (1480 - 1350 + 1)) + 1350;
            
            const series = this.charts.realTime.w.config.series[0].data.slice();
            series.push([x, y]);
            series.shift();
            
            this.charts.realTime.updateSeries([{ data: series }]);
        }
    },
    
    // Update real time metrics
    updateRealTimeMetrics() {
        this.realTimeUsers += Math.floor(Math.random() * 21) - 10;
        this.pageViews += Math.floor(Math.random() * 5) + 1;
        if (Math.random() > 0.95) {
            this.sessions += 1;
        }
    },
    
    // Formatters
    formatCurrency(value) {
        return '$ ' + Math.round(value).toLocaleString('es-CO') + ' COP';
    },
    
    formatNumber(value) {
        return value.toLocaleString('es-CO');
    },
    
    formatPercentage(value) {
        return value.toFixed(2) + '%';
    },

    // Export data function
    exportData() {
        const dataToExport = {
            metrics: this.metrics,
            trafficSources: this.trafficSources,
            topPages: this.topPages,
            geographicData: this.geographicData,
            deviceData: this.deviceData
        };
        
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataToExport, null, 2));
        const a = document.createElement('a');
        a.setAttribute("href", dataStr);
        a.setAttribute("download", "omnistore_analytics_colombia.json");
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
    }
  }));
});