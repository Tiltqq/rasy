// data structures
const categories = [
    { id: 'all', name: 'Все' },
    { id: 'design', name: 'Дизайн' },
    { id: 'production', name: 'Производство' },
    { id: 'documents', name: 'Документы' },
];

const products = [
    { id: 1, title: 'Экспресс-дизайн', categories: ['all','design'], price: '100', img: 'https://via.placeholder.com/400x300?text=Товар+1', desc: 'Описание товара 1' },
    { id: 2, title: 'Отрисовка логотипа', categories: ['all','design'], price: '200', img: 'https://via.placeholder.com/400x300?text=Товар+2', desc: 'Описание товара 2' },
    { id: 3, title: 'Вывеска', categories: ['all','production'], price: '300', img: 'https://i.postimg.cc/xdG8xfDF/Signboard.jpg', desc: 'Описание товара 3' },
    { id: 4, title: 'Короб', categories: ['all','production'], price: '400', img: 'https://via.placeholder.com/400x300?text=Товар+4', desc: 'Описание товара 4' },
    { id: 5, title: 'Товар 5', categories: ['all','documents'], price: '500', img: 'https://via.placeholder.com/400x300?text=Товар+5', desc: 'Описание товара 5' },
    { id: 6, title: 'Товар 6', categories: ['all','documents'], price: '600', img: 'https://via.placeholder.com/400x300?text=Товар+6', desc: 'Описание товара 6' },
];

// состояние приложения — объявлено ДО Telegram
let state = {
    screen: 'catalog',
    activeCategory: null,
    cart: [],
    user: null,
};

// === TELEGRAM WEBAPP INITIALIZATION ===
const tg = window.Telegram ? window.Telegram.WebApp : null;
if (tg) {
    tg.expand();
    tg.MainButton.hide();

    // Получаем пользователя из Telegram
    const user = tg.initDataUnsafe.user;
    if (user) {
        state.user = user; // ✅ Теперь state уже существует!
        console.log('✅ Пользователь из Telegram:', user);
    }

    // Применяем тему
    const params = tg.themeParams;
    if (params) {
        const root = document.documentElement;
        if (params.bg_color) root.style.setProperty('--color-background', params.bg_color);
        if (params.text_color) root.style.setProperty('--color-text', params.text_color);
        if (params.button_color) root.style.setProperty('--color-primary', params.button_color);
        if (params.button_text_color) root.style.setProperty('--color-text', params.button_text_color);
    }
}

// helpers
function $(selector) {
    return document.querySelector(selector);
}

function on(parent, event, selector, handler) {
    parent.addEventListener(event, e => {
        if (e.target.closest(selector)) handler(e);
    });
}

// Универсальная обёртка
function createBlock(element) {
    const block = document.createElement('div');
    block.classList.add('content-block');
    block.appendChild(element);
    return block;
}

// calculate cart total including delivery
function calculateTotal() {
    const itemsTotal = state.cart.reduce((sum, item) => {
        const price = parseFloat(item.price) || 0;
        return sum + price;
    }, 0);
    const delivery = state.deliveryPrice || 0;
    return itemsTotal + delivery;
}

// --- cart persistence helpers ---
function loadCart() {
    try {
        const raw = localStorage.getItem('cart');
        if (raw) {
            state.cart = JSON.parse(raw) || [];
        }
    } catch (e) {
        console.error('Ошибка чтения корзины из localStorage:', e);
    }
}

function saveCart() {
    try {
        localStorage.setItem('cart', JSON.stringify(state.cart));
    } catch (e) {
        console.error('Ошибка записи корзины в localStorage:', e);
    }
}

// render functions
function renderCategoryFilter() {
    const container = $('#category-filter');
    container.innerHTML = '';

    categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.textContent = cat.name;
        btn.dataset.id = cat.id;
        if (state.activeCategory === cat.id) btn.classList.add('active');
        btn.addEventListener('click', () => {
            state.activeCategory = cat.id;
            renderCatalog();
            renderCategoryFilter();
        });
        container.appendChild(btn);
    });
}

function renderCatalog() {
    const content = $('#content');
    content.innerHTML = '';
    const grid = document.createElement('div');
    grid.id = 'catalog';

    const filtered = state.activeCategory === 'all'
        ? products
        : products.filter(p => p.categories && p.categories.includes(state.activeCategory));

    filtered.forEach(p => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <img src="${p.img}" alt="${p.title}" />
            <div class="card-body">
                <div class="card-header">
                    <div>
                        <div class="card-title">${p.title}</div>
                        <div class="card-price">${p.price} ₽</div>
                    </div>
                    <button data-id="${p.id}" class="details-btn"></button>
                </div>
            </div>
        `;
        card.querySelector('.details-btn').addEventListener('click', () => openModal(p));
        grid.appendChild(card);
    });

    content.appendChild(grid);
}

function openModal(product) {
    const overlay = $('#modal-overlay');
    const content = $('#modal-content');
    content.innerHTML = `
        <img src="${product.img}" alt="${product.title}" />
        <h2>${product.title}</h2>
        <p>${product.desc}</p>
        <p class="card-price">${product.price} ₽</p>
        <button id="add-to-cart" data-id="${product.id}">Добавить в корзину</button>
    `;
    overlay.classList.remove('hidden');
}

function closeModal() {
    $('#modal-overlay').classList.add('hidden');
}

function renderBottomNav() {
    document.querySelectorAll('#bottom-nav .nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.screen === state.screen);
    });
}

function renderCart() {
    const content = $('#content');
    content.innerHTML = '';
    const list = document.createElement('div');
    list.id = 'cart-list';

    state.cart.forEach(item => {
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <img src="${item.img}" alt="${item.title}" />
            <div class="cart-item-info">
                <div class="cart-item-title">${item.title}</div>
                <div class="cart-item-price">${item.price} ₽</div>
            </div>
            <button data-id="${item.id}" class="remove-btn">✕</button>
        `;
        div.querySelector('.remove-btn').addEventListener('click', () => {
            state.cart = state.cart.filter(i => i.id !== item.id);
            saveCart();
            renderCart();
        });
        list.appendChild(div);
    });

    content.appendChild(createBlock(list));

    const info = document.createElement('div');
    info.id = 'cart-info';
    info.style.textAlign = 'center';
    if (state.cart.length === 0) {
        info.textContent = 'Добавьте услуги в корзину, чтобы оформить заказ.';
        content.appendChild(info);
        return;
    } else {
        info.textContent = '';
        content.appendChild(info);
    }

    const deliverySection = document.createElement('div');
    deliverySection.id = 'cart-delivery';
    deliverySection.innerHTML = `
        <p>Выберите доставку:</p>
        <div id="delivery-options">
            <label><input type="radio" name="delivery" value="100"><span class="delivery-region">Москва</span><br><span class="delivery-price">100 ₽</span></label>
            <label><input type="radio" name="delivery" value="200"><span class="delivery-region">МО</span><br><span class="delivery-price">200 ₽</span></label>
            <label><input type="radio" name="delivery" value="300"><span class="delivery-region">Другие регионы</span><br><span class="delivery-price">300 ₽</span></label>
        </div>
    `;
    content.appendChild(createBlock(deliverySection));

    const totalDiv = document.createElement('div');
    totalDiv.id = 'cart-total';
    totalDiv.style.fontWeight = 'bold';
    totalDiv.textContent = `Итого: ${calculateTotal()} ₽`;
    content.appendChild(createBlock(totalDiv));

    const contractContainer = document.createElement('div');
    contractContainer.id = 'cart-contract';

    const contract = document.createElement('div');
    contract.innerHTML = `
        <label style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
            <input type="checkbox" id="agree"> Я согласен
        </label>
        <button id="pay-button" disabled>
            Оплатить заказ
        </button>
    `;
    contractContainer.appendChild(contract);
    content.appendChild(createBlock(contractContainer));

    const payBtn = contract.querySelector('#pay-button');
    const agreeCheckbox = contract.querySelector('#agree');
    agreeCheckbox.addEventListener('change', () => {
        payBtn.disabled = !agreeCheckbox.checked;
    });

    const optionsContainer = deliverySection.querySelector('#delivery-options');
    optionsContainer.addEventListener('change', e => {
        if (e.target.name === 'delivery') {
            state.deliveryPrice = parseFloat(e.target.value) || 0;
            totalDiv.textContent = `Итого: ${calculateTotal()} ₽`;
            saveCart();

            optionsContainer.querySelectorAll('label').forEach(label => {
                const input = label.querySelector('input[name="delivery"]');
                if (input && input.checked) {
                    label.classList.add('selected');
                } else {
                    label.classList.remove('selected');
                }
            });
        }
    });

    if (state.deliveryPrice) {
        const inp = optionsContainer.querySelector(`input[value="${state.deliveryPrice}"]`);
        if (inp) {
            inp.checked = true;
            inp.closest('label').classList.add('selected');
        }
        totalDiv.textContent = `Итого: ${calculateTotal()} ₽`;
    }
}

function renderAbout() {
    const content = $('#content');
    content.innerHTML = '<div id="about"><p>О проекте</p></div>';
}

function switchScreen(screen) {
    state.screen = screen;
    renderBottomNav();

    const filterContainer = $('#category-filter');
    const content = $('#content');

    if (screen !== 'catalog' && filterContainer) {
        filterContainer.innerHTML = '';
    }

    if (screen === 'catalog') {
        renderCategoryFilter();
        renderCatalog();
    } else if (screen === 'cart') {
        renderCart();
    } else if (screen === 'about') {
        renderAbout();
    } else if (screen === 'account') {
        renderAccount();
    } else {
        content.innerHTML = '<div class="content-block"><p>Экран не найден</p></div>';
    }
}

// event listeners
on(document, 'click', '#modal-close', closeModal);
on(document, 'click', '#modal-overlay', e => {
    if (e.target.id === 'modal-overlay') closeModal();
});
on(document, 'click', '#modal button#add-to-cart', e => {
    const id = parseInt(e.target.dataset.id, 10);
    const product = products.find(p => p.id === id);
    if (product) {
        state.cart.push(product);
        saveCart();
        closeModal();
    }
});
on(document, 'click', '#bottom-nav .nav-btn', e => {
    const button = e.target.closest('.nav-btn');
    if (button && button.dataset.screen) {
        switchScreen(button.dataset.screen);
    }
});
on(document, 'click', '#app-logo', () => {
    switchScreen('catalog');
});

// initialization
(() => {
    loadCart();
    if (!state.activeCategory) state.activeCategory = 'all';
    switchScreen(state.screen);
    window.addEventListener('beforeunload', saveCart);
})();

// ✅ renderAccount — СНАРУЖИ и ДОСТУПНА
function renderAccount() {
    const content = $('#content');
    content.innerHTML = ''; // очищаем

    if (!state.user) {
        content.innerHTML = '<div class="content-block"><p>Не удалось загрузить данные пользователя.</p></div>';
        return;
    }

    const { id, first_name, last_name } = state.user;

    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#80CBC4'];
    const color = colors[id % colors.length];

    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 64, 64);

    ctx.font = 'bold 32px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const firstLetter = first_name[0]?.toUpperCase() || '?';
    ctx.fillText(firstLetter, 32, 32);

    const avatarUrl = canvas.toDataURL();

    content.innerHTML = `
        <div class="content-block">
            <div class="account-header">
                <img src="${avatarUrl}" alt="User Avatar" class="account-avatar">
                <div class="account-info">
                    <div class="account-name">${first_name} ${last_name || ''}</div>
                    <div class="account-id">ID: ${id}</div>
                </div>
            </div>
        </div>
    `;
}