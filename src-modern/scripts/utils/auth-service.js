// ==============================================================================
// OmniStore - Authentication & Session Management Service
// ==============================================================================

import Swal from 'sweetalert2';
import { getSupabaseClient } from './supabase.js';
import { addUser, getUsersList, saveUsersList } from './store-data.js';
import { canAccessPage, applySidebarPermissions, hasPermission, getUserPermissions, MODULES_PERMISSIONS_CONFIG } from './permissions-service.js';
import { recordLoginEvent, syncCurrentSession } from './session-tracker.js';

const SESSION_STORAGE_KEY = 'omnistore_user_session';

// Built-in seed accounts for instant fallback & demo access
export const DEMO_ACCOUNTS = [
  {
    id: 1,
    name: 'Alejandro Morales',
    email: 'admin@omnistore.com',
    password: 'Admin*2026',
    role: 'admin',
    roleLabel: 'Super Administrador',
    avatar: './assets/images/avatar-placeholder.svg',
    defaultRedirect: './index.html',
    badgeClass: 'bg-primary',
    phone: '+57 (310) 845-9210',
    city: 'Cartagena de Indias',
    department: 'Bolívar',
    address: 'Cra 3 # 7-15, Bocagrande, Cartagena',
    bio: 'Administrador principal de la plataforma OmniStore Colombia.'
  },
  {
    id: 2,
    name: 'Sofía Valenzuela',
    email: 'vendor@omnistore.com',
    password: 'Vendor*2026',
    role: 'vendor',
    roleLabel: 'Vendedor',
    avatar: './assets/images/avatar-placeholder.svg',
    defaultRedirect: './orders.html',
    badgeClass: 'bg-info',
    phone: '+57 (315) 720-4491',
    city: 'Cartagena de Indias',
    department: 'Bolívar',
    address: 'Calle Real de Manga # 22-10, Cartagena',
    bio: 'Gestor de ventas y despacho de pedidos en tienda.'
  },
  {
    id: 3,
    name: 'Carlos Mendoza',
    email: 'cliente@omnistore.com',
    password: 'Cliente*2026',
    role: 'customer',
    roleLabel: 'Cliente',
    avatar: './assets/images/avatar-placeholder.svg',
    defaultRedirect: './marketplace.html',
    badgeClass: 'bg-success',
    phone: '+57 (301) 450-8822',
    city: 'Cartagena de Indias',
    department: 'Bolívar',
    address: 'Cra 1 # 10-25, Bocagrande, Cartagena',
    bio: 'Cliente frecuente de compras en marketplace.'
  }
];

/**
 * Get the currently logged-in user from localStorage session
 */
export function getCurrentUser() {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading user session:', e);
    return null;
  }
}

/**
 * Check if a user is currently logged in
 */
export function isAuthenticated() {
  return getCurrentUser() !== null;
}

/**
 * Log in a user with email and password
 * First attempts to query Supabase public.users, falls back to DEMO_ACCOUNTS
 */
export async function loginUser(email, password, remember = true) {
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPassword = (password || '').trim();

  if (!cleanEmail || !cleanPassword) {
    return { success: false, error: 'Por favor ingresa tu correo electrónico y contraseña.' };
  }

  // 1. Try direct PostgreSQL Backend API
  try {
    const apiRes = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, password: cleanPassword })
    });
    if (apiRes.ok) {
      const data = await apiRes.json();
      if (data.success && data.user) {
        const userSession = {
          ...data.user,
          password: cleanPassword,
          loggedAt: new Date().toISOString(),
          source: 'postgresql_db'
        };
        saveSession(userSession, remember);
        recordLoginEvent(userSession, false).catch(() => {});
        return {
          success: true,
          user: userSession,
          redirectUrl: data.redirectUrl || getRedirectForRole(userSession.role)
        };
      }
    } else {
      const errData = await apiRes.json().catch(() => ({}));
      if (errData.error) {
        return { success: false, error: errData.error };
      }
    }
  } catch {
    // API not reachable, try client fallback
  }

  // 2. Try Supabase Client if configured
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .ilike('email', cleanEmail)
        .maybeSingle();

      if (!error && data) {
        if (data.password_hash === cleanPassword || data.password === cleanPassword) {
          const userSession = {
            id: data.id,
            name: data.name || 'Usuario OmniStore',
            email: data.email,
            password: cleanPassword,
            role: data.role || 'customer',
            avatar: data.avatar || './assets/images/avatar-placeholder.svg',
            phone: data.phone || '+57 (310) 845-9210',
            city: data.city || 'Cartagena de Indias',
            department: data.department || 'Bolívar',
            address: data.address || 'Cra 3 # 7-15, Bocagrande, Cartagena',
            bio: data.bio || '',
            status: data.status || 'active',
            loggedAt: new Date().toISOString(),
            source: 'supabase_db'
          };

          saveSession(userSession, remember);
          updateLastLogin(data.id);
          recordLoginEvent(userSession, false).catch(() => {});

          return {
            success: true,
            user: userSession,
            redirectUrl: getRedirectForRole(userSession.role)
          };
        }
      }
    } catch {
      // Ignore
    }
  }

  // 3. Check built-in demo seed accounts
  const demoMatch = DEMO_ACCOUNTS.find(
    (acc) => acc.email.toLowerCase() === cleanEmail && acc.password === cleanPassword
  );

  if (demoMatch) {
    const userSession = {
      id: demoMatch.id,
      name: demoMatch.name,
      email: demoMatch.email,
      password: demoMatch.password,
      role: demoMatch.role,
      avatar: demoMatch.avatar,
      phone: demoMatch.phone,
      city: demoMatch.city,
      department: demoMatch.department,
      address: demoMatch.address,
      bio: demoMatch.bio,
      loggedAt: new Date().toISOString(),
      source: 'seed_account'
    };

    saveSession(userSession, remember);
    recordLoginEvent(userSession, false).catch(() => {});
    return {
      success: true,
      user: userSession,
      redirectUrl: demoMatch.defaultRedirect
    };
  }

  return {
    success: false,
    error: 'Credenciales inválidas. Verifica tu correo y contraseña.'
  };
}

/**
 * Register a new user account
 */
export async function registerUser({ name, email, password, role = 'customer' }) {
  const cleanName = (name || '').trim();
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPassword = (password || '').trim();

  if (!cleanName || !cleanEmail || !cleanPassword) {
    return { success: false, error: 'Todos los campos son obligatorios.' };
  }

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      // Check if email already exists
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .ilike('email', cleanEmail)
        .maybeSingle();

      if (existing) {
        return { success: false, error: 'Ya existe una cuenta con este correo electrónico.' };
      }

      const { data, error } = await supabase
        .from('users')
        .insert([
          {
            name: cleanName,
            email: cleanEmail,
            password_hash: cleanPassword,
            role,
            avatar: './assets/images/avatar-placeholder.svg',
            status: 'active'
          }
        ])
        .select()
        .single();

      if (error) throw error;

      const userSession = {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role,
        avatar: data.avatar,
        loggedAt: new Date().toISOString(),
        source: 'supabase_db'
      };

      try {
        addUser({
          id: data.id,
          name: data.name,
          email: data.email,
          role: data.role,
          department: 'Bolívar',
          city: 'Cartagena de Indias'
        });
      } catch {}

      saveSession(userSession, true);
      recordLoginEvent(userSession, false).catch(() => {});
      return {
        success: true,
        user: userSession,
        redirectUrl: getRedirectForRole(userSession.role)
      };
    } catch (e) {
      console.error('Error in registration:', e);
      return { success: false, error: 'Error al registrar usuario: ' + e.message };
    }
  }

  // Local fallback registration
  const userSession = {
    id: Date.now(),
    name: cleanName,
    email: cleanEmail,
    role,
    avatar: './assets/images/avatar-placeholder.svg',
    loggedAt: new Date().toISOString(),
    source: 'local_storage'
  };

  try {
    addUser({
      id: userSession.id,
      name: cleanName,
      email: cleanEmail,
      role,
      department: 'Bolívar',
      city: 'Cartagena de Indias'
    });
  } catch {}

  saveSession(userSession, true);
  recordLoginEvent(userSession, false).catch(() => {});
  return {
    success: true,
    user: userSession,
    redirectUrl: getRedirectForRole(userSession.role)
  };
}

/**
 * Save user session to localStorage
 */
function saveSession(userSession) {
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(userSession));
    window.dispatchEvent(new CustomEvent('omnistore:auth-changed', { detail: userSession }));
  } catch (e) {
    console.error('Could not save session:', e);
  }
}

/**
 * Log out current user
 */
export function logoutUser() {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('omnistore:auth-changed', { detail: null }));
    window.location.replace('./login.html');
  } catch {
    window.location.replace('./login.html');
  }
}

/**
 * Determine redirection URL based on user role
 */
export function getRedirectForRole(role) {
  switch (role) {
    case 'admin':
      return './index.html';
    case 'vendor':
      return './orders.html';
    case 'customer':
    default:
      return './marketplace.html';
  }
}

/**
 * Asynchronously update last_login timestamp in Supabase
 */
async function updateLastLogin(userId) {
  try {
    const supabase = getSupabaseClient();
    if (supabase && userId) {
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', userId);
    }
  } catch {
    // Ignore non-critical timestamp errors
  }
}

/**
 * Enforce authentication and granular permissions on protected admin pages
 */
export function enforceAuthAndRoles() {
  const currentPage = document.body?.dataset?.page || '';
  const publicPages = ['login', 'register', 'forgot-password', 'reset-password', 'two-factor', 'lock-screen', '404', '500', 'maintenance', 'marketplace'];
  
  const path = (window.location.pathname || '').toLowerCase();
  const currentFile = path.substring(path.lastIndexOf('/') + 1) || 'index.html';
  const isPublicPage = publicPages.some(p => path.includes(p)) || publicPages.includes(currentPage) || currentFile === 'marketplace.html';
  
  if (isPublicPage) {
    return;
  }

  const currentUser = getCurrentUser();

  // If no user is logged in, immediately redirect to login page replacing history
  if (!currentUser) {
    const targetUrl = window.location.pathname + window.location.search;
    window.location.replace(`./login.html?redirect=${encodeURIComponent(targetUrl)}`);
    return;
  }

  // If role is 'customer', customers must be redirected to the public marketplace
  if (currentUser.role === 'customer') {
    window.location.replace('./marketplace.html');
    return;
  }

  // SuperAdmin has unrestricted access to all pages
  if (currentUser.role === 'admin') {
    applySidebarPermissions(currentUser);
    return;
  }

  // Check granular page permission
  const pageToCheck = currentPage || currentFile;
  const hasAccess = canAccessPage(pageToCheck, currentUser);

  if (!hasAccess) {
    // Find first permitted page fallback
    let fallback = './orders.html';
    if (hasPermission('products.view', currentUser)) fallback = './products.html';
    else if (hasPermission('dashboard.view', currentUser)) fallback = './index.html';
    else if (hasPermission('pos.view', currentUser)) fallback = './pos.html';
    else if (hasPermission('messages.view', currentUser)) fallback = './messages.html';
    else if (hasPermission('help.view', currentUser)) fallback = './help.html';
    else fallback = './marketplace.html';

    const cleanPage = (pageToCheck || '').toLowerCase().replace('.html', '').replace('./', '');
    const foundModule = MODULES_PERMISSIONS_CONFIG.find(m => m.module === cleanPage || m.pageDataAttr === cleanPage || m.pageFile.includes(cleanPage));
    const moduleLabel = foundModule ? foundModule.label : cleanPage.toUpperCase();
    const roleLabel = currentUser.role === 'admin' ? 'SuperAdministrador' : (currentUser.role === 'vendor' ? 'Vendedor / Store Manager' : 'Cliente');

    // Prevent rendering the restricted content while alert is active
    if (document.body) {
      document.body.style.display = 'none';
    }

    Swal.fire({
      icon: 'warning',
      title: 'Acceso Restringido',
      html: `
        <div class="text-center p-2">
          <div class="mb-3">
            <span class="badge bg-danger-subtle text-danger border border-danger-subtle px-3 py-2 fs-6 rounded-pill">
              <i class="bi bi-shield-lock-fill me-1"></i> Módulo No Autorizado
            </span>
          </div>
          <h6 class="fw-bold mb-2 text-body">Módulo: ${moduleLabel}</h6>
          <p class="mb-2 text-body" style="font-size: 0.92rem;">
            Tu cuenta <strong>${currentUser.name || currentUser.email}</strong> (<span class="text-primary fw-semibold">${roleLabel}</span>) no cuenta con permisos asignados por el administrador para acceder a esta sección.
          </p>
          <div class="alert alert-warning py-2 px-3 small mb-0 text-start border-warning-subtle">
            <i class="bi bi-info-circle-fill me-1 text-warning"></i>
            Si necesitas utilizar este módulo, comunícate con el SuperAdministrador para que active tus permisos desde el panel de <strong>Usuarios & Roles</strong>.
          </div>
        </div>
      `,
      confirmButtonText: '<i class="bi bi-arrow-left-circle me-1"></i> Ir a Panel Autorizado',
      confirmButtonColor: '#ff5722',
      allowOutsideClick: false,
      allowEscapeKey: false,
      timer: 6000,
      timerProgressBar: true,
      customClass: {
        popup: 'border border-secondary-subtle shadow-lg bg-body text-body rounded-4'
      }
    }).then(() => {
      window.location.replace(fallback);
    });

    return;
  }

  // Apply visual sidebar & navigation filtering
  applySidebarPermissions(currentUser);
}

// Automatic reactive listeners for bfcache and history back/forward navigation
if (typeof window !== 'undefined') {
  window.addEventListener('pageshow', () => {
    enforceAuthAndRoles();
  });
  window.addEventListener('popstate', () => {
    enforceAuthAndRoles();
  });
}

/**
 * Initializes and binds the user menu / profile dropdown across all pages
 */
export function initUserHeaderDropdown() {
  const currentUser = getCurrentUser();
  const userAvatarEls = document.querySelectorAll('[data-user-avatar]');
  const userNameEls = document.querySelectorAll('[data-user-name]');
  const userRoleEls = document.querySelectorAll('[data-user-role]');
  const logoutBtnEls = document.querySelectorAll('[data-auth-logout]');

  if (currentUser) {
    userAvatarEls.forEach((el) => {
      if (el.tagName === 'IMG') el.src = currentUser.avatar || './assets/images/avatar-placeholder.svg';
    });
    userNameEls.forEach((el) => {
      el.textContent = currentUser.name || currentUser.email;
    });
    userRoleEls.forEach((el) => {
      const roleText = currentUser.role === 'admin' 
        ? 'SuperAdmin' 
        : (currentUser.role === 'vendor' ? 'Vendedor' : 'Cliente');
      const badgeColor = currentUser.role === 'admin' ? 'bg-primary' : (currentUser.role === 'vendor' ? 'bg-info' : 'bg-success');
      el.textContent = roleText;
      el.className = `badge ${badgeColor} ms-2`;
    });
  }

  logoutBtnEls.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      logoutUser();
    });
  });
}

/**
 * Updates the active logged-in user session in localStorage, Central Store, and Supabase
 * @param {object} updatedFields - Object with user fields to update (e.g. name, email, phone, city, avatar, etc.)
 * @returns {object|null} The updated user session object
 */
export async function updateCurrentUserSession(updatedFields = {}) {
  const current = getCurrentUser();
  if (!current) return null;

  const updated = {
    ...current,
    ...updatedFields,
    updatedAt: new Date().toISOString()
  };

  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Could not update localStorage session:', e);
  }

  // Update in central store users list
  try {
    const users = getUsersList();
    const idx = users.findIndex(u => (current.id && u.id === current.id) || (current.email && u.email && u.email.toLowerCase() === current.email.toLowerCase()));
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...updatedFields };
      saveUsersList(users);
    }
  } catch (e) {
    console.warn('Could not update user in central store:', e);
  }

  // Sync with Supabase PostgreSQL if available
  const supabase = getSupabaseClient();
  if (supabase && current.id) {
    try {
      await supabase
        .from('users')
        .update(updatedFields)
        .eq('id', current.id);
    } catch (e) {
      console.warn('Supabase profile sync warning:', e);
    }
  }

  // Update DOM elements on page
  initUserHeaderDropdown();

  // Dispatch events to update all open tabs and components
  window.dispatchEvent(new CustomEvent('omnistore:auth-changed', { detail: updated }));
  window.dispatchEvent(new CustomEvent('omnistore:user-updated', { detail: updated }));

  return updated;
}

