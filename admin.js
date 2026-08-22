// ============================================
// ADMIN JAVASCRIPT - TO'LIQ TUZATILGAN
// ============================================

// ===== TELEGRAM =====
var tg = window.Telegram?.WebApp;
if (tg) {
    tg.expand();
    tg.ready();
    tg.setHeaderColor('#FFFFFF');
    tg.setBackgroundColor('#F1F3F5');
}

// ===== TOAST =====
function showToast(message, type) {
    if (type === undefined) type = 'info';
    var toast = document.getElementById('toast');
    if (!toast) {
        alert(message);
        return;
    }
    toast.textContent = message;
    toast.className = 'toast show ' + type;
    clearTimeout(toast._timer);
    toast._timer = setTimeout(function() {
        toast.classList.remove('show');
    }, 3000);
}

// ===== DATA =====
var adminData = {
    restaurants: [],
    admins: [],
    orders: [],
    menu: {},
    settings: {},
    couriers: [],
    currentAdmin: null
};

// ===== DATA YUKLASH =====
function loadAdminData() {
    try {
        adminData.restaurants = JSON.parse(localStorage.getItem('restaurants') || '[]');
        adminData.admins = JSON.parse(localStorage.getItem('admins') || '[]');
        adminData.orders = JSON.parse(localStorage.getItem('orders') || '[]');
        adminData.menu = JSON.parse(localStorage.getItem('menu') || '{}');
        adminData.settings = JSON.parse(localStorage.getItem('settings') || '{}');
        adminData.couriers = JSON.parse(localStorage.getItem('couriers') || '[]');
        adminData.currentAdmin = JSON.parse(localStorage.getItem('currentAdmin') || 'null');
    } catch(e) {
        console.log('Ma\'lumotlarni yuklashda xatolik:', e);
    }
}

// ===== DATA SAQLASH =====
function saveAdminData() {
    try {
        localStorage.setItem('restaurants', JSON.stringify(adminData.restaurants));
        localStorage.setItem('admins', JSON.stringify(adminData.admins));
        localStorage.setItem('orders', JSON.stringify(adminData.orders));
        localStorage.setItem('menu', JSON.stringify(adminData.menu));
        localStorage.setItem('settings', JSON.stringify(adminData.settings));
        localStorage.setItem('couriers', JSON.stringify(adminData.couriers));
    } catch(e) {
        console.log('Ma\'lumotlarni saqlashda xatolik:', e);
    }
}

// ===== DEFAULT DATA =====
function initDefaultData() {
    var i;
    
    if (!adminData.admins || adminData.admins.length === 0) {
        adminData.admins = [{
            id: 1,
            login: 'admin',
            password: 'admin123',
            role: 'super_admin',
            restaurantId: null,
            createdAt: new Date().toISOString()
        }];
        localStorage.setItem('admins', JSON.stringify(adminData.admins));
    }
    
    if (!adminData.restaurants || adminData.restaurants.length === 0) {
        adminData.restaurants = [{
            id: 1,
            name: 'FoodExpress Main',
            address: 'Toshkent sh., Chilonzor',
            phone: '+998 90 123 45 67',
            image: '',
            hours: '09:00 - 23:00',
            status: 'active',
            createdAt: new Date().toISOString()
        }];
        localStorage.setItem('restaurants', JSON.stringify(adminData.restaurants));
    }
    
    if (!adminData.menu || Object.keys(adminData.menu).length === 0) {
        adminData.menu = {};
        adminData.menu['1'] = [
            { id: 1, name: 'Osh', price: 35000, category: 'Milliy', desc: "Qo'y go'shti, sabzi", emoji: '🍚', image: '', sku: 'FOOD-001', weight: 500, discount: 0, stock: 99, available: true },
            { id: 2, name: 'Shashlik', price: 18000, category: 'Milliy', desc: 'Mol go\'shti', emoji: '🍢', image: '', sku: 'FOOD-002', weight: 300, discount: 0, stock: 99, available: true }
        ];
        localStorage.setItem('menu', JSON.stringify(adminData.menu));
    }
    
    if (!adminData.couriers || adminData.couriers.length === 0) {
        adminData.couriers = [
            { id: 1, name: 'Ali Valiyev', phone: '+998 90 111 22 33', login: 'courier1', password: '123456', restaurant_id: 1, status: 'offline', latitude: null, longitude: null, rating: 0, total_deliveries: 0 },
            { id: 2, name: 'Sardor Qodirov', phone: '+998 90 222 33 44', login: 'courier2', password: '123456', restaurant_id: 1, status: 'offline', latitude: null, longitude: null, rating: 0, total_deliveries: 0 },
            { id: 3, name: 'Dilshod Rahimov', phone: '+998 90 333 44 55', login: 'courier3', password: '123456', restaurant_id: 1, status: 'offline', latitude: null, longitude: null, rating: 0, total_deliveries: 0 }
        ];
        localStorage.setItem('couriers', JSON.stringify(adminData.couriers));
    }
    
    if (!adminData.orders || adminData.orders.length === 0) {
        adminData.orders = [
            { id: 1001, user: 'Ali', items: 'Osh x2, Shashlik x1', total: 88000, status: 'new', date: '2024-01-15 14:30', restaurant_id: 1 },
            { id: 1002, user: 'Sardor', items: 'Burger x1, Cola x2', total: 56000, status: 'delivering', date: '2024-01-15 13:15', restaurant_id: 1 },
            { id: 1003, user: 'Dilshod', items: 'Pizza x1', total: 45000, status: 'delivered', date: '2024-01-15 12:00', restaurant_id: 1 }
        ];
        localStorage.setItem('orders', JSON.stringify(adminData.orders));
    }
}

var currentFilter = 'all';
var editingFoodId = null;
var editingRestaurantId = null;
var editingCourierId = null;
var foodImageData = null;
var restaurantImageData = null;

// ==========================================
// ELEMENT HELPERS
// ==========================================
function getEl(id) {
    return document.getElementById(id);
}

function getVal(id) {
    var el = getEl(id);
    return el ? el.value : '';
}

function setVal(id, val) {
    var el = getEl(id);
    if (el) el.value = val;
}

function setText(id, text) {
    var el = getEl(id);
    if (el) el.textContent = text;
}

// ==========================================
// IMAGE PREVIEW FUNCTIONS
// ==========================================
function previewRestaurantImage(event) {
    var file = event.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(e) {
        var preview = getEl('restaurantImagePreview');
        if (preview) {
            preview.src = e.target.result;
            preview.classList.remove('hidden');
        }
        var nameEl = getEl('restaurantImageName');
        if (nameEl) nameEl.textContent = file.name;
        restaurantImageData = e.target.result;
    };
    reader.readAsDataURL(file);
}

function previewFoodImage(event) {
    var file = event.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(e) {
        var preview = getEl('foodImagePreview');
        if (preview) {
            preview.src = e.target.result;
            preview.classList.remove('hidden');
        }
        var nameEl = getEl('foodImageName');
        if (nameEl) nameEl.textContent = file.name;
        foodImageData = e.target.result;
    };
    reader.readAsDataURL(file);
}

// ==========================================
// AUTH
// ==========================================
function adminLogin() {
    var login = getVal('adminLogin');
    var pass = getVal('adminPassword');
    var i;
    
    if (!login || !pass) {
        showToast('❌ Login va parolni kiriting!', 'error');
        return;
    }
    
    var admin = null;
    for (i = 0; i < adminData.admins.length; i++) {
        if (adminData.admins[i].login === login && adminData.admins[i].password === pass) {
            admin = adminData.admins[i];
            break;
        }
    }
    
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
    var authPage = getEl('authPage');
    var adminApp = getEl('adminApp');
    if (authPage) authPage.classList.add('active');
    if (adminApp) {
        adminApp.classList.remove('active');
        adminApp.style.display = 'none';
    }
    showToast('👋 Siz chiqdingiz!', 'info');
}

function showAdminApp() {
    var authPage = getEl('authPage');
    var adminApp = getEl('adminApp');
    var nameEl;
    
    if (authPage) authPage.classList.remove('active');
    if (adminApp) {
        adminApp.classList.add('active');
        adminApp.style.display = 'block';
    }
    
    nameEl = getEl('currentRestaurantName');
    if (nameEl) nameEl.textContent = '👑 Super Admin';
    
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

// ==========================================
// NAVIGATION
// ==========================================
function switchPage(page) {
    var pages = document.querySelectorAll('.admin-page');
    var i;
    var target;
    var navBtns;
    var navBtn;
    
    for (i = 0; i < pages.length; i++) {
        pages[i].classList.remove('active');
    }
    target = getEl('page-' + page);
    if (target) target.classList.add('active');
    
    navBtns = document.querySelectorAll('.nav-item');
    for (i = 0; i < navBtns.length; i++) {
        navBtns[i].classList.remove('active');
    }
    navBtn = document.querySelector('[data-page="' + page + '"]');
    if (navBtn) navBtn.classList.add('active');
    
    if (page === 'dashboard') updateDashboard();
    if (page === 'restaurants') renderRestaurants();
    if (page === 'admins') renderAdmins();
    if (page === 'couriers') renderCouriers();
    if (page === 'orders') renderOrders();
    if (page === 'menu') {
        updateMenuRestaurantSelect();
        renderMenu();
    }
    if (tg && tg.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
}

// ==========================================
// DASHBOARD
// ==========================================
function updateDashboard() {
    var elStatRestaurants = getEl('statRestaurants');
    var elStatAdmins = getEl('statAdmins');
    var elStatOrders = getEl('statOrders');
    var elStatRevenue = getEl('statRevenue');
    var revenue = 0;
    var i;
    var recent;
    var container;
    var statusMap;
    var html = '';
    
    if (elStatRestaurants) elStatRestaurants.textContent = adminData.restaurants.length;
    if (elStatAdmins) elStatAdmins.textContent = adminData.admins.length;
    if (elStatOrders) elStatOrders.textContent = adminData.orders.length;
    
    for (i = 0; i < adminData.orders.length; i++) {
        if (adminData.orders[i].status === 'delivered') {
            revenue += adminData.orders[i].total;
        }
    }
    if (elStatRevenue) elStatRevenue.textContent = revenue.toLocaleString() + " so'm";
    
    recent = adminData.orders.slice(-5).reverse();
    container = getEl('recentOrders');
    if (!container) return;
    
    if (!recent.length) {
        container.innerHTML = '<div class="empty-state"><div class="icon">📭</div><div class="title">Buyurtmalar yo\'q</div></div>';
        return;
    }
    
    statusMap = { 'new': 'Yangi', 'ready': 'Tayyor', 'delivering': 'Yo\'lda', 'delivered': 'Yetkazildi', 'cancelled': 'Bekor' };
    html = '';
    for (i = 0; i < recent.length; i++) {
        var o = recent[i];
        html += '<div class="row" style="grid-template-columns:70px 1fr 90px 110px;">' +
            '<span>#' + o.id + '</span>' +
            '<span><strong>' + o.user + '</strong><br><small>' + o.items + '</small></span>' +
            '<span>' + o.total.toLocaleString() + ' so\'m</span>' +
            '<span class="status status-' + o.status + '">' + (statusMap[o.status] || o.status) + '</span>' +
        '</div>';
    }
    container.innerHTML = html;
}

// ==========================================
// RESTAURANTS
// ==========================================
function renderRestaurants() {
    var container = getEl('restaurantsList');
    var i;
    var html = '';
    var r;
    var statusClass;
    var statusText;
    
    if (!container) return;
    
    if (!adminData.restaurants.length) {
        container.innerHTML = '<div class="empty-state"><div class="icon">🏪</div><div class="title">Hali restoranlar yo\'q</div></div>';
        return;
    }
    
    html = '';
    for (i = 0; i < adminData.restaurants.length; i++) {
        r = adminData.restaurants[i];
        statusClass = r.status === 'active' ? 'status-active' : 'status-inactive';
        statusText = r.status === 'active' ? '✅ Faol' : '❌ Faol emas';
        html += '<div class="restaurant-card">' +
            '<div class="info">' +
                '<div class="name">' + r.name + '</div>' +
                '<div class="details">' +
                    '<i class="fas fa-map-marker-alt"></i> ' + (r.address || 'Manzil yo\'q') +
                    '<i class="fas fa-phone" style="margin-left:12px;"></i> ' + (r.phone || 'Tel yo\'q') +
                    (r.hours ? '<i class="fas fa-clock" style="margin-left:12px;"></i> ' + r.hours : '') +
                    (r.image ? '<br><img src="' + r.image + '" style="width:50px;height:50px;border-radius:8px;object-fit:cover;margin-top:4px;">' : '') +
                '</div>' +
            '</div>' +
            '<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">' +
                '<span class="status-badge ' + statusClass + '">' + statusText + '</span>' +
                '<div class="actions">' +
                    '<button class="btn-edit" onclick="editRestaurant(' + r.id + ')"><i class="fas fa-pen"></i> Tahrirlash</button>' +
                    '<button class="btn-toggle" onclick="toggleRestaurant(' + r.id + ')">' + (r.status === 'active' ? '⏸ To\'xtatish' : '▶️ Faollashtirish') + '</button>' +
                    '<button class="btn-delete" onclick="deleteRestaurant(' + r.id + ')"><i class="fas fa-trash"></i> O\'chirish</button>' +
                    '<button class="btn-enter" onclick="selectRestaurant(' + r.id + ')"><i class="fas fa-sign-in-alt"></i> Kirish</button>' +
                '</div>' +
            '</div>' +
        '</div>';
    }
    container.innerHTML = html;
}

function showAddRestaurant() {
    var title;
    var input;
    var nameEl;
    var preview;
    var modal;
    
    editingRestaurantId = null;
    title = getEl('restaurantModalTitle');
    if (title) title.textContent = '🏪 Yangi restoran';
    setVal('restaurantName', '');
    setVal('restaurantAddress', '');
    setVal('restaurantPhone', '');
    setVal('restaurantHours', '09:00 - 23:00');
    setVal('restaurantEditId', '');
    
    input = getEl('restaurantImageInput');
    if (input) input.value = '';
    nameEl = getEl('restaurantImageName');
    if (nameEl) nameEl.textContent = 'Fayl tanlanmagan';
    preview = getEl('restaurantImagePreview');
    if (preview) preview.classList.add('hidden');
    restaurantImageData = null;
    
    modal = getEl('restaurantModal');
    if (modal) modal.classList.add('active');
}

function editRestaurant(id) {
    var r = null;
    var i;
    var title;
    var preview;
    var nameEl;
    var modal;
    
    for (i = 0; i < adminData.restaurants.length; i++) {
        if (adminData.restaurants[i].id === id) {
            r = adminData.restaurants[i];
            break;
        }
    }
    if (!r) return;
    editingRestaurantId = id;
    title = getEl('restaurantModalTitle');
    if (title) title.textContent = '✏️ Restoran tahrirlash';
    setVal('restaurantName', r.name);
    setVal('restaurantAddress', r.address || '');
    setVal('restaurantPhone', r.phone || '');
    setVal('restaurantHours', r.hours || '09:00 - 23:00');
    setVal('restaurantEditId', id);
    
    preview = getEl('restaurantImagePreview');
    nameEl = getEl('restaurantImageName');
    if (r.image) {
        if (preview) {
            preview.src = r.image;
            preview.classList.remove('hidden');
        }
        if (nameEl) nameEl.textContent = 'Mavjud rasm';
        restaurantImageData = r.image;
    } else {
        if (preview) preview.classList.add('hidden');
        if (nameEl) nameEl.textContent = 'Fayl tanlanmagan';
        restaurantImageData = null;
    }
    
    modal = getEl('restaurantModal');
    if (modal) modal.classList.add('active');
}

function saveRestaurant() {
    var name = getVal('restaurantName');
    var address = getVal('restaurantAddress');
    var phone = getVal('restaurantPhone');
    var hours = getVal('restaurantHours');
    var editId = getVal('restaurantEditId');
    var image = restaurantImageData || '';
    var r = null;
    var i;
    var newId = 1;
    var modal;
    
    if (!name) {
        showToast('❌ Restoran nomini kiriting!', 'error');
        return;
    }
    
    if (editId) {
        for (i = 0; i < adminData.restaurants.length; i++) {
            if (adminData.restaurants[i].id === parseInt(editId)) {
                r = adminData.restaurants[i];
                break;
            }
        }
        if (r) {
            r.name = name;
            r.address = address;
            r.phone = phone;
            r.image = image;
            r.hours = hours;
        }
    } else {
        for (i = 0; i < adminData.restaurants.length; i++) {
            if (adminData.restaurants[i].id >= newId) newId = adminData.restaurants[i].id + 1;
        }
        adminData.restaurants.push({
            id: newId,
            name: name,
            address: address,
            phone: phone,
            image: image,
            hours: hours,
            status: 'active',
            createdAt: new Date().toISOString()
        });
        adminData.menu[newId] = [];
        localStorage.setItem('menu', JSON.stringify(adminData.menu));
    }
    
    localStorage.setItem('restaurants', JSON.stringify(adminData.restaurants));
    modal = getEl('restaurantModal');
    if (modal) modal.classList.remove('active');
    renderRestaurants();
    updateMenuRestaurantSelect();
    showToast('✅ Restoran saqlandi!', 'success');
}

function toggleRestaurant(id) {
    var i;
    var r = null;
    for (i = 0; i < adminData.restaurants.length; i++) {
        if (adminData.restaurants[i].id === id) {
            r = adminData.restaurants[i];
            break;
        }
    }
    if (r) {
        r.status = r.status === 'active' ? 'inactive' : 'active';
        localStorage.setItem('restaurants', JSON.stringify(adminData.restaurants));
        renderRestaurants();
        showToast('🏪 ' + r.name + ' ' + (r.status === 'active' ? 'faollashtirildi' : 'to\'xtatildi'), 'info');
    }
}

function deleteRestaurant(id) {
    var i;
    if (!confirm('Bu restoran va uning barcha ma\'lumotlarini o\'chirmoqchimisiz?')) return;
    adminData.restaurants = [];
    for (i = 0; i < adminData.restaurants.length; i++) {
        if (adminData.restaurants[i].id !== id) {
            adminData.restaurants.push(adminData.restaurants[i]);
        }
    }
    delete adminData.menu[id];
    localStorage.setItem('restaurants', JSON.stringify(adminData.restaurants));
    localStorage.setItem('menu', JSON.stringify(adminData.menu));
    renderRestaurants();
    updateMenuRestaurantSelect();
    showToast('🗑 Restoran o\'chirildi!', 'success');
}

function selectRestaurant(id) {
    var restaurant = null;
    var i;
    var select;
    for (i = 0; i < adminData.restaurants.length; i++) {
        if (adminData.restaurants[i].id === id) {
            restaurant = adminData.restaurants[i];
            break;
        }
    }
    if (!restaurant) return;
    select = getEl('menuRestaurantSelect');
    if (select) select.value = id;
    renderMenu();
    showToast('🏪 ' + restaurant.name + ' ga kirdingiz!', 'success');
    switchPage('menu');
}

// ==========================================
// ADMINS
// ==========================================
function renderAdmins() {
    var container = getEl('adminsList');
    var i;
    var html = '';
    var a;
    var restaurant;
    
    if (!container) return;
    
    html = '<div class="row header" style="grid-template-columns:1fr 1fr 1fr 1fr;"><span>Login</span><span>Restoran</span><span>Rol</span><span>Holat</span></div>';
    for (i = 0; i < adminData.admins.length; i++) {
        a = adminData.admins[i];
        restaurant = null;
        if (a.restaurantId) {
            for (var j = 0; j < adminData.restaurants.length; j++) {
                if (adminData.restaurants[j].id == a.restaurantId) {
                    restaurant = adminData.restaurants[j];
                    break;
                }
            }
        }
        html += '<div class="row" style="grid-template-columns:1fr 1fr 1fr 1fr;">' +
            '<span><strong>' + a.login + '</strong></span>' +
            '<span>' + (restaurant ? restaurant.name : '👑 Barcha') + '</span>' +
            '<span>' + (a.role === 'super_admin' ? '👑 Super Admin' : '👤 Admin') + '</span>' +
            '<span style="display:flex;gap:6px;align-items:center;">' +
                '<span class="status-badge status-active">✅ Faol</span>' +
                (a.role !== 'super_admin' ? '<button class="btn-danger" onclick="deleteAdmin(' + a.id + ')" style="padding:4px 10px;border:none;border-radius:8px;cursor:pointer;font-size:12px;font-weight:700;">🗑 O\'chirish</button>' : '') +
            '</span>' +
        '</div>';
    }
    container.innerHTML = html;
}

function showAddAdmin() {
    var modal = getEl('adminModal');
    var select = getEl('adminNewRestaurant');
    var i;
    var options;
    if (modal) modal.classList.add('active');
    setVal('adminNewLogin', '');
    setVal('adminNewPassword', '');
    if (select) {
        options = '<option value="">👑 Super Admin (barcha)</option>';
        for (i = 0; i < adminData.restaurants.length; i++) {
            options += '<option value="' + adminData.restaurants[i].id + '">' + adminData.restaurants[i].name + '</option>';
        }
        select.innerHTML = options;
    }
}

function saveAdmin() {
    var login = getVal('adminNewLogin');
    var password = getVal('adminNewPassword');
    var restaurantId = getVal('adminNewRestaurant');
    var existing = null;
    var i;
    var newId = 1;
    
    if (!login || !password) {
        showToast('❌ Login va parolni kiriting!', 'error');
        return;
    }
    
    for (i = 0; i < adminData.admins.length; i++) {
        if (adminData.admins[i].login === login) {
            existing = adminData.admins[i];
            break;
        }
    }
    if (existing) {
        showToast('❌ Bu login allaqachon mavjud!', 'error');
        return;
    }
    
    for (i = 0; i < adminData.admins.length; i++) {
        if (adminData.admins[i].id >= newId) newId = adminData.admins[i].id + 1;
    }
    
    adminData.admins.push({
        id: newId,
        login: login,
        password: password,
        role: restaurantId ? 'admin' : 'super_admin',
        restaurantId: restaurantId || null,
        createdAt: new Date().toISOString()
    });
    
    localStorage.setItem('admins', JSON.stringify(adminData.admins));
    var modal = getEl('adminModal');
    if (modal) modal.classList.remove('active');
    renderAdmins();
    showToast('✅ Admin qo\'shildi!', 'success');
}

function deleteAdmin(id) {
    var i;
    if (!confirm('Bu adminni o\'chirmoqchimisiz?')) return;
    adminData.admins = [];
    for (i = 0; i < adminData.admins.length; i++) {
        if (adminData.admins[i].id !== id) {
            adminData.admins.push(adminData.admins[i]);
        }
    }
    localStorage.setItem('admins', JSON.stringify(adminData.admins));
    renderAdmins();
    showToast('🗑 Admin o\'chirildi!', 'success');
}

// ==========================================
// COURIERS
// ==========================================
function renderCouriers() {
    var container = getEl('couriersList');
    var i;
    var c;
    var restaurant;
    var statusClass;
    var statusText;
    var html = '';
    
    if (!container) return;
    
    if (!adminData.couriers.length) {
        container.innerHTML = '<div class="empty-state"><div class="icon">🚕</div><div class="title">Hali kuryerlar yo\'q</div><div style="font-size:14px;color:var(--text-3);">"Yangi kuryer qo\'shish" tugmasini bosing</div></div>';
        return;
    }
    
    html = '<div class="row header" style="grid-template-columns:60px 1fr 100px 80px 120px 120px;">' +
        '<span>#ID</span><span>Ism / Restoran</span><span>Telefon</span><span>Holat</span><span>Lokatsiya</span><span>Amallar</span>' +
    '</div>';
    
    for (i = 0; i < adminData.couriers.length; i++) {
        c = adminData.couriers[i];
        restaurant = null;
        for (var j = 0; j < adminData.restaurants.length; j++) {
            if (adminData.restaurants[j].id == c.restaurant_id) {
                restaurant = adminData.restaurants[j];
                break;
            }
        }
        statusClass = c.status === 'online' ? 'status-active' : 'status-inactive';
        statusText = c.status === 'online' ? '🟢 Online' : '🔴 Offline';
        html += '<div class="row" style="grid-template-columns:60px 1fr 100px 80px 120px 120px;">' +
            '<span>#' + c.id + '</span>' +
            '<span><strong>' + c.name + '</strong><br><small style="color:var(--text-3);">' + (restaurant ? restaurant.name : 'Restoran yo\'q') + '</small></span>' +
            '<span>' + c.phone + '</span>' +
            '<span><span class="status-badge ' + statusClass + '">' + statusText + '</span></span>' +
            '<span>' + (c.latitude && c.longitude ? '📍 ' + c.latitude.toFixed(4) + ', ' + c.longitude.toFixed(4) : '📍 Noma\'lum') + '</span>' +
            '<span>' +
                '<button class="btn-edit" onclick="editCourier(' + c.id + ')" title="Tahrirlash"><i class="fas fa-pen"></i></button>' +
                '<button class="btn-delete" onclick="deleteCourier(' + c.id + ')" title="O\'chirish"><i class="fas fa-trash"></i></button>' +
                (c.status === 'online' ?
                    '<button class="btn-warning" onclick="toggleCourierStatus(' + c.id + ', \'offline\')" title="Offline qilish"><i class="fas fa-pause"></i></button>' :
                    '<button class="btn-success" onclick="toggleCourierStatus(' + c.id + ', \'online\')" title="Online qilish"><i class="fas fa-play"></i></button>'
                ) +
            '</span>' +
        '</div>';
    }
    container.innerHTML = html;
}

function showAddCourier() {
    var title = getEl('courierModalTitle');
    var select = getEl('courierRestaurant');
    var i;
    var options;
    var modal;
    
    if (title) title.textContent = '🚕 Yangi kuryer';
    setVal('courierName', '');
    setVal('courierPhone', '');
    setVal('courierLogin', '');
    setVal('courierPassword', '');
    setVal('courierEditId', '');
    
    if (select) {
        options = '';
        for (i = 0; i < adminData.restaurants.length; i++) {
            options += '<option value="' + adminData.restaurants[i].id + '">' + adminData.restaurants[i].name + '</option>';
        }
        select.innerHTML = options || '<option value="">Avval restoran qo\'shing</option>';
    }
    
    modal = getEl('courierModal');
    if (modal) modal.classList.add('active');
}

function saveCourier() {
    var name = getVal('courierName');
    var phone = getVal('courierPhone');
    var login = getVal('courierLogin');
    var password = getVal('courierPassword');
    var restaurant_id = getVal('courierRestaurant');
    var editId = getVal('courierEditId');
    var existing = null;
    var i;
    var index = -1;
    var newId = 1;
    
    if (!name || !phone || !login || !password) {
        showToast('❌ Barcha maydonlarni to\'ldiring!', 'error');
        return;
    }
    if (!restaurant_id) {
        showToast('❌ Iltimos, restoran tanlang!', 'error');
        return;
    }
    
    for (i = 0; i < adminData.couriers.length; i++) {
        if (adminData.couriers[i].login === login && adminData.couriers[i].id != editId) {
            existing = adminData.couriers[i];
            break;
        }
    }
    if (existing) {
        showToast('❌ Bu login allaqachon mavjud!', 'error');
        return;
    }
    
    if (editId) {
        for (i = 0; i < adminData.couriers.length; i++) {
            if (adminData.couriers[i].id == editId) {
                index = i;
                break;
            }
        }
        if (index !== -1) {
            adminData.couriers[index] = {
                id: adminData.couriers[index].id,
                name: name,
                phone: phone,
                login: login,
                password: password,
                restaurant_id: parseInt(restaurant_id),
                status: adminData.couriers[index].status,
                latitude: adminData.couriers[index].latitude,
                longitude: adminData.couriers[index].longitude,
                last_location_update: adminData.couriers[index].last_location_update,
                rating: adminData.couriers[index].rating,
                total_deliveries: adminData.couriers[index].total_deliveries,
                created_at: adminData.couriers[index].created_at
            };
        }
    } else {
        for (i = 0; i < adminData.couriers.length; i++) {
            if (adminData.couriers[i].id >= newId) newId = adminData.couriers[i].id + 1;
        }
        adminData.couriers.push({
            id: newId,
            name: name,
            phone: phone,
            login: login,
            password: password,
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
    
    localStorage.setItem('couriers', JSON.stringify(adminData.couriers));
    var modal = getEl('courierModal');
    if (modal) modal.classList.remove('active');
    renderCouriers();
    showToast('✅ Kuryer saqlandi!', 'success');
}

function editCourier(id) {
    var courier = null;
    var i;
    var title;
    var modal;
    
    for (i = 0; i < adminData.couriers.length; i++) {
        if (adminData.couriers[i].id === id) {
            courier = adminData.couriers[i];
            break;
        }
    }
    if (!courier) return;
    
    title = getEl('courierModalTitle');
    if (title) title.textContent = '✏️ Kuryer tahrirlash';
    setVal('courierName', courier.name);
    setVal('courierPhone', courier.phone);
    setVal('courierLogin', courier.login);
    setVal('courierPassword', courier.password);
    setVal('courierRestaurant', courier.restaurant_id);
    setVal('courierEditId', id);
    
    modal = getEl('courierModal');
    if (modal) modal.classList.add('active');
}

function deleteCourier(id) {
    var i;
    if (!confirm('Bu kuryerni o\'chirmoqchimisiz?')) return;
    adminData.couriers = [];
    for (i = 0; i < adminData.couriers.length; i++) {
        if (adminData.couriers[i].id !== id) {
            adminData.couriers.push(adminData.couriers[i]);
        }
    }
    localStorage.setItem('couriers', JSON.stringify(adminData.couriers));
    renderCouriers();
    showToast('🗑 Kuryer o\'chirildi!', 'success');
}

function toggleCourierStatus(id, status) {
    var courier = null;
    var i;
    
    for (i = 0; i < adminData.couriers.length; i++) {
        if (adminData.couriers[i].id === id) {
            courier = adminData.couriers[i];
            break;
        }
    }
    if (courier) {
        courier.status = status;
        if (status === 'online') {
            courier.last_location_update = new Date().toISOString();
            courier.latitude = 41.2995 + (Math.random() - 0.5) * 0.01;
            courier.longitude = 69.2401 + (Math.random() - 0.5) * 0.01;
        }
        localStorage.setItem('couriers', JSON.stringify(adminData.couriers));
        renderCouriers();
        showToast('✅ Kuryer ' + (status === 'online' ? 'online' : 'offline') + ' qilindi!', 'success');
    }
}

// ==========================================
// ORDERS
// ==========================================
function filterOrders(status) {
    currentFilter = status;
    renderOrders();
}

function renderOrders() {
    var container = getEl('ordersList');
    var orders = [];
    var i;
    var o;
    var restaurant;
    var statusMap;
    var html = '';
    var actions = '';
    
    if (!container) return;
    
    if (currentFilter !== 'all') {
        for (i = 0; i < adminData.orders.length; i++) {
            if (adminData.orders[i].status === currentFilter) {
                orders.push(adminData.orders[i]);
            }
        }
    } else {
        orders = adminData.orders;
    }
    
    if (!orders.length) {
        container.innerHTML = '<div class="empty-state"><div class="icon">📭</div><div class="title">Buyurtmalar yo\'q</div></div>';
        return;
    }
    
    statusMap = { 'new': 'Yangi', 'ready': 'Tayyor', 'delivering': 'Yo\'lda', 'delivered': 'Yetkazildi', 'cancelled': 'Bekor' };
    html = '<div class="row header" style="grid-template-columns:70px 1fr 90px 1fr;"><span>#ID</span><span>Restoran / Mijoz</span><span>Summa</span><span>Holat</span></div>';
    
    for (i = 0; i < orders.length; i++) {
        o = orders[i];
        restaurant = null;
        for (var j = 0; j < adminData.restaurants.length; j++) {
            if (adminData.restaurants[j].id == o.restaurant_id) {
                restaurant = adminData.restaurants[j];
                break;
            }
        }
        actions = '';
        if (o.status !== 'new') actions += '<button class="btn-success" onclick="changeOrderStatus(' + o.id + ', \'new\')" title="Yangi">🆕</button>';
        if (o.status !== 'ready') actions += '<button class="btn-warning" onclick="changeOrderStatus(' + o.id + ', \'ready\')" title="Tayyor">🔥</button>';
        if (o.status !== 'delivering') actions += '<button class="btn-info" onclick="changeOrderStatus(' + o.id + ', \'delivering\')" title="Yo\'lda">🚕</button>';
        if (o.status !== 'delivered') actions += '<button class="btn-success" onclick="changeOrderStatus(' + o.id + ', \'delivered\')" title="Yetkazildi">✅</button>';
        
        html += '<div class="row" style="grid-template-columns:70px 1fr 90px 1fr;">' +
            '<span>#' + o.id + '</span>' +
            '<span><strong>' + (restaurant ? restaurant.name : 'Noma\'lum') + '</strong><br><small>' + (o.user_name || o.user) + ': ' + o.items + '</small></span>' +
            '<span>' + o.total_price.toLocaleString() + ' so\'m</span>' +
            '<span style="display:flex;align-items:center;gap:4px;flex-wrap:wrap;">' +
                '<span class="status status-' + o.status + '">' + (statusMap[o.status] || o.status) + '</span>' +
                '<div class="actions">' + actions + '</div>' +
            '</span>' +
        '</div>';
    }
    container.innerHTML = html;
}

function changeOrderStatus(id, status) {
    var i;
    var order = null;
    for (i = 0; i < adminData.orders.length; i++) {
        if (adminData.orders[i].id === id) {
            order = adminData.orders[i];
            break;
        }
    }
    if (!order) return;
    order.status = status;
    localStorage.setItem('orders', JSON.stringify(adminData.orders));
    renderOrders();
    updateDashboard();
    showToast('✅ Buyurtma #' + id + ' — ' + status, 'success');
}

// ==========================================
// MENU
// ==========================================
function updateMenuRestaurantSelect() {
    var select = getEl('menuRestaurantSelect');
    var i;
    var options;
    if (!select) return;
    options = '<option value="">Restoran tanlang</option>';
    for (i = 0; i < adminData.restaurants.length; i++) {
        options += '<option value="' + adminData.restaurants[i].id + '">' + adminData.restaurants[i].name + '</option>';
    }
    select.innerHTML = options;
}

function renderMenu() {
    var container = getEl('menuList');
    var restaurantId = getVal('menuRestaurantSelect');
    var items = [];
    var i;
    var html = '';
    var item;
    
    if (!container) return;
    
    if (!restaurantId) {
        container.innerHTML = '<div class="empty-state"><div class="icon">🏪</div><div class="title">Iltimos, restoran tanlang</div></div>';
        return;
    }
    
    if (adminData.menu[restaurantId]) {
        items = adminData.menu[restaurantId];
    }
    
    if (!items.length) {
        container.innerHTML = '<div class="empty-state"><div class="icon">🍽</div><div class="title">Hali taomlar yo\'q</div></div>';
        return;
    }
    
    html = '';
    for (i = 0; i < items.length; i++) {
        item = items[i];
        html += '<div class="menu-item-admin">' +
            '<div class="image">' + (item.image ? '<img src="' + item.image + '">' : '<span class="no-image">' + (item.emoji || '🍽') + '</span>') + '</div>' +
            '<div class="info">' +
                '<div class="name">' + item.name + '</div>' +
                '<div><span class="price">' + item.price.toLocaleString() + ' so\'m</span><span class="category"> • ' + item.category + '</span>' + (item.discount > 0 ? '<span style="color:var(--danger);font-weight:700;"> -' + item.discount + '%</span>' : '') + '</div>' +
                '<div style="font-size:12px;color:var(--text-3);">' + (item.desc || '') + (item.stock !== undefined ? ' • ' + item.stock + ' dona' : '') + '</div>' +
            '</div>' +
            '<div class="actions">' +
                '<button class="btn-edit" onclick="editFood(' + item.id + ', \'' + restaurantId + '\')"><i class="fas fa-pen"></i> Tahrirlash</button>' +
                '<button class="btn-delete" onclick="deleteFood(' + item.id + ', \'' + restaurantId + '\')"><i class="fas fa-trash"></i> O\'chirish</button>' +
                '<div class="toggle ' + (item.available ? 'active' : '') + '" onclick="toggleFood(' + item.id + ', \'' + restaurantId + '\')"><div class="dot"></div></div>' +
            '</div>' +
        '</div>';
    }
    container.innerHTML = html;
}

function showAddFood() {
    var restaurantId = getVal('menuRestaurantSelect');
    var title;
    var input;
    var nameEl;
    var preview;
    var modal;
    
    if (!restaurantId) {
        showToast('❌ Iltimos, restoran tanlang!', 'error');
        return;
    }
    
    editingFoodId = null;
    title = getEl('foodModalTitle');
    if (title) title.textContent = '➕ Yangi taom';
    setVal('foodName', '');
    setVal('foodPrice', '');
    setVal('foodCategory', '');
    setVal('foodDesc', '');
    setVal('foodEmoji', '🍽');
    setVal('foodDiscount', '0');
    setVal('foodStock', '99');
    setVal('foodEditId', '');
    setVal('foodRestaurantId', restaurantId);
    
    input = getEl('foodImageInput');
    if (input) input.value = '';
    nameEl = getEl('foodImageName');
    if (nameEl) nameEl.textContent = 'Fayl tanlanmagan';
    preview = getEl('foodImagePreview');
    if (preview) preview.classList.add('hidden');
    foodImageData = null;
    
    modal = getEl('foodModal');
    if (modal) modal.classList.add('active');
}

function editFood(id, restaurantId) {
    var items = adminData.menu[restaurantId] || [];
    var item = null;
    var i;
    var title;
    var preview;
    var nameEl;
    var modal;
    
    for (i = 0; i < items.length; i++) {
        if (items[i].id === id) {
            item = items[i];
            break;
        }
    }
    if (!item) return;
    
    editingFoodId = id;
    title = getEl('foodModalTitle');
    if (title) title.textContent = '✏️ Taom tahrirlash';
    setVal('foodName', item.name);
    setVal('foodPrice', item.price);
    setVal('foodCategory', item.category);
    setVal('foodDesc', item.desc || '');
    setVal('foodEmoji', item.emoji || '🍽');
    setVal('foodDiscount', item.discount || 0);
    setVal('foodStock', item.stock || 99);
    setVal('foodEditId', id);
    setVal('foodRestaurantId', restaurantId);
    
    preview = getEl('foodImagePreview');
    nameEl = getEl('foodImageName');
    if (item.image) {
        if (preview) {
            preview.src = item.image;
            preview.classList.remove('hidden');
        }
        if (nameEl) nameEl.textContent = 'Mavjud rasm';
        foodImageData = item.image;
    } else {
        if (preview) preview.classList.add('hidden');
        if (nameEl) nameEl.textContent = 'Fayl tanlanmagan';
        foodImageData = null;
    }
    
    modal = getEl('foodModal');
    if (modal) modal.classList.add('active');
}

function saveFood() {
    var restaurantId = getVal('foodRestaurantId');
    var name = getVal('foodName');
    var price = parseInt(getVal('foodPrice')) || 0;
    var category = getVal('foodCategory');
    var desc = getVal('foodDesc');
    var emoji = getVal('foodEmoji') || '🍽';
    var discount = parseInt(getVal('foodDiscount')) || 0;
    var stock = parseInt(getVal('foodStock')) || 0;
    var editId = getVal('foodEditId');
    var image = foodImageData || '';
    var items = [];
    var i;
    var item;
    var newId = 1;
    
    if (!restaurantId) {
        showToast('❌ Restoran ID topilmadi!', 'error');
        return;
    }
    
    if (!name || !price || !category) {
        showToast('Barcha maydonlarni to\'ldiring!', 'error');
        return;
    }
    
    if (!adminData.menu[restaurantId]) adminData.menu[restaurantId] = [];
    
    if (editId) {
        items = adminData.menu[restaurantId];
        for (i = 0; i < items.length; i++) {
            if (items[i].id === parseInt(editId)) {
                item = items[i];
                break;
            }
        }
        if (item) {
            item.name = name;
            item.price = price;
            item.category = category;
            item.desc = desc;
            item.emoji = emoji;
            item.image = image;
            item.discount = discount;
            item.stock = stock;
        }
    } else {
        for (i = 0; i < adminData.menu[restaurantId].length; i++) {
            if (adminData.menu[restaurantId][i].id >= newId) newId = adminData.menu[restaurantId][i].id + 1;
        }
        adminData.menu[restaurantId].push({
            id: newId,
            name: name,
            price: price,
            category: category,
            desc: desc,
            emoji: emoji,
            image: image,
            discount: discount,
            stock: stock,
            available: true
        });
    }
    
    localStorage.setItem('menu', JSON.stringify(adminData.menu));
    var modal = getEl('foodModal');
    if (modal) modal.classList.remove('active');
    renderMenu();
    showToast('✅ Taom saqlandi!', 'success');
}

function deleteFood(id, restaurantId) {
    var items = adminData.menu[restaurantId] || [];
    var i;
    
    if (!confirm('Bu taomni o\'chirmoqchimisiz?')) return;
    
    adminData.menu[restaurantId] = [];
    for (i = 0; i < items.length; i++) {
        if (items[i].id !== id) {
            adminData.menu[restaurantId].push(items[i]);
        }
    }
    localStorage.setItem('menu', JSON.stringify(adminData.menu));
    renderMenu();
    showToast('🗑 Taom o\'chirildi!', 'success');
}

function toggleFood(id, restaurantId) {
    var items = adminData.menu[restaurantId] || [];
    var i;
    var item = null;
    
    for (i = 0; i < items.length; i++) {
        if (items[i].id === id) {
            item = items[i];
            break;
        }
    }
    if (item) {
        item.available = !item.available;
        localStorage.setItem('menu', JSON.stringify(adminData.menu));
        renderMenu();
    }
}

// ==========================================
// BROADCAST
// ==========================================
function sendBroadcast() {
    var text = getVal('broadcastText');
    if (!text) {
        showToast('Xabar matnini kiriting!', 'error');
        return;
    }
    if (tg && tg.sendData) {
        tg.sendData(JSON.stringify({ action: 'broadcast', message: text }));
    }
    setVal('broadcastText', '');
    showToast('✅ Xabar yuborilmoqda...', 'success');
}

// ==========================================
// SETTINGS
// ==========================================
function loadSettings() {
    var s = adminData.settings;
    setVal('settingRestaurant', s.restaurant || 'FoodExpress');
    setVal('settingPhone', s.phone || '+998 90 123 45 67');
    setVal('settingAddress', s.address || 'Toshkent sh., Chilonzor');
    setVal('settingDelivery', s.deliveryPrice || 10000);
    setVal('settingFreeFrom', s.freeFrom || 100000);
}

function saveSettings() {
    adminData.settings = {
        restaurant: getVal('settingRestaurant'),
        phone: getVal('settingPhone'),
        address: getVal('settingAddress'),
        deliveryPrice: parseInt(getVal('settingDelivery')) || 10000,
        freeFrom: parseInt(getVal('settingFreeFrom')) || 100000
    };
    localStorage.setItem('settings', JSON.stringify(adminData.settings));
    showToast('✅ Sozlamalar saqlandi!', 'success');
}

// ==========================================
// MODAL HELPERS
// ==========================================
function closeModal(id) {
    var el = getEl(id);
    if (el) el.classList.remove('active');
}

var modalOverlays = document.querySelectorAll('.modal-overlay');
var modalIndex;
for (modalIndex = 0; modalIndex < modalOverlays.length; modalIndex++) {
    (function(el) {
        el.addEventListener('click', function(e) {
            if (e.target === this) this.classList.remove('active');
        });
    })(modalOverlays[modalIndex]);
}

// ==========================================
// INIT
// ==========================================
function init() {
    var authPage;
    var adminApp;
    
    loadAdminData();
    initDefaultData();
    
    console.log('🏪 Super Admin ishga tushdi!');
    console.log('Login: admin | Parol: admin123');
    console.log('📸 Rasm yuklash tayyor!');
    console.log('Restoranlar:', adminData.restaurants.length);
    console.log('Adminlar:', adminData.admins.length);
    console.log('Kuryerlar:', adminData.couriers.length);
    
    if (adminData.currentAdmin) {
        showAdminApp();
    } else {
        authPage = getEl('authPage');
        adminApp = getEl('adminApp');
        if (authPage) {
            authPage.classList.add('active');
            authPage.style.display = 'flex';
        }
        if (adminApp) {
            adminApp.classList.remove('active');
            adminApp.style.display = 'none';
        }
    }
}

// DOM yuklanganda ishga tushirish
if (document.addEventListener) {
    document.addEventListener('DOMContentLoaded', init);
} else {
    document.onreadystatechange = function() {
        if (document.readyState === 'interactive' || document.readyState === 'complete') {
            init();
        }
    };
}

// Enter tugmasi
document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        var active = document.activeElement;
        if (active && (active.id === 'adminLogin' || active.id === 'adminPassword')) {
            adminLogin();
        }
    }
});