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
// DATA
// ============================================
let usersDB = JSON.parse(localStorage.getItem('usersDB') || '[]');
let currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
let cart = {};
let currentTab = 'home';

const menuData = [
    { id: 1, name: "Osh", price: 35000, emoji: "🍚", category: "Milliy" },
    { id: 2, name: "Shashlik", price: 18000, emoji: "🍢", category: "Milliy" },
    { id: 3, name: "Burger", price: 32000, emoji: "🍔", category: "Fast Food" },
    { id: 4, name: "Pizza", price: 45000, emoji: "🍕", category: "Fast Food" },
    { id: 5, name: "Manti", price: 8000, emoji: "🥟", category: "Milliy" },
    { id: 6, name: "Lavash", price: 28000, emoji: "🌯", category: "Fast Food" },
    { id: 7, name: "Lag'mon", price: 28000, emoji: "🍜", category: "Milliy" },
    { id: 8, name: "Coffee", price: 15000, emoji: "☕", category: "Ichimlik" },
    { id: 9, name: "Cola", price: 12000, emoji: "🥤", category: "Ichimlik" },
    { id: 10, name: "Tort", price: 25000, emoji: "🍰", category: "Desert" },
    { id: 11, name: "Moroz", price: 10000, emoji: "🍦", category: "Desert" },
    { id: 12, name: "Smuzi", price: 18000, emoji: "🥤", category: "Ichimlik" },
];

// ============================================
// TOAST
// ============================================
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast show ' + type;
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ============================================
// AUTH
// ============================================
function showLogin() {
    document.getElementById('loginPage').classList.remove('hidden');
    document.getElementById('registerPage').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('active');
    document.getElementById('tabBar').classList.remove('active');
}

function showRegister() {
    document.getElementById('loginPage').classList.add('hidden');
    document.getElementById('registerPage').classList.remove('hidden');
    document.getElementById('mainApp').classList.remove('active');
    document.getElementById('tabBar').classList.remove('active');
}

function showMainApp() {
    document.getElementById('loginPage').classList.add('hidden');
    document.getElementById('registerPage').classList.add('hidden');
    document.getElementById('mainApp').classList.add('active');
    document.getElementById('tabBar').classList.add('active');
    renderMenu();
    updateProfile();
    switchTab('home');
}

function handleRegister() {
    const name = document.getElementById('regName').value.trim();
    const phone = document.getElementById('regPhone').value.trim();
    const password = document.getElementById('regPassword').value.trim();

    if (!name || !phone || !password) {
        showToast('Barcha maydonlarni to\'ldiring!', 'error');
        return;
    }

    // Telefon raqam formatini tekshirish
    const phoneRegex = /^\+?998[0-9]{9}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
        showToast('Telefon raqamni to\'g\'ri kiriting! (+998901234567)', 'error');
        return;
    }

    if (usersDB.find(u => u.phone === phone)) {
        showToast('Bu raqam allaqachon ro\'yxatdan o\'tgan!', 'error');
        return;
    }

    const user = {
        name,
        phone,
        password,
        orders: [],
        bonus: 5000,
        spent: 0,
        registeredAt: new Date().toISOString()
    };

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
            user = {
                name,
                phone,
                password: 'telegram',
                orders: [],
                bonus: 5000,
                spent: 0,
                registeredAt: new Date().toISOString()
            };
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
    document.getElementById('tabBar').classList.remove('active');
    document.getElementById('cartFloat').classList.remove('show');
    document.getElementById('mainApp').classList.remove('active');
    showLogin();
    showToast('👋 Siz chiqdingiz!', 'info');
}

// ============================================
// MENU
// ============================================
function renderMenu() {
    const grid = document.getElementById('menuGrid');
    grid.innerHTML = menuData.map(item => `
        <div class="menu-item" onclick="addToCart(${item.id})">
            <span class="emoji">${item.emoji}</span>
            <div class="name">${item.name}</div>
            <div class="price">${item.price.toLocaleString()} so'm</div>
        </div>
    `).join('');
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

    document.getElementById('cartCount').textContent = count;
    document.getElementById('cartTotal').textContent = total.toLocaleString() + " so'm";
    document.getElementById('cartFloat').classList.toggle('show', count > 0);
}

function openCheckout() {
    const items = Object.values(cart);
    if (!items.length) {
        showToast('Savat bo\'sh!', 'error');
        return;
    }

    document.getElementById('checkoutPhone').value = currentUser?.phone || '';
    document.getElementById('checkoutAddress').value = '';

    const list = document.getElementById('cartItemsList');
    list.innerHTML = items.map(item => `
        <div class="cart-item-row">
            <div class="info">
                <span class="emoji">${item.emoji}</span>
                <span class="name">${item.name} x${item.qty}</span>
            </div>
            <span>${(item.price * item.qty).toLocaleString()} so'm</span>
        </div>
    `).join('');

    const total = items.reduce((s, i) => s + i.price * i.qty, 0);
    document.getElementById('checkoutTotal').textContent = total.toLocaleString() + " so'm";

    document.getElementById('checkoutSheet').classList.add('active');
}

function closeSheet() {
    document.getElementById('checkoutSheet').classList.remove('active');
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
        payment: document.getElementById('checkoutPayment').value
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
            address: address
        }));
    }

    cart = {};
    updateCart();
    closeSheet();
    updateProfile();
    showToast(`✅ Buyurtma #${orderId} qabul qilindi!`, 'success');
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

    if (tab === 'orders') renderOrders();
    if (tab === 'profile') updateProfile();
    if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
}

// ============================================
// ORDERS
// ============================================
function renderOrders() {
    const container = document.getElementById('ordersList');
    const orders = currentUser?.orders || [];

    if (!orders.length) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="icon">📭</div>
                <div class="title">Hali buyurtmalar yo'q</div>
                <div>Birinchi buyurtmangizni bering!</div>
            </div>
        `;
        return;
    }

    const statusMap = {
        'new': { text: 'Yangi', class: 'status-new' },
        'delivering': { text: 'Yo\'lda', class: 'status-delivering' },
        'delivered': { text: 'Yetkazildi', class: 'status-delivered' }
    };

    container.innerHTML = orders.slice().reverse().map(order => {
        const st = statusMap[order.status] || statusMap['new'];
        return `
            <div class="order-card">
                <div class="top">
                    <span class="order-id">#${order.id}</span>
                    <span class="status ${st.class}">${st.text}</span>
                </div>
                <div class="items">${order.items}</div>
                <div class="bottom">
                    <span class="total">${order.total.toLocaleString()} so'm</span>
                    <span class="date">${order.date || ''}</span>
                </div>
            </div>
        `;
    }).join('');
}

// ============================================
// PROFILE
// ============================================
function updateProfile() {
    if (!currentUser) return;

    document.getElementById('profileName').textContent = currentUser.name || 'Mehmon';
    document.getElementById('profilePhone').textContent = currentUser.phone || 'Telefon qo\'shilmagan';
    document.getElementById('statOrders').textContent = (currentUser.orders || []).length;
    document.getElementById('statBonus').textContent = currentUser.bonus || 0;
    document.getElementById('statSpent').textContent = (currentUser.spent || 0).toLocaleString() + ' so\'m';

    const avatar = document.getElementById('profileAvatar');
    avatar.textContent = currentUser.name ? currentUser.name.charAt(0).toUpperCase() : '👤';
}

// ============================================
// INIT
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    // Auto-fill from Telegram
    if (tg?.initDataUnsafe?.user) {
        const u = tg.initDataUnsafe.user;
        document.getElementById('loginName').value = u.first_name || '';
        document.getElementById('regName').value = u.first_name || '';
    }

    // Check if user is logged in
    if (currentUser) {
        showMainApp();
    } else {
        showLogin();
    }

    // Close sheet on overlay click
    document.querySelectorAll('.sheet-overlay').forEach(el => {
        el.addEventListener('click', (e) => {
            if (e.target === el) closeSheet();
        });
    });

    console.log('🍕 FoodExpress ishga tushdi!');
    console.log('👤 Foydalanuvchilar:', usersDB.length);
    console.log('📦 Menyu:', menuData.length, 'ta taom');
});