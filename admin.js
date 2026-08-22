// ============================================
// ADMIN JAVASCRIPT
// ============================================

// ===== DATA =====
let adminData = {
    restaurants: JSON.parse(localStorage.getItem('restaurants') || '[]'),
    admins: JSON.parse(localStorage.getItem('admins') || '[]'),
    orders: JSON.parse(localStorage.getItem('orders') || '[]'),
    menu: JSON.parse(localStorage.getItem('menu') || '{}'),
    settings: JSON.parse(localStorage.getItem('settings') || '{}'),
    couriers: JSON.parse(localStorage.getItem('couriers') || '[]'),
    currentAdmin: JSON.parse(localStorage.getItem('currentAdmin') || 'null')
};

let currentFilter = 'all';
let editingFoodId = null;
let editingRestaurantId = null;

// ============================================
// DEFAULT DATA
// ============================================
if (!adminData.admins.length) {
    adminData.admins = [{ id: 1, login: 'admin', password: 'admin123', role: 'super_admin', restaurantId: null,
        createdAt: new Date().toISOString() }];
    localStorage.setItem('admins', JSON.stringify(adminData.admins));
}

// ============================================
// AUTH
// ============================================
function adminLogin() {
    const login = document.getElementById('adminLogin').value.trim();
    const pass = document.getElementById('adminPassword').value.trim();

    const admin = adminData.admins.find(a => a.login === login && a.password === pass);
    if (!admin) {
        showToast('❌ Noto\'g\'ri login yoki parol!', 'error');
        return;
    }

    adminData.currentAdmin = admin;
    localStorage.setItem('currentAdmin', JSON.stringify(admin));
    showToast('✅ Xush kelibsiz, ' + login + '!', 'success');
    showAdminApp();
}

function logout() {
    adminData.currentAdmin = null;
    localStorage.removeItem('currentAdmin');
    document.getElementById('authPage').classList.add('active');
    document.getElementById('adminApp').classList.remove('active');
    showToast('👋 Siz chiqdingiz!', 'info');
}

// ============================================
// SHOW ADMIN APP
// ============================================
function showAdminApp() {
    document.getElementById('authPage').classList.remove('active');
    document.getElementById('adminApp').classList.add('active');
    document.getElementById('currentRestaurantName').textContent = '👑 Super Admin';

    updateDashboard();
    renderRestaurants();
    renderAdmins();
    renderCouriers();
    renderOrders();
    renderMenu();
    loadSettings();
    updateMenuRestaurantSelect();
    switchPage('dashboard');
}

// ============================================
// NAVIGATION
// ============================================
function switchPage(page) {
    document.querySelectorAll('.admin-page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById(`page-${page}`);
    if (target) target.classList.add('active');

    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const navBtn = document.querySelector(`[data-page="${page}"]`);
    if (navBtn) navBtn.classList.add('active');

    if (page === 'dashboard') updateDashboard();
    if (page === 'restaurants') renderRestaurants();
    if (page === 'admins') renderAdmins();
    if (page === 'couriers') renderCouriers();
    if (page === 'orders') renderOrders();
    if (page === 'menu') { updateMenuRestaurantSelect(); renderMenu(); }
    if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
}

// ============================================
// DASHBOARD
// ============================================
function updateDashboard() {
    document.getElementById('statRestaurants').textContent = adminData.restaurants.length;
    document.getElementById('statAdmins').textContent = adminData.admins.length;
    document.getElementById('statOrders').textContent = adminData.orders.length;
    const revenue = adminData.orders.filter(o => o.status === 'delivered').reduce((s, o) => s + o.total, 0);
    document.getElementById('statRevenue').textContent = revenue.toLocaleString() + " so'm";

    const recent = adminData.orders.slice(-5).reverse();
    const container = document.getElementById('recentOrders');
    if (!recent.length) {
        container.innerHTML =
            '<div class="empty-state"><div class="icon">📭</div><div class="title">Buyurtmalar yo\'q</div></div>';
        return;
    }
    const statusMap = { 'new': 'Yangi', 'ready': 'Tayyor', 'delivering': 'Yo\'lda', 'delivered': 'Yetkazildi',
        'cancelled': 'Bekor' };
    container.innerHTML = recent.map(o => `
        <div class="row">
            <span>#${o.id}</span>
            <span><strong>${o.user}</strong><br><small>${o.items}</small></span>
            <span>${o.total.toLocaleString()} so'm</span>
            <span class="status status-${o.status}">${statusMap[o.status] || o.status}</span>
        </div>
    `).join('');
}

// ============================================
// RESTAURANTS
// ============================================
function renderRestaurants() {
    const container = document.getElementById('restaurantsList');
    if (!adminData.restaurants.length) {
        container.innerHTML =
            '<div class="empty-state"><div class="icon">🏪</div><div class="title">Hali restoranlar yo\'q</div></div>';
        return;
    }
    container.innerHTML = adminData.restaurants.map(r => `
        <div class="restaurant-card">
            <div class="info">
                <div class="name">${r.name}</div>
                <div class="details">
                    <i class="fas fa-map-marker-alt"></i> ${r.address || 'Manzil yo\'q'}
                    <i class="fas fa-phone" style="margin-left:12px;"></i> ${r.phone || 'Tel yo\'q'}
                    ${r.hours ? `<i class="fas fa-clock" style="margin-left:12px;"></i> ${r.hours}` : ''}
                </div>
            </div>
            <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
                <span class="status-badge ${r.status === 'active' ? 'status-active' : 'status-inactive'}">
                    ${r.status === 'active' ? '✅ Faol' : '❌ Faol emas'}
                </span>
                <div class="actions">
                    <button class="btn-edit" onclick="editRestaurant(${r.id})"><i class="fas fa-pen"></i> Tahrirlash</button>
                    <button class="btn-toggle" onclick="toggleRestaurant(${r.id})">
                        ${r.status === 'active' ? '⏸ To\'xtatish' : '▶️ Faollashtirish'}
                    </button>
                    <button class="btn-delete" onclick="deleteRestaurant(${r.id})"><i class="fas fa-trash"></i> O'chirish</button>
                    <button class="btn-enter" onclick="selectRestaurant(${r.id})"><i class="fas fa-sign-in-alt"></i> Kirish</button>
                </div>
            </div>
        </div>
    `).join('');
}

function showAddRestaurant() {
    editingRestaurantId = null;
    document.getElementById('restaurantModalTitle').textContent = '🏪 Yangi restoran';
    document.getElementById('restaurantName').value = '';
    document.getElementById('restaurantAddress').value = '';
    document.getElementById('restaurantPhone').value = '';
    document.getElementById('restaurantImage').value = '';
    document.getElementById('restaurantHours').value = '09:00 - 23:00';
    document.getElementById('restaurantEditId').value = '';
    document.getElementById('restaurantModal').classList.add('active');
}

function editRestaurant(id) {
    const r = adminData.restaurants.find(rest => rest.id === id);
    if (!r) return;
    editingRestaurantId = id;
    document.getElementById('restaurantModalTitle').textContent = '✏️ Restoran tahrirlash';
    document.getElementById('restaurantName').value = r.name;
    document.getElementById('restaurantAddress').value = r.address || '';
    document.getElementById('restaurantPhone').value = r.phone || '';
    document.getElementById('restaurantImage').value = r.image || '';
    document.getElementById('restaurantHours').value = r.hours || '09:00 - 23:00';
    document.getElementById('restaurantEditId').value = id;
    document.getElementById('restaurantModal').classList.add('active');
}

function saveRestaurant() {
    const name = document.getElementById('restaurantName').value.trim();
    const address = document.getElementById('restaurantAddress').value.trim();
    const phone = document.getElementById('restaurantPhone').value.trim();
    const image = document.getElementById('restaurantImage').value.trim();
    const hours = document.getElementById('restaurantHours').value.trim();
    const editId = document.getElementById('restaurantEditId').value;

    if (!name) { showToast('❌ Restoran nomini kiriting!', 'error'); return; }

    if (editId) {
        const r = adminData.restaurants.find(rest => rest.id === parseInt(editId));
        if (r) { r.name = name;
            r.address = address;
            r.phone = phone;
            r.image = image;
            r.hours = hours; }
    } else {
        const newId = Math.max(...adminData.restaurants.map(r => r.id), 0) + 1;
        adminData.restaurants.push({ id: newId, name, address, phone, image, hours, status: 'active',
            createdAt: new Date().toISOString() });
        adminData.menu[newId] = [];
        localStorage.setItem('menu', JSON.stringify(adminData.menu));
    }

    localStorage.setItem('restaurants', JSON.stringify(adminData.restaurants));
    closeModal('restaurantModal');
    renderRestaurants();
    updateMenuRestaurantSelect();
    showToast('✅ Restoran saqlandi!', 'success');
}

function toggleRestaurant(id) {
    const r = adminData.restaurants.find(rest => rest.id === id);
    if (r) {
        r.status = r.status === 'active' ? 'inactive' : 'active';
        localStorage.setItem('restaurants', JSON.stringify(adminData.restaurants));
        renderRestaurants();
        showToast(`🏪 ${r.name} ${r.status === 'active' ? 'faollashtirildi' : 'to\'xtatildi'}`, 'info');
    }
}

function deleteRestaurant(id) {
    if (!confirm('Bu restoran va uning barcha ma\'lumotlarini o\'chirmoqchimisiz?')) return;
    adminData.restaurants = adminData.restaurants.filter(r => r.id !== id);
    delete adminData.menu[id];
    localStorage.setItem('restaurants', JSON.stringify(adminData.restaurants));
    localStorage.setItem('menu', JSON.stringify(adminData.menu));
    renderRestaurants();
    updateMenuRestaurantSelect();
    showToast('🗑 Restoran o\'chirildi!', 'success');
}

function selectRestaurant(id) {
    const restaurant = adminData.restaurants.find(r => r.id === id);
    if (!restaurant) return;
    document.getElementById('menuRestaurantSelect').value = id;
    renderMenu();
    showToast(`🏪 ${restaurant.name} ga kirdingiz!`, 'success');
    switchPage('menu');
}

// ============================================
// ADMINS
// ============================================
function renderAdmins() {
    const container = document.getElementById('adminsList');
    let html =
        `<div class="row header"><span>Login</span><span>Restoran</span><span>Rol</span><span>Holat</span></div>`;
    adminData.admins.forEach(a => {
        const restaurant = a.restaurantId ? adminData.restaurants.find(r => r.id == a.restaurantId) : null;
        html += `
            <div class="row">
                <span><strong>${a.login}</strong></span>
                <span>${restaurant ? restaurant.name : '👑 Barcha'}</span>
                <span>${a.role === 'super_admin' ? '👑 Super Admin' : '👤 Admin'}</span>
                <span style="display:flex;gap:6px;align-items:center;">
                    <span class="status-badge status-active">✅ Faol</span>
                    ${a.role !== 'super_admin' ? `<button class="btn-danger" onclick="deleteAdmin(${a.id})" style="padding:4px 10px;border:none;border-radius:8px;cursor:pointer;font-size:12px;font-weight:700;">🗑 O'chirish</button>` : ''}
                </span>
            </div>
        `;
    });
    container.innerHTML = html;
}

function showAddAdmin() {
    document.getElementById('adminModal').classList.add('active');
    document.getElementById('adminNewLogin').value = '';
    document.getElementById('adminNewPassword').value = '';
    const select = document.getElementById('adminNewRestaurant');
    select.innerHTML = '<option value="">👑 Super Admin (barcha)</option>' +
        adminData.restaurants.map(r => `<option value="${r.id}">${r.name}</option>`).join('');
}

function saveAdmin() {
    const login = document.getElementById('adminNewLogin').value.trim();
    const password = document.getElementById('adminNewPassword').value.trim();
    const restaurantId = document.getElementById('adminNewRestaurant').value;

    if (!login || !password) { showToast('❌ Login va parolni kiriting!', 'error'); return; }
    if (adminData.admins.find(a => a.login === login)) { showToast('❌ Bu login allaqachon mavjud!', 'error'); return; }

    adminData.admins.push({
        id: Math.max(...adminData.admins.map(a => a.id), 0) + 1,
        login,
        password,
        role: restaurantId ? 'admin' : 'super_admin',
        restaurantId: restaurantId || null,
        createdAt: new Date().toISOString()
    });

    localStorage.setItem('admins', JSON.stringify(adminData.admins));
    closeModal('adminModal');
    renderAdmins();
    showToast('✅ Admin qo\'shildi!', 'success');
}

function deleteAdmin(id) {
    if (!confirm('Bu adminni o\'chirmoqchimisiz?')) return;
    adminData.admins = adminData.admins.filter(a => a.id !== id);
    localStorage.setItem('admins', JSON.stringify(adminData.admins));
    renderAdmins();
    showToast('🗑 Admin o\'chirildi!', 'success');
}

// ============================================
// COURIERS
// ============================================
function renderCouriers() {
    const container = document.getElementById('couriersList');
    const couriers = adminData.couriers;

    if (!couriers.length) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="icon">🚕</div>
                <div class="title">Hali kuryerlar yo'q</div>
                <div style="font-size:14px;color:var(--text-3);">"Yangi kuryer qo'shish" tugmasini bosing</div>
            </div>
        `;
        return;
    }

    let html = `<div class="row header">
        <span>#ID</span>
        <span>Ism / Restoran</span>
        <span>Telefon</span>
        <span>Holat</span>
        <span>Lokatsiya</span>
        <span>Amallar</span>
    </div>`;

    couriers.forEach(c => {
        const restaurant = adminData.restaurants.find(r => r.id == c.restaurant_id);
        const statusClass = c.status === 'online' ? 'status-active' : 'status-inactive';
        const statusText = c.status === 'online' ? '🟢 Online' : '🔴 Offline';

        html += `
            <div class="row">
                <span>#${c.id}</span>
                <span>
                    <strong>${c.name}</strong>
                    <br><small style="color:var(--text-3);">${restaurant ? restaurant.name : 'Restoran yo\'q'}</small>
                </span>
                <span>${c.phone}</span>
                <span>
                    <span class="status-badge ${statusClass}">${statusText}</span>
                    ${c.status === 'online' ? `<br><small style="font-size:10px;color:var(--text-3);">${c.last_location_update || 'Hozir'}</small>` : ''}
                </span>
                <span>
                    ${c.latitude && c.longitude ? 
                        `<span style="font-size:12px;">📍 ${c.latitude.toFixed(4)}, ${c.longitude.toFixed(4)}</span>` : 
                        '<span style="color:var(--text-3);font-size:12px;">📍 Noma\'lum</span>'
                    }
                </span>
                <span>
                    <button class="btn-edit" onclick="editCourier(${c.id})" title="Tahrirlash"><i class="fas fa-pen"></i></button>
                    <button class="btn-delete" onclick="deleteCourier(${c.id})" title="O'chirish"><i class="fas fa-trash"></i></button>
                    ${c.status === 'online' ? 
                        `<button class="btn-warning" onclick="toggleCourierStatus(${c.id}, 'offline')" title="Offline qilish"><i class="fas fa-pause"></i></button>` :
                        `<button class="btn-success" onclick="toggleCourierStatus(${c.id}, 'online')" title="Online qilish"><i class="fas fa-play"></i></button>`
                    }
                </span>
            </div>
        `;
    });

    container.innerHTML = html;
}

function showAddCourier() {
    document.getElementById('courierModalTitle').textContent = '🚕 Yangi kuryer';
    document.getElementById('courierName').value = '';
    document.getElementById('courierPhone').value = '';
    document.getElementById('courierLogin').value = '';
    document.getElementById('courierPassword').value = '';
    document.getElementById('courierEditId').value = '';

    const select = document.getElementById('courierRestaurant');
    select.innerHTML = adminData.restaurants.map(r =>
        `<option value="${r.id}">${r.name}</option>`
    ).join('');

    if (!adminData.restaurants.length) {
        select.innerHTML = '<option value="">Avval restoran qo\'shing</option>';
    }

    document.getElementById('courierModal').classList.add('active');
}

function saveCourier() {
    const name = document.getElementById('courierName').value.trim();
    const phone = document.getElementById('courierPhone').value.trim();
    const login = document.getElementById('courierLogin').value.trim();
    const password = document.getElementById('courierPassword').value.trim();
    const restaurant_id = document.getElementById('courierRestaurant').value;
    const editId = document.getElementById('courierEditId').value;

    if (!name || !phone || !login || !password) {
        showToast('❌ Barcha maydonlarni to\'ldiring!', 'error');
        return;
    }

    if (!restaurant_id) {
        showToast('❌ Iltimos, restoran tanlang!', 'error');
        return;
    }

    let couriers = adminData.couriers;
    const existing = couriers.find(c => c.login === login && c.id != editId);
    if (existing) {
        showToast('❌ Bu login allaqachon mavjud!', 'error');
        return;
    }

    if (editId) {
        const index = couriers.findIndex(c => c.id == editId);
        if (index !== -1) {
            couriers[index] = { ...couriers[index], name, phone, login, password, restaurant_id: parseInt(restaurant_id) };
        }
    } else {
        const newId = couriers.length > 0 ? Math.max(...couriers.map(c => c.id)) + 1 : 1;
        couriers.push({
            id: newId,
            name,
            phone,
            login,
            password,
            restaurant_id: parseInt(restaurant_id),
            status: 'offline',
            latitude: null,
            longitude: null,
            last_location_update: null,
            rating: 0,
            total_deliveries: 0,
            created_at: new Date().toISOString()
        });
    }

    adminData.couriers = couriers;
    localStorage.setItem('couriers', JSON.stringify(couriers));
    closeModal('courierModal');
    renderCouriers();
    showToast('✅ Kuryer saqlandi!', 'success');
}

function editCourier(id) {
    const courier = adminData.couriers.find(c => c.id === id);
    if (!courier) return;

    document.getElementById('courierModalTitle').textContent = '✏️ Kuryer tahrirlash';
    document.getElementById('courierName').value = courier.name;
    document.getElementById('courierPhone').value = courier.phone;
    document.getElementById('courierLogin').value = courier.login;
    document.getElementById('courierPassword').value = courier.password;
    document.getElementById('courierRestaurant').value = courier.restaurant_id;
    document.getElementById('courierEditId').value = id;

    document.getElementById('courierModal').classList.add('active');
}

function deleteCourier(id) {
    if (!confirm('Bu kuryerni o\'chirmoqchimisiz?')) return;
    adminData.couriers = adminData.couriers.filter(c => c.id !== id);
    localStorage.setItem('couriers', JSON.stringify(adminData.couriers));
    renderCouriers();
    showToast('🗑 Kuryer o\'chirildi!', 'success');
}

function toggleCourierStatus(id, status) {
    const courier = adminData.couriers.find(c => c.id === id);
    if (courier) {
        courier.status = status;
        if (status === 'online') {
            courier.last_location_update = new Date().toISOString();
            courier.latitude = 41.2995 + (Math.random() - 0.5) * 0.01;
            courier.longitude = 69.2401 + (Math.random() - 0.5) * 0.01;
        }
        localStorage.setItem('couriers', JSON.stringify(adminData.couriers));
        renderCouriers();
        showToast(`✅ Kuryer ${status === 'online' ? 'online' : 'offline'} qilindi!`, 'success');
    }
}

// ============================================
// ORDERS
// ============================================
function filterOrders(status) { currentFilter = status;
    renderOrders(); }

function renderOrders() {
    const container = document.getElementById('ordersList');
    let orders = adminData.orders;
    if (currentFilter !== 'all') orders = orders.filter(o => o.status === currentFilter);

    if (!orders.length) {
        container.innerHTML =
            '<div class="empty-state"><div class="icon">📭</div><div class="title">Buyurtmalar yo\'q</div></div>';
        return;
    }

    const statusMap = { 'new': 'Yangi', 'ready': 'Tayyor', 'delivering': 'Yo\'lda', 'delivered': 'Yetkazildi',
        'cancelled': 'Bekor' };
    let html =
        `<div class="row header"><span>#ID</span><span>Restoran / Mijoz</span><span>Summa</span><span>Holat</span></div>`;
    orders.forEach(o => {
        const restaurant = adminData.restaurants.find(r => r.id == o.restaurantId);
        html += `
            <div class="row">
                <span>#${o.id}</span>
                <span><strong>${restaurant ? restaurant.name : 'Noma\'lum'}</strong><br><small>${o.user}: ${o.items}</small></span>
                <span>${o.total.toLocaleString()} so'm</span>
                <span style="display:flex;align-items:center;gap:4px;flex-wrap:wrap;">
                    <span class="status status-${o.status}">${statusMap[o.status] || o.status}</span>
                    <div class="actions">
                        ${o.status !== 'new' ? `<button class="btn-success" onclick="changeOrderStatus(${o.id}, 'new')" title="Yangi">🆕</button>` : ''}
                        ${o.status !== 'ready' ? `<button class="btn-warning" onclick="changeOrderStatus(${o.id}, 'ready')" title="Tayyor">🔥</button>` : ''}
                        ${o.status !== 'delivering' ? `<button class="btn-info" onclick="changeOrderStatus(${o.id}, 'delivering')" title="Yo'lda">🚕</button>` : ''}
                        ${o.status !== 'delivered' ? `<button class="btn-success" onclick="changeOrderStatus(${o.id}, 'delivered')" title="Yetkazildi">✅</button>` : ''}
                    </div>
                </span>
            </div>
        `;
    });
    container.innerHTML = html;
}

function changeOrderStatus(id, status) {
    const order = adminData.orders.find(o => o.id === id);
    if (!order) return;
    order.status = status;
    localStorage.setItem('orders', JSON.stringify(adminData.orders));
    renderOrders();
    updateDashboard();
    showToast(`✅ Buyurtma #${id} — ${status}`, 'success');
}

// ============================================
// MENU
// ============================================
function updateMenuRestaurantSelect() {
    const select = document.getElementById('menuRestaurantSelect');
    select.innerHTML = '<option value="">Restoran tanlang</option>' +
        adminData.restaurants.map(r => `<option value="${r.id}">${r.name}</option>`).join('');
}

function renderMenu() {
    const container = document.getElementById('menuList');
    const restaurantId = document.getElementById('menuRestaurantSelect').value;

    if (!restaurantId) {
        container.innerHTML =
            '<div class="empty-state"><div class="icon">🏪</div><div class="title">Iltimos, restoran tanlang</div></div>';
        return;
    }

    const items = adminData.menu[restaurantId] || [];
    if (!items.length) {
        container.innerHTML =
            '<div class="empty-state"><div class="icon">🍽</div><div class="title">Hali taomlar yo\'q</div></div>';
        return;
    }

    container.innerHTML = items.map(item => `
        <div class="menu-item-admin">
            <div class="image">${item.image ? `<img src="${item.image}">` : item.emoji || '🍽'}</div>
            <div class="info">
                <div class="name">${item.name}</div>
                <div>
                    <span class="price">${item.price.toLocaleString()} so'm</span>
                    <span class="category"> • ${item.category}</span>
                    ${item.discount > 0 ? `<span style="color:var(--danger);font-weight:700;"> -${item.discount}%</span>` : ''}
                </div>
                <div style="font-size:12px;color:var(--text-3);">${item.desc || ''} ${item.stock !== undefined ? ` • ${item.stock} dona` : ''}</div>
            </div>
            <div class="actions">
                <button class="btn-edit" onclick="editFood(${item.id}, '${restaurantId}')"><i class="fas fa-pen"></i> Tahrirlash</button>
                <button class="btn-delete" onclick="deleteFood(${item.id}, '${restaurantId}')"><i class="fas fa-trash"></i> O'chirish</button>
                <div class="toggle ${item.available ? 'active' : ''}" onclick="toggleFood(${item.id}, '${restaurantId}')">
                    <div class="dot"></div>
                </div>
            </div>
        </div>
    `).join('');
}

function showAddFood() {
    const restaurantId = document.getElementById('menuRestaurantSelect').value;
    if (!restaurantId) { showToast('❌ Iltimos, restoran tanlang!', 'error'); return; }

    editingFoodId = null;
    document.getElementById('foodModalTitle').textContent = '➕ Yangi taom';
    document.getElementById('foodName').value = '';
    document.getElementById('foodPrice').value = '';
    document.getElementById('foodCategory').value = '';
    document.getElementById('foodDesc').value = '';
    document.getElementById('foodEmoji').value = '🍽';
    document.getElementById('foodImage').value = '';
    document.getElementById('foodDiscount').value = '0';
    document.getElementById('foodStock').value = '99';
    document.getElementById('foodEditId').value = '';
    document.getElementById('foodRestaurantId').value = restaurantId;
    document.getElementById('foodModal').classList.add('active');
}

function editFood(id, restaurantId) {
    const items = adminData.menu[restaurantId] || [];
    const item = items.find(f => f.id === id);
    if (!item) return;

    editingFoodId = id;
    document.getElementById('foodModalTitle').textContent = '✏️ Taom tahrirlash';
    document.getElementById('foodName').value = item.name;
    document.getElementById('foodPrice').value = item.price;
    document.getElementById('foodCategory').value = item.category;
    document.getElementById('foodDesc').value = item.desc || '';
    document.getElementById('foodEmoji').value = item.emoji || '🍽';
    document.getElementById('foodImage').value = item.image || '';
    document.getElementById('foodDiscount').value = item.discount || 0;
    document.getElementById('foodStock').value = item.stock || 99;
    document.getElementById('foodEditId').value = id;
    document.getElementById('foodRestaurantId').value = restaurantId;
    document.getElementById('foodModal').classList.add('active');
}

function saveFood() {
    const restaurantId = document.getElementById('foodRestaurantId').value;
    if (!restaurantId) { showToast('❌ Restoran ID topilmadi!', 'error'); return; }

    const name = document.getElementById('foodName').value.trim();
    const price = parseInt(document.getElementById('foodPrice').value);
    const category = document.getElementById('foodCategory').value.trim();
    const desc = document.getElementById('foodDesc').value.trim();
    const emoji = document.getElementById('foodEmoji').value.trim() || '🍽';
    const image = document.getElementById('foodImage').value.trim();
    const discount = parseInt(document.getElementById('foodDiscount').value) || 0;
    const stock = parseInt(document.getElementById('foodStock').value) || 0;
    const editId = document.getElementById('foodEditId').value;

    if (!name || !price || !category) { showToast('Barcha maydonlarni to\'ldiring!', 'error'); return; }

    if (!adminData.menu[restaurantId]) adminData.menu[restaurantId] = [];

    if (editId) {
        const item = adminData.menu[restaurantId].find(f => f.id === parseInt(editId));
        if (item) { item.name = name;
            item.price = price;
            item.category = category;
            item.desc = desc;
            item.emoji = emoji;
            item.image = image;
            item.discount = discount;
            item.stock = stock; }
    } else {
        const newId = Math.max(...adminData.menu[restaurantId].map(f => f.id), 0) + 1;
        adminData.menu[restaurantId].push({ id: newId, name, price, category, desc, emoji, image, discount, stock,
            available: true });
    }

    localStorage.setItem('menu', JSON.stringify(adminData.menu));
    closeModal('foodModal');
    renderMenu();
    showToast('✅ Taom saqlandi!', 'success');
}

function deleteFood(id, restaurantId) {
    if (!confirm('Bu taomni o\'chirmoqchimisiz?')) return;
    adminData.menu[restaurantId] = (adminData.menu[restaurantId] || []).filter(f => f.id !== id);
    localStorage.setItem('menu', JSON.stringify(adminData.menu));
    renderMenu();
    showToast('🗑 Taom o\'chirildi!', 'success');
}

function toggleFood(id, restaurantId) {
    const item = (adminData.menu[restaurantId] || []).find(f => f.id === id);
    if (item) {
        item.available = !item.available;
        localStorage.setItem('menu', JSON.stringify(adminData.menu));
        renderMenu();
    }
}

// ============================================
// BROADCAST
// ============================================
function sendBroadcast() {
    const text = document.getElementById('broadcastText').value.trim();
    if (!text) { showToast('Xabar matnini kiriting!', 'error'); return; }
    if (tg?.sendData) {
        tg.sendData(JSON.stringify({ action: 'broadcast', message: text }));
    }
    document.getElementById('broadcastText').value = '';
    showToast('✅ Xabar yuborilmoqda...', 'success');
}

// ============================================
// SETTINGS
// ============================================
function loadSettings() {
    const s = adminData.settings;
    document.getElementById('settingRestaurant').value = s.restaurant || 'FoodExpress';
    document.getElementById('settingPhone').value = s.phone || '+998 90 123 45 67';
    document.getElementById('settingAddress').value = s.address || 'Toshkent sh., Chilonzor';
    document.getElementById('settingDelivery').value = s.deliveryPrice || 10000;
    document.getElementById('settingFreeFrom').value = s.freeFrom || 100000;
}

function saveSettings() {
    adminData.settings = {
        restaurant: document.getElementById('settingRestaurant').value,
        phone: document.getElementById('settingPhone').value,
        address: document.getElementById('settingAddress').value,
        deliveryPrice: parseInt(document.getElementById('settingDelivery').value) || 10000,
        freeFrom: parseInt(document.getElementById('settingFreeFrom').value) || 100000
    };
    localStorage.setItem('settings', JSON.stringify(adminData.settings));
    showToast('✅ Sozlamalar saqlandi!', 'success');
}

// ============================================
// MODAL HELPERS
// ============================================
function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}

document.querySelectorAll('.modal-overlay').forEach(el => {
    el.addEventListener('click', function(e) { if (e.target === this) this.classList.remove('active'); });
});

// ============================================
// INIT
// ============================================
if (adminData.currentAdmin) {
    showAdminApp();
} else {
    document.getElementById('authPage').classList.add('active');
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const active = document.activeElement;
        if (active.id === 'adminLogin' || active.id === 'adminPassword') adminLogin();
    }
});

console.log('🏪 Super Admin ishga tushdi!');
console.log('Login: admin | Parol: admin123');