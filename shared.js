// Global Shared Script for Grandline Gaming Hub - GLC Wallet & Navigation Sync
document.addEventListener("DOMContentLoaded", () => {
    // 1. Initialize GLC (Grandline Coins) in localStorage if not exists
    if (localStorage.getItem("glc") === null) {
        localStorage.setItem("glc", "150"); // Start with 150 free coins!
    }

    // 2. Gate protected pages — redirect to login if not authenticated
    enforceAuthGate();

    // 3. Setup dynamic navigation and coin counter in header
    updateSharedNavbar();

    // 4. Setup image fallbacks across the page
    setupImageFallbacks();
});

// ============================================================
// AUTH GATEKEEPER
// Pages that require login. login.html itself is excluded.
// ============================================================
const PROTECTED_PAGES = ["arcade.html", "cart.html", "checkout.html"];

function isLoggedIn() {
    return localStorage.getItem("userLoggedIn") === "true";
}

function getCurrentUser() {
    return localStorage.getItem("currentUser") || "Guest";
}

function enforceAuthGate() {
    const path     = window.location.pathname;
    const filename = path.split("/").pop() || "index.html";

    if (PROTECTED_PAGES.includes(filename) && !isLoggedIn()) {
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
    const authPill = loggedIn
        ? `<div class="nav-user-pill">
               <span class="nav-user-icon">👤</span>
               <span class="nav-user-name">${escapeHtml(user)}</span>
               <button class="nav-logout-btn" onclick="logout()" title="Logout">⏻</button>
           </div>`
        : `<a href="login.html" class="nav-login-btn${filename === 'login.html' ? ' active' : ''}">Login</a>`;

    nav.innerHTML = `
        <div class="logo" onclick="location.href='index.html'">
            GRANDLINE GAMING
        </div>
        <ul>
            <li><a href="index.html" class="${filename === 'index.html' ? 'active' : ''}">Home</a></li>
            <li><a href="games.html" class="${filename === 'games.html' ? 'active' : ''}">Games</a></li>
            <li><a href="arcade.html" class="${filename === 'arcade.html' ? 'active' : ''}">Arcade</a></li>
            <li><a href="cart.html" class="${filename === 'cart.html' ? 'active' : ''}">Cart</a></li>
            <li><a href="checkout.html" class="${filename === 'checkout.html' ? 'active' : ''}">Card</a></li>
            <li><a href="cn.html" class="${filename === 'cn.html' ? 'active' : ''}">Contact us</a></li>
        </ul>
        <div style="display:flex;align-items:center;gap:14px;">
            <div class="coin-counter" title="Earn coins in the Arcade, redeem in Cart!">
                <span class="coin-icon">🪙</span>
                <span id="glc-display">${getGLC()}</span> GLC
            </div>
            ${authPill}
        </div>
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
