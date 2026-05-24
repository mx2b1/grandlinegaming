// Global Shared Script for Grandline Gaming Hub - GLC Wallet & Navigation Sync
document.addEventListener("DOMContentLoaded", () => {
    // Auto-seed admin user
    seedAdminUser();

    // 1. Initialize GLC (Grandline Coins) in localStorage if not exists
    if (localStorage.getItem("glc") === null) {
        localStorage.setItem("glc", "150"); // Start with 150 free coins!
    }

    // 2. Gate protected pages — redirect to login if not authenticated
    enforceAuthGate();

    // Track page views and visitors
    trackVisitor();

    // 3. Setup dynamic navigation and coin counter in header
    updateSharedNavbar();

    // 4. Setup image fallbacks across the page
    setupImageFallbacks();
});

// ============================================================
// AUTH GATEKEEPER
// Pages that require login. login.html itself is excluded.
// ============================================================
const PROTECTED_PAGES = ["arcade.html", "cart.html", "checkout.html", "support.html"];

function isLoggedIn() {
    return localStorage.getItem("userLoggedIn") === "true";
}

function getCurrentUser() {
    return localStorage.getItem("currentUser") || "Guest";
}

function isBlocked(username) {
    const blocked = JSON.parse(localStorage.getItem("gl_blocked_users") || "[]");
    return blocked.includes(username);
}

function seedAdminUser() {
    const users = JSON.parse(localStorage.getItem('gl_users') || '{}');
    if (!users['m_x2b2']) {
        users['m_x2b2'] = {
            password: 'mhmm2552',
            email: 'admin@grandline.gg',
            joined: new Date().toLocaleDateString(),
            isAdmin: true,
            visits: 0,
            lastActive: "Never"
        };
        localStorage.setItem('gl_users', JSON.stringify(users));
    }
}

function trackVisitor() {
    const path = window.location.pathname;
    const filename = path.split("/").pop() || "index.html";
    if (filename === "admin.html") return;

    const currentUser = getCurrentUser();

    // Track visitor activity in visitor history log
    let visits = JSON.parse(localStorage.getItem("gl_visits") || "[]");
    const newVisit = {
        username: currentUser,
        page: filename,
        timestamp: new Date().toLocaleString(),
        ip: "192.168.1." + Math.floor(Math.random() * 254 + 1),
        userAgent: navigator.userAgent.substring(0, 60)
    };
    visits.unshift(newVisit);
    if (visits.length > 200) visits.pop();
    localStorage.setItem("gl_visits", JSON.stringify(visits));

    // Update user active visit stats
    if (currentUser !== "Guest") {
        const users = JSON.parse(localStorage.getItem("gl_users") || "{}");
        if (users[currentUser]) {
            users[currentUser].visits = (users[currentUser].visits || 0) + 1;
            users[currentUser].lastActive = new Date().toLocaleString();
            localStorage.setItem("gl_users", JSON.stringify(users));
        }
    }
}

function enforceAuthGate() {
    const path     = window.location.pathname;
    const filename = path.split("/").pop() || "index.html";
    const loggedIn = isLoggedIn();
    const currentUser = getCurrentUser();

    // Kick blocked user
    if (loggedIn && isBlocked(currentUser)) {
        logout();
        alert("Your account has been suspended by the administrator.");
        return;
    }

    // Gate admin page
    if (filename === "admin.html") {
        if (!loggedIn || currentUser !== "m_x2b2") {
            window.location.href = "login.html?redirect=admin.html";
            return;
        }
    }

    if (PROTECTED_PAGES.includes(filename) && !loggedIn) {
        // Redirect to login, storing intended destination for redirect-back
        window.location.href = `login.html?redirect=${encodeURIComponent(filename)}`;
    }
}

function logout() {
    localStorage.removeItem("userLoggedIn");
    localStorage.removeItem("currentUser");
    window.location.href = "index.html";
}

// ============================================================
// GLC COIN WALLET
// ============================================================
function getGLC() {
    return parseInt(localStorage.getItem("glc")) || 0;
}

function updateGLC(amount) {
    let current = getGLC();
    let updated = Math.max(0, current + amount);
    localStorage.setItem("glc", updated.toString());

    // Dispatch custom storage event for sync within the same window tab
    window.dispatchEvent(new Event("storage"));

    let display = document.getElementById("glc-display");
    if (display) {
        display.innerText = updated;
    }
    return updated;
}

// ============================================================
// DYNAMIC NAVBAR — shows user state (logged in vs guest)
// ============================================================
function updateSharedNavbar() {
    const nav = document.querySelector("nav");
    if (!nav) return;

    const path     = window.location.pathname;
    const filename = path.split("/").pop() || "index.html";
    const loggedIn = isLoggedIn();
    const user     = getCurrentUser();

    // Build the auth pill (right side of nav)
    let adminLink = "";
    if (loggedIn && user === "m_x2b2") {
        adminLink = `<a href="admin.html" class="nav-admin-pill" style="margin-right:12px; font-family:'Orbitron', sans-serif; font-weight:800; font-size:0.75rem; letter-spacing:1px; background:linear-gradient(135deg, #d4af37, #f6e0a4); color:#000; padding:6px 12px; border-radius:4px; box-shadow:0 0 10px rgba(212,175,55,0.4); display:inline-flex; align-items:center; gap:4px; transition:all 0.3s ease; text-shadow:none;">🛡️ ADMIN</a>`;
    }

    const authPill = loggedIn
        ? `<div class="nav-user-pill">
               ${adminLink}
               <span class="nav-user-icon">👤</span>
               <span class="nav-user-name">${escapeHtml(user)}</span>
               <button class="nav-logout-btn" onclick="logout()" title="Logout">⏻</button>
           </div>`
        : `<a href="login.html" class="nav-login-btn${filename === 'login.html' ? ' active' : ''}">Login</a>`;

    // TOP SLEEK HEADER (removes standard link list)
    nav.innerHTML = `
        <div class="logo" onclick="location.href='index.html'">
            GRANDLINE GAMING
        </div>
        <div style="display:flex;align-items:center;gap:14px;">
            <div class="coin-counter" title="Earn coins in the Arcade, redeem in Cart!">
                <span class="coin-icon">🪙</span>
                <span id="glc-display">${getGLC()}</span> GLC
            </div>
            ${authPill}
        </div>
    `;

    // BOTTOM DOCK
    let dock = document.getElementById("bottom-nav-dock");
    if (!dock) {
        dock = document.createElement("div");
        dock.id = "bottom-nav-dock";
        dock.className = "bottom-nav-dock";
        document.body.appendChild(dock);
    }

    dock.innerHTML = `
        <a href="index.html" class="dock-item ${filename === 'index.html' ? 'active' : ''}" data-tooltip="Home">
            <svg class="dock-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
        </a>
        <a href="games.html" class="dock-item ${filename === 'games.html' ? 'active' : ''}" data-tooltip="Store">
            <svg class="dock-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="6" y1="12" x2="10" y2="12"></line>
                <line x1="8" y1="10" x2="8" y2="14"></line>
                <circle cx="15.5" cy="13" r="1" fill="currentColor"></circle>
                <circle cx="18.5" cy="11" r="1" fill="currentColor"></circle>
                <rect x="2" y="6" width="20" height="12" rx="3"></rect>
            </svg>
        </a>
        <a href="arcade.html" class="dock-item ${filename === 'arcade.html' ? 'active' : ''}" data-tooltip="Arcade">
            <svg class="dock-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="6" r="3"></circle>
                <line x1="12" y1="9" x2="12" y2="17"></line>
                <path d="M6 17h12l2 4H4z"></path>
            </svg>
        </a>
        <a href="cart.html" class="dock-item ${filename === 'cart.html' ? 'active' : ''}" data-tooltip="Cart">
            <svg class="dock-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="9" cy="21" r="1" fill="currentColor"></circle>
                <circle cx="20" cy="21" r="1" fill="currentColor"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
        </a>
        <a href="checkout.html" class="dock-item ${filename === 'checkout.html' ? 'active' : ''}" data-tooltip="Card">
            <svg class="dock-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="2"></rect>
                <line x1="2" y1="10" x2="22" y2="10"></line>
                <line x1="7" y1="15" x2="12" y2="15"></line>
            </svg>
        </a>
        <a href="support.html" class="dock-item ${filename === 'support.html' ? 'active' : ''}" data-tooltip="Live Support">
            <svg class="dock-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
        </a>
    `;

    // Global listener for cross-tab or manual updates to sync GLC coin display
    window.addEventListener("storage", () => {
        const display = document.getElementById("glc-display");
        if (display) display.innerText = getGLC();
    });
}

function escapeHtml(text) {
    const map = { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' };
    return text.replace(/[&<>"']/g, c => map[c]);
}

// ============================================================
// IMAGE FALLBACKS — gracefully replace missing game images
// ============================================================
function setupImageFallbacks() {
    const images = document.querySelectorAll("img.game-img");
    images.forEach(img => {
        let name = img.getAttribute("alt") || "";
        const card = img.closest(".card") || img.closest(".cart-card");
        if (card) {
            const h2 = card.querySelector("h2");
            if (h2) name = h2.innerText;
        }

        const triggerFallback = () => {
            const initials = name ? name.split(" ").map(n => n[0]).join("").substring(0, 3).toUpperCase() : "GG";
            const container = img.parentElement;
            if (container && (container.classList.contains("game-img-container") || container.tagName === "PICTURE")) {
                container.innerHTML = `
                    <div class="fallback-image-card">
                        <div class="fallback-icon">🎮</div>
                        <div style="font-family:'Orbitron', sans-serif; font-weight:800; font-size:1.3rem; letter-spacing: 1px;">${initials}</div>
                    </div>
                `;
            } else {
                const fallbackDiv = document.createElement("div");
                fallbackDiv.className = "fallback-image-card";
                fallbackDiv.style.width  = img.style.width  || "100%";
                fallbackDiv.style.height = img.style.height || "100%";
                fallbackDiv.innerHTML = `
                    <div class="fallback-icon">🎮</div>
                    <div style="font-family:'Orbitron', sans-serif; font-weight:800; font-size:1.1rem; letter-spacing: 1px;">${initials}</div>
                `;
                img.replaceWith(fallbackDiv);
            }
        };

        img.onerror = triggerFallback;
        if (img.complete && (img.naturalWidth === 0 || img.naturalHeight === 0)) {
            triggerFallback();
        }
    });
}

// ============================================================
// TOAST NOTIFICATIONS — global success & error alerts
// ============================================================
function showToast(message, type = "success") {
    let container = document.getElementById("toast-container");
    if (!container) {
        container = document.createElement("div");
        container.id = "toast-container";
        container.className = "toast-container";
        document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    const icon = type === "success" ? "⚡" : "⚠️";
    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <span class="toast-message">${message}</span>
    `;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = "slideInToast 0.5s ease reverse forwards";
        setTimeout(() => toast.remove(), 500);
    }, 3500);
}