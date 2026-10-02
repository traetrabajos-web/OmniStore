import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcModern = path.resolve(__dirname, '../src-modern');

const CANONICAL_SIDEBAR = `        <!-- Sidebar -->
        <aside class="admin-sidebar" id="admin-sidebar">
            <div class="sidebar-content">
                <nav class="sidebar-nav">
                    <ul class="nav flex-column">
                        <!-- Direct access to Marketplace Storefront -->
                        <li class="nav-item mb-2">
                            <a class="nav-link marketplace-nav-btn text-white fw-bold rounded-3 shadow-sm d-flex align-items-center" href="./marketplace.html">
                                <i class="bi bi-shop fs-5"></i>
                                <span>Ir al Marketplace</span>
                                <i class="bi bi-box-arrow-up-right ms-auto"></i>
                            </a>
                        </li>

                        <!-- VENTAS -->
                        <li class="nav-item">
                            <small class="text-muted px-3 text-uppercase fw-bold" style="font-size: 0.72rem; letter-spacing: 0.5px;">Ventas</small>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="./index.html">
                                <i class="bi bi-speedometer2"></i>
                                <span>Dashboard General</span>
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="#" data-bs-toggle="collapse" data-bs-target="#ordersSubmenu" aria-expanded="false" aria-controls="ordersSubmenu">
                                <i class="bi bi-bag-check-fill"></i>
                                <span>Pedidos & Ventas</span>
                                <span class="badge bg-danger rounded-pill ms-2 me-1" style="font-size: 0.7rem;">3</span>
                                <i class="bi bi-chevron-down ms-auto"></i>
                            </a>
                            <div class="collapse" id="ordersSubmenu">
                                <ul class="nav nav-submenu">
                                    <li class="nav-item">
                                        <a class="nav-link" href="./orders.html">
                                            <i class="bi bi-list-ul"></i>
                                            <span>Todos los pedidos</span>
                                        </a>
                                    </li>
                                    <li class="nav-item">
                                        <a class="nav-link" href="./orders.html?filter=pending">
                                            <i class="bi bi-clock-history"></i>
                                            <span>Pendientes de pago</span>
                                        </a>
                                    </li>
                                    <li class="nav-item">
                                        <a class="nav-link" href="./orders.html?filter=processing">
                                            <i class="bi bi-box-arrow-right"></i>
                                            <span>Por enviar</span>
                                            <span class="badge bg-danger rounded-pill ms-auto">3</span>
                                        </a>
                                    </li>
                                    <li class="nav-item">
                                        <a class="nav-link" href="./orders.html?filter=refunded">
                                            <i class="bi bi-arrow-counterclockwise"></i>
                                            <span>Devoluciones & reembolsos</span>
                                        </a>
                                    </li>
                                    <li class="nav-item">
                                        <a class="nav-link" href="./orders.html?filter=abandoned">
                                            <i class="bi bi-cart-x"></i>
                                            <span>Carritos abandonados</span>
                                        </a>
                                    </li>
                                    <li class="nav-item">
                                        <a class="nav-link" href="./orders.html?tab=payments">
                                            <i class="bi bi-credit-card"></i>
                                            <span>Pagos & transacciones</span>
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        </li>

                        <!-- CATÁLOGO -->
                        <li class="nav-item mt-2">
                            <small class="text-muted px-3 text-uppercase fw-bold" style="font-size: 0.72rem; letter-spacing: 0.5px;">Catálogo</small>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="#" data-bs-toggle="collapse" data-bs-target="#productsSubmenu" aria-expanded="false" aria-controls="productsSubmenu">
                                <i class="bi bi-box-seam-fill"></i>
                                <span>Catálogo de Productos</span>
                                <span class="badge bg-success-subtle text-success border ms-2 me-1" style="font-size: 0.68rem;">En Vivo</span>
                                <i class="bi bi-chevron-down ms-auto"></i>
                            </a>
                            <div class="collapse" id="productsSubmenu">
                                <ul class="nav nav-submenu">
                                    <li class="nav-item">
                                        <a class="nav-link" href="./products.html">
                                            <i class="bi bi-grid-fill"></i>
                                            <span>Todos los productos</span>
                                        </a>
                                    </li>
                                    <li class="nav-item">
                                        <a class="nav-link" href="./products.html?view=categories">
                                            <i class="bi bi-tags-fill"></i>
                                            <span>Categorías</span>
                                        </a>
                                    </li>
                                    <li class="nav-item">
                                        <a class="nav-link" href="./products.html?view=brands">
                                            <i class="bi bi-patch-check-fill"></i>
                                            <span>Marcas</span>
                                        </a>
                                    </li>
                                    <li class="nav-item">
                                        <a class="nav-link" href="./products.html?view=collections">
                                            <i class="bi bi-collection-fill"></i>
                                            <span>Colecciones</span>
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="#" data-bs-toggle="collapse" data-bs-target="#inventorySubmenu" aria-expanded="false" aria-controls="inventorySubmenu">
                                <i class="bi bi-stack"></i>
                                <span>Inventario & Stock</span>
                                <span class="badge bg-warning-subtle text-warning-emphasis border ms-2 me-1" style="font-size: 0.7rem;">2</span>
                                <i class="bi bi-chevron-down ms-auto"></i>
                            </a>
                            <div class="collapse" id="inventorySubmenu">
                                <ul class="nav nav-submenu">
                                    <li class="nav-item">
                                        <a class="nav-link" href="./products.html?tab=inventory">
                                            <i class="bi bi-bar-chart-steps"></i>
                                            <span>Niveles de stock</span>
                                        </a>
                                    </li>
                                    <li class="nav-item">
                                        <a class="nav-link" href="./products.html?tab=low-stock">
                                            <i class="bi bi-exclamation-triangle-fill text-warning"></i>
                                            <span>Alertas de stock bajo</span>
                                            <span class="badge bg-danger rounded-pill ms-auto">2</span>
                                        </a>
                                    </li>
                                    <li class="nav-item">
                                        <a class="nav-link" href="./products.html?tab=movements">
                                            <i class="bi bi-arrow-left-right"></i>
                                            <span>Movimientos de kardex</span>
                                        </a>
                                    </li>
                                    <li class="nav-item">
                                        <a class="nav-link" href="./products.html?tab=suppliers">
                                            <i class="bi bi-truck"></i>
                                            <span>Proveedores & compras</span>
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        </li>

                        <!-- CLIENTES -->
                        <li class="nav-item mt-2">
                            <small class="text-muted px-3 text-uppercase fw-bold" style="font-size: 0.72rem; letter-spacing: 0.5px;">Clientes</small>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="./users.html">
                                <i class="bi bi-people-fill"></i>
                                <span>Clientes & Usuarios</span>
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="./users.html?tab=reviews">
                                <i class="bi bi-star-fill text-warning"></i>
                                <span>Reseñas & Calificaciones</span>
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="./help.html">
                                <i class="bi bi-headset"></i>
                                <span>Soporte (Tickets & FAQ)</span>
                            </a>
                        </li>

                        <!-- MARKETING -->
                        <li class="nav-item mt-2">
                            <small class="text-muted px-3 text-uppercase fw-bold" style="font-size: 0.72rem; letter-spacing: 0.5px;">Marketing</small>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="./settings.html?tab=coupons">
                                <i class="bi bi-ticket-perforated-fill"></i>
                                <span>Cupones & Descuentos</span>
                                <span class="badge bg-primary-subtle text-primary border ms-auto">Activo</span>
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="./settings.html?tab=banners">
                                <i class="bi bi-megaphone-fill"></i>
                                <span>Promociones & Banners</span>
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="./settings.html?tab=campaigns">
                                <i class="bi bi-send-check-fill"></i>
                                <span>Campañas (Email / WhatsApp)</span>
                            </a>
                        </li>

                        <!-- LOGÍSTICA -->
                        <li class="nav-item mt-2">
                            <small class="text-muted px-3 text-uppercase fw-bold" style="font-size: 0.72rem; letter-spacing: 0.5px;">Logística</small>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="./orders.html?tab=shipping">
                                <i class="bi bi-geo-alt-fill"></i>
                                <span>Envíos & Guías</span>
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="./settings.html?tab=carriers">
                                <i class="bi bi-truck-flatbed"></i>
                                <span>Transportadoras</span>
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="./settings.html?tab=shipping-rates">
                                <i class="bi bi-globe-americas"></i>
                                <span>Zonas & Tarifas de Envío</span>
                            </a>
                        </li>

                        <!-- REPORTES -->
                        <li class="nav-item mt-2">
                            <small class="text-muted px-3 text-uppercase fw-bold" style="font-size: 0.72rem; letter-spacing: 0.5px;">Reportes</small>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="./analytics.html">
                                <i class="bi bi-graph-up-arrow"></i>
                                <span>Métricas & Analytics</span>
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="./reports.html">
                                <i class="bi bi-file-earmark-bar-graph-fill"></i>
                                <span>Reportes de Ventas</span>
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="./reports.html?tab=invoices">
                                <i class="bi bi-receipt"></i>
                                <span>Facturación & Impuestos</span>
                            </a>
                        </li>

                        <!-- CONTENIDO -->
                        <li class="nav-item mt-2">
                            <small class="text-muted px-3 text-uppercase fw-bold" style="font-size: 0.72rem; letter-spacing: 0.5px;">Contenido</small>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="./settings.html?tab=pages">
                                <i class="bi bi-file-richtext-fill"></i>
                                <span>Páginas & Blog</span>
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="./settings.html?tab=menus">
                                <i class="bi bi-layout-text-window-reverse"></i>
                                <span>Menús & Footer</span>
                            </a>
                        </li>

                        <!-- SISTEMA -->
                        <li class="nav-item mt-2">
                            <small class="text-muted px-3 text-uppercase fw-bold" style="font-size: 0.72rem; letter-spacing: 0.5px;">Sistema</small>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="./settings.html">
                                <i class="bi bi-gear-fill"></i>
                                <span>Ajustes de Tienda</span>
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="./users.html?tab=roles">
                                <i class="bi bi-person-badge-fill"></i>
                                <span>Equipo, Roles & Permisos</span>
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="./settings.html?tab=integrations">
                                <i class="bi bi-plugin"></i>
                                <span>Integraciones</span>
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="./settings.html?tab=notifications">
                                <i class="bi bi-bell-fill"></i>
                                <span>Plantillas de Notificaciones</span>
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="./security.html">
                                <i class="bi bi-shield-lock-fill"></i>
                                <span>Seguridad & Base de Datos</span>
                            </a>
                        </li>
                    </ul>
                </nav>
            </div>
        </aside>`;

const CANONICAL_USER_MENU = `                        <!-- User Menu -->
                        <div class="dropdown">
                            <button class="btn btn-outline-secondary d-flex align-items-center" 
                                    type="button" 
                                    data-bs-toggle="dropdown" 
                                    aria-expanded="false">
                                <img src="./assets/images/avatar-placeholder.svg" 
                                     alt="Avatar Administrador" 
                                     width="24" 
                                     height="24" 
                                     data-user-avatar
                                     class="rounded-circle me-2">
                                <span class="d-none d-md-inline" data-user-name>Admin Colombia</span>
                                <span class="badge bg-primary ms-2" data-user-role>SuperAdmin</span>
                                <i class="bi bi-chevron-down ms-1"></i>
                            </button>
                            <ul class="dropdown-menu dropdown-menu-end">
                                <li><a class="dropdown-item" href="./users.html"><i class="bi bi-person me-2"></i>Mi Perfil</a></li>
                                <li><a class="dropdown-item" href="./settings.html"><i class="bi bi-gear me-2"></i>Ajustes</a></li>
                                <li><hr class="dropdown-divider"></li>
                                <li><a class="dropdown-item text-danger" href="./login.html" data-auth-logout><i class="bi bi-box-arrow-right me-2"></i>Cerrar Sesión</a></li>
                            </ul>
                        </div>`;

const files = fs.readdirSync(srcModern).filter(f => f.endsWith('.html'));

const excludeFiles = ['login.html', 'register.html', 'forgot-password.html', 'reset-password.html', 'two-factor.html', 'lock-screen.html', '404.html', '500.html', 'maintenance.html', 'marketplace.html'];

let updatedCount = 0;

for (const file of files) {
  if (excludeFiles.includes(file)) continue;

  const filePath = path.join(srcModern, file);
  let content = fs.readFileSync(filePath, 'utf-8');

  // Replace sidebar
  const sidebarRegex = /<!-- Sidebar -->\s*<aside class="admin-sidebar"[\s\S]*?<\/aside>/;
  if (sidebarRegex.test(content)) {
    content = content.replace(sidebarRegex, CANONICAL_SIDEBAR);
  }

  // Replace user menu dropdown in header
  const userMenuRegex = /<!-- User Menu -->\s*<div class="dropdown">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/nav>/;
  if (userMenuRegex.test(content)) {
    content = content.replace(userMenuRegex, `${CANONICAL_USER_MENU}\n                    </div>\n                </div>\n            </nav>`);
  }

  fs.writeFileSync(filePath, content, 'utf-8');
  updatedCount++;
  console.log(`✅ Synchronized sidebar & header user menu for: ${file}`);
}

console.log(`\n🎉 Total pages synchronized: ${updatedCount}`);
