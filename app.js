// ============================================
// TELEGRAM
// ============================================
const tg = window.Telegram?.WebApp;
if (tg) {
    tg.expand();
    tg.ready();
    tg.setHeaderColor('#FFFFFF');
    tg.setBackgroundColor('#F8F9FA');
}

// ============================================
// TOAST
// ============================================
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast show ' + type;
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => { toast.classList.remove('show'); }, 3000);
}

// ============================================
// DATA
// ============================================
let usersDB = JSON.parse(localStorage.getItem('usersDB') || '[]');
let currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
let cart = {};
let currentTab = 'home';
let orderPollingInterval = null;

const menuData = [
    { id: 1, name: "Osh", price: 35000, emoji: "🍚", category: "Milliy", desc: "Qo'y go'shti, sabzi" },
    { id: 2, name: "Shashlik", price: 18000, emoji: "🍢", category: "Milliy", desc: "Mol go'shti" },
    { id: 3, name: "Burger", price: 32000, emoji: "🍔", category: "Fast Food", desc: "Dabl chizburger" },
    { id: 4, name: "Pizza", price: 45000, emoji: "🍕", category: "Fast Food", desc: "Pepperoni" },
    { id: 5, name: "Manti", price: 8000, emoji: "🥟", category: "Milliy", desc: "Bug'da pishirilgan" },
    { id: 6, name: "Lavash", price: 28000, emoji: "🌯", category: "Fast Food", desc: "Tovuq go'shti" },
    { id: 7, name: "Lag'mon", price: 28000, emoji: "🍜", category: "Milliy", desc: "Qo'y go'shti" },
    { id: 8, name: "Coffee", price: 15000, emoji: "☕", category: "Ichimlik", desc: "Kapuchino" },
    { id: 9, name: "Cola", price: 12000, emoji: "🥤", category: "Ichimlik", desc: "1 litr" },
    { id: 10, name: "Tort", price: 25000, emoji: "🍰", category: "Desert", desc: "Shokoladli" },
    { id: 11, name: "Moroz", price: 10000, emoji: "🍦", category: "Desert", desc: "Muzqaymoq" },
    { id: 12, name: "Smuzi", price: 18000, emoji: "🥤", category: "Ichimlik", desc: "Meva" },
];

// ============================================
// AUTH
// ============================================
function showLogin() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
}

function showRegister() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
}

function handleRegister() {
    const name = document.getElementById('regName').value.trim();
    const phone = document.getElementById('regPhone').value.trim();
    const password = document.getElementById('regPassword').value.trim();

    if (!name || !phone || !password) {
        showToast('Barcha maydonlarni to\'ldiring!', 'error');
        return;
    }

    const phoneRegex = /^\+?998[0-9]{9}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
        showToast('Telefon raqamni to\'g\'ri kiriting! (+998901234567)', 'error');
        return;
    }

    if (usersDB.find(u => u.phone === phone)) {
        showToast('Bu raqam allaqachon ro\'yxatdan o\'tgan!', 'error');
        return;
    }

    const user = { name, phone, password, orders: [], bonus: 5000, spent: 0, registeredAt: new Date().toISOString() };
    usersDB.push(user);
    localStorage.setItem('usersDB', JSON.stringify(usersDB));

    currentUser = user;
    localStorage.setItem('currentUser', JSON.stringify(user));

    if (tg?.sendData) {
        tg.sendData(JSON.stringify({ action: 'register', name, phone }));
    }

    showToast('✅ Ro\'yxatdan o\'tdingiz! Sizga 5000 bonus berildi!', 'success');
    showMainApp();
}

function handleLogin() {
    const name = document.getElementById('loginName').value.trim();
    const phone = document.getElementById('loginPhone').value.trim();

    if (!name || !phone) {
        showToast('Ism va telefon raqamni kiriting!', 'error');
        return;
    }

    const user = usersDB.find(u => u.phone === phone && u.name === name);
    if (!user) {
        showToast('Foydalanuvchi topilmadi! Ro\'yxatdan o\'ting.', 'error');
        return;
    }

    currentUser = user;
    localStorage.setItem('currentUser', JSON.stringify(user));

    if (tg?.sendData) {
        tg.sendData(JSON.stringify({ action: 'login', phone }));
    }

    showToast('✅ Xush kelibsiz, ' + name + '!', 'success');
    showMainApp();
}

function loginWithTelegram() {
    if (tg?.initDataUnsafe?.user) {
        const u = tg.initDataUnsafe.user;
        const name = u.first_name || 'Mehmon';
        const phone = u.username || 'tg_' + u.id;

        let user = usersDB.find(u => u.phone === phone);
        if (!user) {
            user = { name, phone, password: 'telegram', orders: [], bonus: 5000, spent: 0,
            registeredAt: new Date().toISOString() };
            usersDB.push(user);
            localStorage.setItem('usersDB', JSON.stringify(usersDB));
        }

        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        showToast('✅ Telegram orqali kirdingiz!', 'success');
        showMainApp();
    } else {
        showToast('Telegram orqali kirish faqat bot ichida ishlaydi', 'error');
    }
}

function logout() {
    localStorage.removeItem('currentUser');
    currentUser = null;
    if (orderPollingInterval) { clearInterval(orderPollingInterval);
        orderPollingInterval = null; }
    document.getElementById('tabBar').classList.remove('active');
    document.getElementById('cartFloat').classList.remove('show');
    document.getElementById('mainApp').classList.remove('active');
    showLogin();
    showToast('👋 Siz chiqdingiz!', 'info');
}

// ============================================
// MAIN APP
// ============================================
function showMainApp() {
    document.getElementById('authPage').classList.remove('active');
    document.getElementById('mainApp').classList.add('active');
    document.getElementById('tabBar').classList.add('active');
    document.getElementById('userName').textContent = currentUser.name;
    if (currentUser.address) document.getElementById('userAddress').textContent = currentUser.address;
    renderCategories();
    renderMenu();
    updateProfile();
    updateCart();
    switchTab('home');
    startOrderPolling();
}

// ============================================
// ORDER POLLING (Real-time)
// ============================================
function startOrderPolling() {
    if (orderPollingInterval) clearInterval(orderPollingInterval);
    orderPollingInterval = setInterval(() => {
        if (currentUser) {
            renderOrders();
            renderActiveOrders();
        }
    }, 5000); // Har 5 soniyada yangilanadi
}

// ============================================
// CATEGORIES
// ============================================
function getCategories() {
    return ['Barcha taomlar', ...new Set(menuData.map(i => i.category))];
}

function renderCategories() {
    const cats = getCategories();
    const emojis = { 'Barcha taomlar': '🍽', 'Milliy': '🥘', 'Fast Food': '🍔', 'Ichimlik': '🥤', 'Desert': '🍰' };
    document.getElementById('categories').innerHTML = cats.map(cat =>
        `<button class="cat-chip ${cat === currentCategory ? 'active' : ''}" onclick="setCategory('${cat}')">
            <span class="emoji">${emojis[cat] || '🍽'}</span>
            <span>${cat}</span>
        </button>`
    ).join('');
}

function setCategory(cat) {
    currentCategory = cat;
    renderCategories();
    document.getElementById('gridTitle').textContent = cat;
    renderMenu();
}

// ============================================
// MENU
// ============================================
function renderMenu() {
    const items = currentCategory === 'Barcha taomlar' ? menuData : menuData.filter(i => i.category === currentCategory);
    document.getElementById('menuGrid').innerHTML = items.map(item =>
        `<div class="menu-item" onclick="addToCart(${item.id})">
            <div class="image">
                ${item.emoji}
                ${item.discount ? `<span class="tag">-${item.discount}%</span>` : ''}
            </div>
            <div class="body">
                <div class="name">${item.name}</div>
                <div class="desc">${item.desc}</div>
                <div class="bottom">
                    <span class="price">${item.price.toLocaleString()} so'm</span>
                    <button class="add-btn" onclick="event.stopPropagation();addToCart(${item.id})"><i class="fas fa-plus"></i></button>
                </div>
            </div>
        </div>`
    ).join('');
}

function searchFoods(query) {
    if (!query.trim()) { renderMenu(); return; }
    const filtered = menuData.filter(i =>
        i.name.toLowerCase().includes(query.toLowerCase()) ||
        i.category.toLowerCase().includes(query.toLowerCase())
    );
    document.getElementById('menuGrid').innerHTML = filtered.map(item =>
        `<div class="menu-item" onclick="addToCart(${item.id})">
            <div class="image">${item.emoji}</div>
            <div class="body">
                <div class="name">${item.name}</div>
                <div class="desc">${item.desc}</div>
                <div class="bottom">
                    <span class="price">${item.price.toLocaleString()} so'm</span>
                    <button class="add-btn" onclick="event.stopPropagation();addToCart(${item.id})"><i class="fas fa-plus"></i></button>
                </div>
            </div>
        </div>`
    ).join('');
}

// ============================================
// CART
// ============================================
function addToCart(id) {
    const item = menuData.find(i => i.id === id);
    if (!item) return;
    if (cart[id]) cart[id].qty++;
    else cart[id] = { ...item, qty: 1 };
    updateCart();
    showToast(`${item.emoji} ${item.name} savatga qo'shildi!`, 'success');
    if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
}

function updateCart() {
    const items = Object.values(cart);
    const count = items.reduce((s, i) => s + i.qty, 0);
    const total = items.reduce((s, i) => s + i.price * i.qty, 0);

    document.getElementById('cartBadge').textContent = count;
    document.getElementById('cartBadge').className = 'badge' + (count > 0 ? ' show' : '');
    document.getElementById('floatCount').textContent = count;
    document.getElementById('floatTotal').textContent = total.toLocaleString() + " so'm";
    document.getElementById('cartFloat').className = 'cart-float' + (count > 0 ? ' show' : '');
}

// ============================================
// CHECKOUT
// ============================================
function showCheckout() {
    const items = Object.values(cart);
    if (!items.length) {
        showToast('Savat bo\'sh!', 'error');
        return;
    }

    document.getElementById('checkoutPhone').value = currentUser?.phone || '';
    document.getElementById('checkoutAddress').value = currentUser?.address || '';

    document.getElementById('cartItemsList').innerHTML = items.map(item =>
        `<div class="cart-item-row">
            <div class="info">
                <span class="emoji">${item.emoji}</span>
                <span class="name">${item.name} x${item.qty}</span>
            </div>
            <span>${(item.price * item.qty).toLocaleString()} so'm</span>
        </div>`
    ).join('');

    const total = items.reduce((s, i) => s + i.price * i.qty, 0);
    document.getElementById('checkoutTotal').textContent = total.toLocaleString() + " so'm";
    document.getElementById('checkoutSheet').classList.add('active');
}

function closeSheet(id) {
    document.getElementById(id).classList.remove('active');
}

function placeOrder() {
    const phone = document.getElementById('checkoutPhone').value.trim();
    const address = document.getElementById('checkoutAddress').value.trim();

    if (!phone || !address) {
        showToast('Telefon va manzilni kiriting!', 'error');
        return;
    }

    const items = Object.values(cart);
    const total = items.reduce((s, i) => s + i.price * i.qty, 0);
    const orderId = Math.floor(Math.random() * 9000) + 1000;

    const order = {
        id: orderId,
        items: items.map(i => `${i.name} x${i.qty}`).join(', '),
        total: total,
        status: 'new',
        date: new Date().toLocaleString('uz-UZ'),
        payment: document.getElementById('checkoutPayment').value,
        phone: phone,
        address: address,
        timeline: {
            new: new Date().toISOString(),
            ready: null,
            delivering: null,
            delivered: null
        }
    };

    if (currentUser) {
        if (!currentUser.orders) currentUser.orders = [];
        currentUser.orders.push(order);
        currentUser.bonus = (currentUser.bonus || 0) + Math.floor(total * 0.05);
        currentUser.spent = (currentUser.spent || 0) + total;

        const userIndex = usersDB.findIndex(u => u.phone === currentUser.phone);
        if (userIndex !== -1) {
            usersDB[userIndex] = currentUser;
            localStorage.setItem('usersDB', JSON.stringify(usersDB));
        }
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
    }

    if (tg?.sendData) {
        tg.sendData(JSON.stringify({
            action: 'new_order',
            orderId: orderId,
            total: total,
            items: order.items,
            phone: phone,
            address: address,
            restaurant_id: 1
        }));
    }

    cart = {};
    updateCart();
    closeSheet('checkoutSheet');
    updateProfile();
    renderOrders();
    showToast(`✅ Buyurtma #${orderId} qabul qilindi!`, 'success');

    // Real-time simulyatsiya
    setTimeout(() => {
        updateOrderStatus(orderId, 'ready');
    }, 15000);
    setTimeout(() => {
        updateOrderStatus(orderId, 'delivering');
    }, 30000);
    setTimeout(() => {
        updateOrderStatus(orderId, 'delivered');
    }, 45000);
}

// ============================================
// REAL-TIME ORDER STATUS
// ============================================
function updateOrderStatus(orderId, status) {
    if (!currentUser) return;
    const order = currentUser.orders.find(o => o.id === orderId);
    if (!order) return;
    order.status = status;
    if (order.timeline) {
        order.timeline[status] = new Date().toISOString();
    }

    const userIndex = usersDB.findIndex(u => u.phone === currentUser.phone);
    if (userIndex !== -1) {
        usersDB[userIndex] = currentUser;
        localStorage.setItem('usersDB', JSON.stringify(usersDB));
    }
    localStorage.setItem('currentUser', JSON.stringify(currentUser));

    renderOrders();
    renderActiveOrders();
    updateProfile();

    // Agar buyurtma holati o'zgarsa, foydalanuvchiga xabar
    const statusMap = {
        'ready': '🔥 Tayyorlanmoqda',
        'delivering': '🚕 Yo\'lda',
        'delivered': '✅ Yetkazildi'
    };
    if (status !== 'new') {
        showToast(`📦 Buyurtma #${orderId} — ${statusMap[status] || status}`, 'info');
    }

    // Yetkazilganda baholash so'rash
    if (status === 'delivered') {
        setTimeout(() => {
            openOrderDetail(orderId);
        }, 2000);
    }
}

// ============================================
// ACTIVE ORDERS (Real-time)
// ============================================
function renderActiveOrders() {
    const container = document.getElementById('activeOrders');
    if (!currentUser) return;

    const activeOrders = (currentUser.orders || []).filter(o =>
        o.status === 'new' || o.status === 'ready' || o.status === 'delivering'
    );

    if (!activeOrders.length) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="icon">✅</div>
                <div class="title">Faol buyurtmalar yo'q</div>
                <div class="desc">Barcha buyurtmalar yetkazildi</div>
            </div>
        `;
        return;
    }

    container.innerHTML = activeOrders.map(order => `
        <div class="order-card" onclick="openOrderDetail(${order.id})">
            <div class="top">
                <span class="order-id">#${order.id}</span>
                <span class="status status-${order.status}">${getStatusText(order.status)}</span>
            </div>
            <div class="items">${order.items}</div>
            <div class="bottom">
                <span class="total">${order.total.toLocaleString()} so'm</span>
                <span class="date">${order.date || ''}</span>
            </div>
        </div>
    `).join('');
}

function getStatusText(status) {
    const map = { 'new': 'Yangi', 'ready': 'Tayyorlanmoqda', 'delivering': 'Yo\'lda', 'delivered': 'Yetkazildi' };
    return map[status] || status;
}

// ============================================
// ORDER DETAIL (Real-time status timeline)
// ============================================
let currentOrderId = null;

function openOrderDetail(orderId) {
    if (!currentUser) return;
    const order = currentUser.orders.find(o => o.id === orderId);
    if (!order) return;

    currentOrderId = orderId;
    document.getElementById('orderDetailTitle').textContent = `📦 Buyurtma #${orderId}`;
    document.getElementById('orderDetailItems').textContent = order.items;
    document.getElementById('orderDetailTotal').textContent = order.total.toLocaleString() + " so'm";
    document.getElementById('orderDetailAddress').textContent = order.address || 'Manzil yo\'q';

    // Timeline
    const timeline = order.timeline || {};
    document.querySelectorAll('.timeline-step').forEach(step => {
        step.classList.remove('active', 'completed');
        const stepName = step.dataset.step;
        if (stepName === order.status) {
            step.classList.add('active');
        } else if (['delivered', 'delivering', 'ready'].indexOf(stepName) <
            ['new', 'ready', 'delivering', 'delivered'].indexOf(order.status)) {
            step.classList.add('completed');
        }
        const timeEl = document.getElementById(`time${stepName.charAt(0).toUpperCase() + stepName.slice(1)}`);
        if (timeEl && timeline[stepName]) {
            timeEl.textContent = new Date(timeline[stepName]).toLocaleTimeString();
        }
    });

    // Courier location (faqat delivering holatida)
    const courierLoc = document.getElementById('courierLocation');
    if (order.status === 'delivering') {
        courierLoc.style.display = 'block';
        // Simulate courier location
        const lat = 41.2995 + (Math.random() - 0.5) * 0.02;
        const lng = 69.2401 + (Math.random() - 0.5) * 0.02;
        document.getElementById('courierCoords').textContent = `📍 ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        document.getElementById('courierMap').innerHTML = `
            <i class="fas fa-map-marked-alt" style="font-size:32px;margin-right:8px;"></i>
            <span>🚕 Kuryer (${lat.toFixed(4)}, ${lng.toFixed(4)})</span>
        `;
    } else {
        courierLoc.style.display = 'none';
    }

    // Rating (faqat delivered holatida va baholanmagan bo'lsa)
    const ratingDiv = document.getElementById('orderRating');
    if (order.status === 'delivered' && !order.rated) {
        ratingDiv.style.display = 'block';
    } else {
        ratingDiv.style.display = 'none';
    }

    document.getElementById('orderDetailSheet').classList.add('active');
}

// ============================================
// RATING
// ============================================
function rateOrder(rating) {
    if (!currentUser || !currentOrderId) return;
    const order = currentUser.orders.find(o => o.id === currentOrderId);
    if (!order) return;

    order.rated = true;
    order.rating = rating;

    const userIndex = usersDB.findIndex(u => u.phone === currentUser.phone);
    if (userIndex !== -1) {
        usersDB[userIndex] = currentUser;
        localStorage.setItem('usersDB', JSON.stringify(usersDB));
    }
    localStorage.setItem('currentUser', JSON.stringify(currentUser));

    // Yulduzchalarni yangilash
    const stars = document.querySelectorAll('#orderRating span');
    stars.forEach((star, i) => {
        star.textContent = i < rating ? '★' : '☆';
        star.style.color = i < rating ? '#FFB300' : '#B0B0C4';
    });

    showToast(`⭐ Siz ${rating} yulduz berdingiz!`, 'success');

    if (tg?.sendData) {
        tg.sendData(JSON.stringify({
            action: 'rate_order',
            orderId: currentOrderId,
            rating: rating
        }));
    }

    setTimeout(() => {
        document.getElementById('orderRating').style.display = 'none';
    }, 3000);
}

// ============================================
// ORDERS LIST
// ============================================
function renderOrders() {
    const container = document.getElementById('ordersList');
    if (!currentUser || !currentUser.orders || !currentUser.orders.length) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="icon">📭</div>
                <div class="title">Hali buyurtmalar yo'q</div>
                <div class="desc">Birinchi buyurtmangizni bering!</div>
            </div>
        `;
        return;
    }

    const orders = currentUser.orders.slice().reverse();
    container.innerHTML = orders.map(order => `
        <div class="order-card" onclick="openOrderDetail(${order.id})">
            <div class="top">
                <span class="order-id">#${order.id}</span>
                <span class="status status-${order.status}">${getStatusText(order.status)}</span>
            </div>
            <div class="items">${order.items}</div>
            <div class="bottom">
                <span class="total">${order.total.toLocaleString()} so'm</span>
                <span class="date">${order.date || ''}</span>
            </div>
        </div>
    `).join('');
}

// ============================================
// TABS
// ============================================
function switchTab(tab) {
    currentTab = tab;

    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById(`page-${tab}`);
    if (target) target.classList.add('active');

    document.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.tab === tab);
    });

    if (tab === 'orders') { renderOrders();
        renderActiveOrders(); }
    if (tab === 'profile') updateProfile();
    if (tab === 'home') {
        document.getElementById('searchInput').value = '';
        renderMenu();
    }
    if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
}

// ============================================
// PROFILE
// ============================================
function updateProfile() {
    if (!currentUser) return;
    document.getElementById('profileName').textContent = currentUser.name || 'Mehmon';
    document.getElementById('profilePhone').textContent = currentUser.phone || 'Telefon qo\'shilmagan';
    document.getElementById('statOrders').textContent = (currentUser.orders || []).length;
    document.getElementById('statSpent').textContent = (currentUser.spent || 0).toLocaleString() + ' so\'m';
    document.getElementById('statBonus').textContent = currentUser.bonus || 0;
    const avatar = document.getElementById('profileAvatar');
    avatar.textContent = currentUser.name ? currentUser.name.charAt(0).toUpperCase() : '👤';
}

// ============================================
// LOCATION
// ============================================
function detectLocation() {
    if (!navigator.geolocation) {
        showToast('Brauzer geolokatsiyani qo\'llab-quvvatlamaydi', 'error');
        return;
    }
    const addrEl = document.getElementById('userAddress');
    addrEl.textContent = 'Aniqlanmoqda...';
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            const addr = `📍 ${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`;
            if (currentUser) {
                currentUser.address = addr;
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
            }
            addrEl.textContent = addr;
            showToast('📍 Joylashuv aniqlandi!', 'success');
        },
        () => { addrEl.textContent = 'Manzilni tanlang';
            showToast('Joylashuvni aniqlab bo\'lmadi', 'error'); },
        { enableHighAccuracy: true, timeout: 10000 }
    );
}

// ============================================
// SHEET OVERLAY CLOSE
// ============================================
document.querySelectorAll('.sheet-overlay').forEach(el => {
    el.addEventListener('click', (e) => {
        if (e.target === el) closeSheet(el.id);
    });
});

// ============================================
// KEYBOARD
// ============================================
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.sheet-overlay.active').forEach(el => {
            closeSheet(el.id);
        });
    }
});

// ============================================
// INIT
// ============================================
// Auto-fill from Telegram
if (tg?.initDataUnsafe?.user) {
    const u = tg.initDataUnsafe.user;
    document.getElementById('loginName').value = u.first_name || '';
    document.getElementById('regName').value = u.first_name || '';
}

if (currentUser) {
    showMainApp();
} else {
    document.getElementById('authPage').classList.add('active');
}

console.log('🍕 FoodExpress ishga tushdi!');
console.log('📦 Real-time buyurtma holati faol!');
console.log('👤 Foydalanuvchi:', currentUser?.name || 'Kirmagan');

// ============================================
// RESTAURANTS DATA (Yandex Eats style)
// ============================================
const restaurantsData = [
    {
        id: 1,
        name: "Oshxona",
        emoji: "🍚",
        rating: 4.8,
        deliveryTime: "25-35 min",
        deliveryPrice: 10000,
        freeFrom: 100000,
        address: "Toshkent sh., Chilonzor",
        phone: "+998 90 123 45 67",
        hours: "09:00 - 23:00",
        promo: "Birinchi buyurtma -20%",
        category: "Milliy",
        menu: [
            { id: 101, name: "Osh", price: 35000, emoji: "🍚", desc: "Qo'y go'shti, sabzi", category: "Asosiy" },
            { id: 102, name: "Shashlik", price: 18000, emoji: "🍢", desc: "Mol go'shti", category: "Asosiy" },
            { id: 103, name: "Manti", price: 8000, emoji: "🥟", desc: "Bug'da pishirilgan", category: "Asosiy" },
            { id: 104, name: "Lag'mon", price: 28000, emoji: "🍜", desc: "Qo'y go'shti", category: "Asosiy" },
            { id: 105, name: "Somsa", price: 7000, emoji: "🥐", desc: "Tandirda", category: "Asosiy" },
        ]
    },
    {
        id: 2,
        name: "FastFood",
        emoji: "🍔",
        rating: 4.6,
        deliveryTime: "15-25 min",
        deliveryPrice: 5000,
        freeFrom: 80000,
        address: "Toshkent sh., Yunusobod",
        phone: "+998 90 987 65 43",
        hours: "10:00 - 02:00",
        promo: "3 taom + 1 ichimlik",
        category: "Fast Food",
        menu: [
            { id: 201, name: "Burger", price: 32000, emoji: "🍔", desc: "Dabl chizburger", category: "Burger" },
            { id: 202, name: "Pizza", price: 45000, emoji: "🍕", desc: "Pepperoni", category: "Pizza" },
            { id: 203, name: "Lavash", price: 28000, emoji: "🌯", desc: "Tovuq go'shti", category: "Lavash" },
            { id: 204, name: "Hot Dog", price: 22000, emoji: "🌭", desc: "Klassik", category: "Hot Dog" },
            { id: 205, name: "Fries", price: 12000, emoji: "🍟", desc: "Kartoshka fries", category: "Snacks" },
        ]
    },
    {
        id: 3,
        name: "Sog'lom Taom",
        emoji: "🥗",
        rating: 4.9,
        deliveryTime: "20-30 min",
        deliveryPrice: 15000,
        freeFrom: 120000,
        address: "Toshkent sh., Mirzo Ulug'bek",
        phone: "+998 90 555 66 77",
        hours: "08:00 - 22:00",
        promo: "Sog'lom bonus",
        category: "Sog'lom",
        menu: [
            { id: 301, name: "Salat", price: 22000, emoji: "🥗", desc: "Yangi sabzavotlar", category: "Salat" },
            { id: 302, name: "Smoothie", price: 18000, emoji: "🥤", desc: "Meva smuzi", category: "Ichimlik" },
            { id: 303, name: "Grechka", price: 25000, emoji: "🍚", desc: "Grechka bilan", category: "Asosiy" },
        ]
    },
    {
        id: 4,
        name: "Pizza House",
        emoji: "🍕",
        rating: 4.7,
        deliveryTime: "30-40 min",
        deliveryPrice: 12000,
        freeFrom: 150000,
        address: "Toshkent sh., Sergeli",
        phone: "+998 90 777 88 99",
        hours: "11:00 - 01:00",
        promo: "2 pizza - 10%",
        category: "Fast Food",
        menu: [
            { id: 401, name: "Margherita", price: 38000, emoji: "🍕", desc: "Pomidor, pishloq", category: "Pizza" },
            { id: 402, name: "Pepperoni", price: 45000, emoji: "🍕", desc: "Pepperoni, pishloq", category: "Pizza" },
            { id: 403, name: "Hawaii", price: 42000, emoji: "🍕", desc: "Ananas, tovuq", category: "Pizza" },
        ]
    },
    {
        id: 5,
        name: "Sushi Bar",
        emoji: "🍣",
        rating: 4.5,
        deliveryTime: "35-45 min",
        deliveryPrice: 15000,
        freeFrom: 200000,
        address: "Toshkent sh., Mirobod",
        phone: "+998 90 666 77 88",
        hours: "12:00 - 23:00",
        promo: "Sushi set -15%",
        category: "Yapon",
        menu: [
            { id: 501, name: "Sushi Set", price: 55000, emoji: "🍣", desc: "8 dona sushi", category: "Set" },
            { id: 502, name: "Rol", price: 32000, emoji: "🍱", desc: "Yasmiy", category: "Rol" },
        ]
    },
    {
        id: 6,
        name: "Coffee Shop",
        emoji: "☕",
        rating: 4.4,
        deliveryTime: "10-20 min",
        deliveryPrice: 5000,
        freeFrom: 50000,
        address: "Toshkent sh., Chilonzor",
        phone: "+998 90 444 55 66",
        hours: "07:00 - 22:00",
        promo: "2 coffee - 1 free",
        category: "Ichimlik",
        menu: [
            { id: 601, name: "Espresso", price: 12000, emoji: "☕", desc: "Klassik", category: "Coffee" },
            { id: 602, name: "Latte", price: 16000, emoji: "☕", desc: "Sut bilan", category: "Coffee" },
            { id: 603, name: "Croissant", price: 8000, emoji: "🥐", desc: "Yangi", category: "Desert" },
        ]
    }
];

let currentRestaurant = null;
let currentCategory = 'Barcha taomlar';

// ============================================
// RENDER RESTAURANTS
// ============================================
function renderRestaurants() {
    const grid = document.getElementById('restaurantsGrid');
    grid.innerHTML = restaurantsData.map(r => `
        <div class="restaurant-card" onclick="openRestaurantDetail(${r.id})">
            <div class="cover">
                ${r.emoji}
                <span class="rating"><i class="fas fa-star" style="color:#FFB300;"></i> ${r.rating}</span>
                <span class="delivery-time"><i class="fas fa-clock"></i> ${r.deliveryTime}</span>
                ${r.promo ? `<span class="promo-badge">🔥 ${r.promo}</span>` : ''}
            </div>
            <div class="info">
                <div class="name">${r.name}</div>
                <div class="details">
                    <i class="fas fa-map-marker-alt"></i> ${r.address}
                </div>
                <div class="bottom">
                    <span class="price">💰 ${r.deliveryPrice > 0 ? r.deliveryPrice.toLocaleString() + ' so\'m' : 'Bepul'}</span>
                    <span class="delivery">🚕 ${r.deliveryTime}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// ============================================
// RESTAURANT DETAIL
// ============================================
function openRestaurantDetail(id) {
    const restaurant = restaurantsData.find(r => r.id === id);
    if (!restaurant) return;
    
    currentRestaurant = restaurant;
    document.getElementById('restaurantDetail').style.display = 'block';
    document.getElementById('restaurantsSection').style.display = 'none';
    document.getElementById('promo-section').style.display = 'none';
    document.getElementById('page-home').classList.remove('active');
    document.getElementById('restaurantDetail').classList.add('active');
    
    // Header
    document.getElementById('restaurantDetailInfo').innerHTML = `
        <div class="name">${restaurant.emoji} ${restaurant.name}</div>
        <div class="details">
            <i class="fas fa-star" style="color:#FFB300;"></i> ${restaurant.rating} 
            <i class="fas fa-clock" style="margin-left:12px;"></i> ${restaurant.deliveryTime}
            <i class="fas fa-map-marker-alt" style="margin-left:12px;"></i> ${restaurant.address}
        </div>
        <div class="details">
            <i class="fas fa-phone"></i> ${restaurant.phone} 
            <i class="fas fa-clock" style="margin-left:12px;"></i> ${restaurant.hours}
            ${restaurant.promo ? `<span style="color:var(--danger);font-weight:700;margin-left:12px;">🔥 ${restaurant.promo}</span>` : ''}
        </div>
    `;
    
    // Menu
    const categories = [...new Set(restaurant.menu.map(m => m.category))];
    let menuHtml = '';
    categories.forEach(cat => {
        const items = restaurant.menu.filter(m => m.category === cat);
        menuHtml += `
            <div class="menu-category">
                <div class="cat-title">📂 ${cat}</div>
                ${items.map(item => `
                    <div class="menu-item" onclick="addRestaurantItemToCart(${restaurant.id}, ${item.id})">
                        <div class="left">
                            <span class="emoji">${item.emoji}</span>
                            <div class="info">
                                <div class="name">${item.name}</div>
                                <div class="desc">${item.desc}</div>
                            </div>
                        </div>
                        <div class="right">
                            <span class="price">${item.price.toLocaleString()} so'm</span>
                            <button class="add-btn" onclick="event.stopPropagation();addRestaurantItemToCart(${restaurant.id}, ${item.id})">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    });
    document.getElementById('restaurantMenu').innerHTML = menuHtml;
    
    window.scrollTo(0, 0);
}

function closeRestaurantDetail() {
    document.getElementById('restaurantDetail').style.display = 'none';
    document.getElementById('restaurantDetail').classList.remove('active');
    document.getElementById('restaurantsSection').style.display = 'block';
    document.getElementById('promo-section').style.display = 'block';
    document.getElementById('page-home').classList.add('active');
    currentRestaurant = null;
}

function showAllRestaurants() {
    // Scroll to restaurants section
    document.querySelector('.restaurants-section').scrollIntoView({ behavior: 'smooth' });
}

// ============================================
// ADD RESTAURANT ITEM TO CART
// ============================================
function addRestaurantItemToCart(restaurantId, itemId) {
    const restaurant = restaurantsData.find(r => r.id === restaurantId);
    if (!restaurant) return;
    const item = restaurant.menu.find(m => m.id === itemId);
    if (!item) return;
    
    // Check if cart has items from different restaurant
    const cartItems = Object.values(cart);
    if (cartItems.length > 0 && cartItems[0].restaurantId !== restaurantId) {
        if (!confirm('Savatda boshqa restorandan taomlar bor. Tozalab, yangi restorandan qo\'shilsinmi?')) {
            return;
        }
        cart = {};
    }
    
    const key = `${restaurantId}_${itemId}`;
    if (cart[key]) {
        cart[key].qty++;
    } else {
        cart[key] = {
            id: itemId,
            name: item.name,
            price: item.price,
            emoji: item.emoji,
            restaurantId: restaurantId,
            restaurantName: restaurant.name,
            qty: 1
        };
    }
    
    updateCart();
    showToast(`${item.emoji} ${item.name} savatga qo'shildi!`, 'success');
    if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
}

// ============================================
// SEARCH (Restaurants + Foods)
// ============================================
function handleSearch(query) {
    if (!query.trim()) {
        renderRestaurants();
        return;
    }
    
    const q = query.toLowerCase().trim();
    
    // Search restaurants
    const foundRestaurants = restaurantsData.filter(r => 
        r.name.toLowerCase().includes(q) || 
        r.category.toLowerCase().includes(q) ||
        r.address.toLowerCase().includes(q)
    );
    
    // Search foods
    const foundFoods = [];
    restaurantsData.forEach(r => {
        r.menu.forEach(m => {
            if (m.name.toLowerCase().includes(q) || m.desc.toLowerCase().includes(q)) {
                foundFoods.push({ ...m, restaurantName: r.name, restaurantId: r.id });
            }
        });
    });
    
    const grid = document.getElementById('restaurantsGrid');
    
    if (!foundRestaurants.length && !foundFoods.length) {
        grid.innerHTML = `
            <div style="grid-column:1/-1;text-align:center;padding:40px 0;color:var(--text-3);">
                <div style="font-size:48px;">🔍</div>
                <div style="font-weight:700;font-size:18px;color:var(--text);">Hech narsa topilmadi</div>
                <div style="font-size:14px;">Qayta urinib ko'ring</div>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    // Show restaurants
    foundRestaurants.forEach(r => {
        html += `
            <div class="restaurant-card" onclick="openRestaurantDetail(${r.id})">
                <div class="cover">
                    ${r.emoji}
                    <span class="rating"><i class="fas fa-star" style="color:#FFB300;"></i> ${r.rating}</span>
                    <span class="delivery-time"><i class="fas fa-clock"></i> ${r.deliveryTime}</span>
                </div>
                <div class="info">
                    <div class="name">${r.name}</div>
                    <div class="details"><i class="fas fa-map-marker-alt"></i> ${r.address}</div>
                    <div class="bottom">
                        <span class="price">💰 ${r.deliveryPrice > 0 ? r.deliveryPrice.toLocaleString() + ' so\'m' : 'Bepul'}</span>
                        <span class="delivery">🚕 ${r.deliveryTime}</span>
                    </div>
                </div>
            </div>
        `;
    });
    
    // Show foods (as small cards)
    foundFoods.forEach(f => {
        html += `
            <div class="restaurant-card" onclick="addRestaurantItemToCart(${f.restaurantId}, ${f.id})">
                <div class="cover" style="height:80px;font-size:32px;background:linear-gradient(135deg,#FFE5D0,#FFD4B3);">
                    ${f.emoji}
                </div>
                <div class="info">
                    <div class="name" style="font-size:13px;">${f.name}</div>
                    <div class="details">${f.restaurantName}</div>
                    <div class="bottom">
                        <span class="price">${f.price.toLocaleString()} so'm</span>
                        <span class="delivery">➕ Qo'shish</span>
                    </div>
                </div>
            </div>
        `;
    });
    
    grid.innerHTML = html;
}

// ============================================
// OVERRIDE PLACE ORDER (with restaurant)
// ============================================
function placeOrder() {
    const phone = document.getElementById('checkoutPhone').value.trim();
    const address = document.getElementById('checkoutAddress').value.trim();
    
    if (!phone || !address) {
        showToast('Telefon va manzilni kiriting!', 'error');
        return;
    }
    
    const items = Object.values(cart);
    if (!items.length) {
        showToast('Savat bo\'sh!', 'error');
        return;
    }
    
    const restaurantId = items[0].restaurantId;
    const restaurant = restaurantsData.find(r => r.id === restaurantId);
    
    const total = items.reduce((s, i) => s + i.price * i.qty, 0);
    const deliveryPrice = restaurant && total < restaurant.freeFrom ? restaurant.deliveryPrice : 0;
    const finalTotal = total + deliveryPrice;
    const orderId = Math.floor(Math.random() * 9000) + 1000;
    
    const order = {
        id: orderId,
        items: items.map(i => `${i.emoji} ${i.name} x${i.qty}`).join(', '),
        total: finalTotal,
        subtotal: total,
        delivery: deliveryPrice,
        status: 'new',
        date: new Date().toLocaleString('uz-UZ'),
        payment: document.getElementById('checkoutPayment').value,
        phone: phone,
        address: address,
        restaurant: restaurant ? restaurant.name : 'Noma\'lum',
        restaurantId: restaurantId,
        timeline: {
            new: new Date().toISOString(),
            ready: null,
            delivering: null,
            delivered: null
        }
    };
    
    if (currentUser) {
        if (!currentUser.orders) currentUser.orders = [];
        currentUser.orders.push(order);
        currentUser.bonus = (currentUser.bonus || 0) + Math.floor(total * 0.05);
        currentUser.spent = (currentUser.spent || 0) + finalTotal;
        
        const userIndex = usersDB.findIndex(u => u.phone === currentUser.phone);
        if (userIndex !== -1) {
            usersDB[userIndex] = currentUser;
            localStorage.setItem('usersDB', JSON.stringify(usersDB));
        }
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
    }
    
    if (tg?.sendData) {
        tg.sendData(JSON.stringify({
            action: 'new_order',
            orderId: orderId,
            total: finalTotal,
            items: order.items,
            phone: phone,
            address: address,
            restaurant_id: restaurantId
        }));
    }
    
    cart = {};
    updateCart();
    closeSheet('checkoutSheet');
    updateProfile();
    renderOrders();
    renderActiveOrders();
    showToast(`✅ Buyurtma #${orderId} qabul qilindi!`, 'success');
    
    // Real-time simulation
    setTimeout(() => { updateOrderStatus(orderId, 'ready'); }, 15000);
    setTimeout(() => { updateOrderStatus(orderId, 'delivering'); }, 30000);
    setTimeout(() => { updateOrderStatus(orderId, 'delivered'); }, 45000);
}

// ============================================
// UPDATE CHECKOUT TOTAL (with delivery)
// ============================================
function updateCheckoutTotal() {
    const items = Object.values(cart);
    const total = items.reduce((s, i) => s + i.price * i.qty, 0);
    
    let delivery = 0;
    if (items.length > 0) {
        const restaurantId = items[0].restaurantId;
        const restaurant = restaurantsData.find(r => r.id === restaurantId);
        if (restaurant && total < restaurant.freeFrom) {
            delivery = restaurant.deliveryPrice;
        }
    }
    
    document.getElementById('checkoutTotal').textContent = (total + delivery).toLocaleString() + " so'm";
    return total + delivery;
}

// ============================================
// INIT
// ============================================
if (currentUser) {
    showMainApp();
    renderRestaurants();
} else {
    document.getElementById('authPage').classList.add('active');
}

console.log('🍕 FoodExpress (Yandex Eats style) ishga tushdi!');
console.log('🏪 Restoranlar:', restaurantsData.length);
console.log('🍽 Jami taomlar:', restaurantsData.reduce((s, r) => s + r.menu.length, 0));