# 🛍️ OmniStore Colombia — E-Commerce Marketplace, Admin Dashboard & POS

Plataforma integral de comercio electrónico y administración empresarial adaptada al mercado colombiano (**COP $**), construida con arquitectura modular moderna, sincronización en tiempo real con **Supabase PostgreSQL**, panel de administración con **Bootstrap 5.3 + SCSS + Alpine.js**, terminal **Punto de Venta (POS Express)**, tienda online (**Marketplace**) y sistema de **seguridad con geolocalización en tiempo real**.

---

## 📑 Tabla de Contenidos

1. [Características Principales](#-características-principales)
2. [Arquitectura y Stack Tecnológico](#-arquitectura-y-stack-tecnológico)
3. [Estructura del Proyecto](#-estructura-del-proyecto)
4. [Credenciales y Cuentas de Acceso](#-credenciales-y-cuentas-de-acceso)
5. [Configuración y Variables de Entorno](#-configuración-y-variables-de-entorno)
6. [Instalación y Puesta en Marcha](#-instalación-y-puesta-en-marcha)
7. [Base de Datos PostgreSQL & Supabase](#-base-de-datos-postgresql--supabase)
8. [Módulos del Sistema](#-módulos-del-sistema)
9. [Scripts Disponibles](#-scripts-disponibles)

---

## 🚀 Características Principales

- **🛍️ Marketplace Storefront:** Tienda online moderna inspirada en *Temu / AliExpress / Mercado Libre*, con carrito persistente, cupones promocionales, ofertas relámpago con contador regresivo y pasarelas de pago colombianas (PSE, Tarjeta de Crédito Wompi, Nequi, Efectivo).
- **📊 Admin Dashboard:** Panel de control con métricas de ventas, gráficos interactivos con ApexCharts, desglose por categorías y monitoreo de inventario.
- **📦 Gestión de Catálogo & Kardex:** Inventario con más de **45 productos oficiales**, soporte de variantes (colores, tallas, capacidades), registro de movimientos de Kardex y control de proveedores mayoristas.
- **📟 Terminal Punto de Venta (POS):** Módulo de venta rápida para mostrador con soporte de lector de código de barras con audio, cálculo de cambio, arqueo de caja e impresión de tickets térmicos con validación de factura electrónica.
- **🔒 Seguridad & Auditoría en Tiempo Real:**
  - Detección automática del dispositivo, sistema operativo, navegador y tipo de hardware.
  - **Geolocalización e IP pública en tiempo real** para registrar desde dónde se inicia sesión.
  - **Notificaciones instantáneas para el Administrador** en el menú superior (*Topbar*) ante nuevos inicios de sesión.
  - Gestión remota de sesiones activas (cerrar sesiones remotas individualmente o todas a la vez).
- **🛡️ Control de Acceso Granular (RBAC):** Validación de permisos tanto a nivel visual en el menú lateral como en las rutas del sistema para roles `admin`, `vendor` y `customer`.
- **🌓 Modo Oscuro / Modo Claro Nativo:** Paleta dark/light coherente en las 21 vistas del sistema, botones, tablas, formularios, modales y gráficos.

---

## 🛠️ Arquitectura y Stack Tecnológico

| Capa | Tecnologías | Descripción |
| :--- | :--- | :--- |
| **Frontend UI** | `Bootstrap 5.3`, `SCSS`, `Bootstrap Icons` | Diseño responsivo, componentes estilizados y temas claro/oscuro. |
| **Reactividad** | `Alpine.js v3` | Manejo de estado declarativo y componentes reactivos ligeros. |
| **Gráficos** | `ApexCharts` | Visualización de ventas, ingresos, pedidos y distribución de categorías. |
| **Empaquetador** | `Vite 8` | Hot Module Replacement (HMR) ultrarrápido y compilación optimizada. |
| **Base de Datos** | `Supabase PostgreSQL` | Base de datos relacional con conexión directa y WebSockets en tiempo real. |
| **Almacenamiento Local** | `LocalStorage / SessionStorage` | Almacenamiento híbrido para funcionamiento sin conexión y velocidad instantánea. |
| **Seguridad & Geodatos** | `IP & Geo APIs (ipwho.is / ipapi.co)` | Rastreo de IP pública y ciudad/país en tiempo real. |

---

## 📂 Estructura del Proyecto

```text
OmniStore/
├── public-assets/                 # Favicon, manifiesto PWA y assets públicos
├── scripts/                       # Scripts de mantenimiento y base de datos
│   ├── inject-all-products-supabase.mjs # Inyector de los 45 productos a Supabase
│   ├── init-db.mjs                # Ejecutor de migraciones SQL
│   └── db-status.mjs              # Verificador de estado de base de datos
├── src-modern/                    # Código fuente de la aplicación
│   ├── assets/                    # Imágenes, logos y avatars
│   ├── styles/                    # Estilos SCSS modulares y temas Dark/Light
│   │   └── scss/
│   │       ├── main.scss          # Punto de entrada de estilos
│   │       └── _variables.scss    # Paleta de colores, fuentes y tokens
│   ├── scripts/                   # Lógica JavaScript (ES Modules)
│   │   ├── components/            # Componentes de página (Alpine.js)
│   │   │   ├── marketplace.js     # Tienda online y checkout
│   │   │   ├── products.js        # Catálogo, filtros y modales
│   │   │   ├── orders.js          # Gestión de pedidos y estados
│   │   │   ├── pos.js             # Terminal Punto de Venta
│   │   │   ├── security.js        # Centro de seguridad y sesiones
│   │   │   ├── dashboard.js       # Métricas y gráficos del panel
│   │   │   ├── users.js           # Usuarios y roles
│   │   │   ├── reports.js         # Reportes y facturación DIAN
│   │   │   └── auth.js            # Login, registro y formularios
│   │   ├── utils/                 # Servicios y utilidades centrales
│   │   │   ├── store-data.js      # Catálogo centralizado y sincronización
│   │   │   ├── auth-service.js    # Sesiones, autenticación y guards
│   │   │   ├── permissions-service.js # Matriz de permisos RBAC
│   │   │   ├── session-tracker.js # Geolocalización IP y notificaciones
│   │   │   ├── supabase.js        # Cliente Supabase PostgreSQL
│   │   │   └── theme-manager.js   # Manejador de tema oscuro/claro
│   │   └── main.js                # Punto de entrada principal de la app
│   ├── marketplace.html           # Vista Tienda Online
│   ├── index.html                 # Vista Dashboard General
│   ├── products.html              # Vista Catálogo de Productos
│   ├── orders.html                # Vista Pedidos & Ventas
│   ├── pos.html                   # Vista Punto de Venta Express
│   ├── security.html              # Vista Seguridad & Sesiones Activas
│   ├── settings.html              # Vista Ajustes de Tienda & Perfil
│   ├── users.html                 # Vista Usuarios & Permisos
│   ├── reports.html               # Vista Reportes & Facturación
│   ├── messages.html              # Vista Mensajería Interna
│   ├── calendar.html              # Vista Calendario de Despachos
│   ├── files.html                 # Vista Gestor de Archivos
│   ├── login.html                 # Vista Inicio de Sesión
│   └── register.html              # Vista Registro de Cuenta
├── .env                           # Variables de entorno y conexión PostgreSQL
├── package.json                   # Dependencias y scripts de Node.js
├── supabase-schema.sql            # Esquema DDL y semillas para PostgreSQL
└── vite.config.js                 # Configuración de compilación Vite
```

---

## 🔑 Credenciales y Cuentas de Acceso

El sistema incluye cuentas preconfiguradas con diferentes niveles de autorización para pruebas inmediatas:

| Rol | Correo Electrónico | Contraseña | Vista por Defecto | Permisos |
| :--- | :--- | :--- | :--- | :--- |
| **Super Administrador** | `admin@omnistore.com` | `Admin*2026` | `index.html` | Acceso total e irrestricto a todos los módulos y seguridad. |
| **Vendedor / Cajero** | `vendor@omnistore.com` | `Vendor*2026` | `orders.html` | Acceso a Pedidos, Catálogo, POS, Mensajería y Soporte. |
| **Cliente** | `cliente@omnistore.com` | `Cliente*2026` | `marketplace.html` | Acceso exclusivo al Marketplace, Carrito y Mis Pedidos. |

---

## ⚙️ Configuración y Variables de Entorno

Crea o edita el archivo `.env` en la raíz del proyecto con la configuración de tu instancia de Supabase PostgreSQL:

```env
# URL del proyecto en Supabase:
VITE_SUPABASE_URL=https://hbxxwodvhqkzfktldkbi.supabase.co

# Llave pública anónima de Supabase:
VITE_SUPABASE_ANON_KEY=tu_anon_key_aqui

# Conexión directa a PostgreSQL (Session Pooler):
DATABASE_URL=postgresql://postgres.hbxxwodvhqkzfktldkbi:Luz7Noche*2025@aws-0-us-east-1.pooler.supabase.com:5432/postgres
```

---

## 📦 Instalación y Puesta en Marcha

### 1. Clonar el Repositorio e Instalar Dependencias
```bash
git clone https://github.com/tu-usuario/OmniStore.git
cd OmniStore
npm install
```

### 2. Iniciar el Servidor de Desarrollo
```bash
npm run dev
```
La aplicación estará disponible inmediatamente en: **`http://localhost:3000/`**

### 3. Compilar para Producción
```bash
npm run build
```
Genera la versión optimizada para producción dentro del directorio `dist-modern/`.

---

## 🗄️ Base de Datos PostgreSQL & Supabase

### Estructura de Tablas Principales:
- **`public.products`**: 45+ productos con categorías, SKU, precios en COP, fotos y stock.
- **`public.categories`**: 8 categorías oficiales (Tecnología, Audio, Gaming, Hogar, Calzado, Ropa, Belleza, Herramientas).
- **`public.orders`**: Pedidos de clientes con desglose de ítems, métodos de pago y direcciones en Cartagena.
- **`public.users`**: Usuarios y roles con credenciales protegidas.
- **`public.coupons`**: Cupones de descuento activos (`BIENVENIDO50K`, `CARTAGENA20`, `ENVIOGRATIS`, `OMNI10`).
- **`public.shipping_zones`**: Tarifas de domicilio para las zonas de Cartagena de Indias y Bolívar.

### Inyección de Catálogo a Supabase:
Para sembrar o actualizar los 45 productos directamente en PostgreSQL:
```bash
node scripts/inject-all-products-supabase.mjs
```

---

## 📌 Módulos del Sistema

1. **🛍️ Marketplace (`marketplace.html`)**: Catálogo con vistas en cuadrícula/lista, filtros de precio, categorías, selector de tallas/colores, cupón de bienvenida y modal de checkout.
2. **📦 Productos & Inventario (`products.html`)**: Tabla con buscador en tiempo real, filtros por stock, paginación, botón de carga rápida y modales de edición con subida de imágenes.
3. **🛒 Pedidos (`orders.html`)**: Filtros por estado (*Pendientes, Por Enviar, En Camino, Entregados, Cancelados*), detalle de ítems y seguimiento de envíos.
4. **📟 POS Express (`pos.html`)**: Diseñado para cajas físicas, teclado numérico, scanner de código de barras, selector de clientes y emisión de recibos.
5. **🔒 Seguridad & Auditoría (`security.html`)**: Rastreador de sesiones con IP y mapa de ubicación real, cambio de contraseña, 2FA y registro de eventos.
6. **👥 Usuarios & Roles (`users.html`)**: Gestión de personal, permisos por vista y estados de cuenta.

---

## 📜 Scripts Disponibles

| Comando | Descripción |
| :--- | :--- |
| `npm run dev` | Inicia el servidor de desarrollo Vite en el puerto `3000`. |
| `npm run build` | Compila todos los bundles de producción en `dist-modern/`. |
| `npm run preview` | Previsualiza localmente el build de producción. |
| `node scripts/inject-all-products-supabase.mjs` | Inyecta y sincroniza los 45 productos en Supabase PostgreSQL. |
| `node scripts/init-db.mjs` | Ejecuta el script completo `supabase-schema.sql` en PostgreSQL. |

---

## 📄 Licencia

Este proyecto está licenciado bajo la Licencia **MIT**. Consulta el archivo `LICENSE` para más detalles.
