// Telegram WebApp initialization
const tg = window.Telegram ? window.Telegram.WebApp : null;
if (tg) {
    tg.expand();
    tg.MainButton.hide();
    // apply theme parameters to css variables if available
    const params = tg.themeParams;
    if (params) {
        const root = document.documentElement;
        // map some common colors
        if (params.bg_color) root.style.setProperty('--color-background', params.bg_color);
        if (params.text_color) root.style.setProperty('--color-text', params.text_color);
        if (params.button_color) root.style.setProperty('--color-primary', params.button_color);
        if (params.button_text_color) root.style.setProperty('--color-text', params.button_text_color);
    }
}

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
    { id: 3, title: 'Вывеска', categories: ['all','production'], price: '300', img: 'https://lh3.google.com/u/0/d/1ySGtGjFBfB6hf1E6g5-k0GlepFfKs_vc=w1920-h966-iv1?auditContext=prefetch', desc: 'Описание товара 3' },
    { id: 4, title: 'Короб', categories: ['all','production'], price: '400', img: 'https://via.placeholder.com/400x300?text=Товар+4', desc: 'Описание товара 4' },
    { id: 5, title: 'Товар 5', categories: ['all','documents'], price: '500', img: 'https://via.placeholder.com/400x300?text=Товар+5', desc: 'Описание товара 5' },
    { id: 6, title: 'Товар 6', categories: ['all','documents'], price: '600', img: 'https://via.placeholder.com/400x300?text=Товар+6', desc: 'Описание товара 6' },
];

let state = {
    screen: 'catalog', // catalog, cart, about
    activeCategory: null,
    cart: [],
};

// helpers
function $(selector) {
    return document.querySelector(selector);
}
function on(parent, event, selector, handler) {
    parent.addEventListener(event, e => {
        if (e.target.closest(selector)) handler(e);
    });
}

// render functions
function renderCategoryFilter() {
    const container = $('#category-filter');
    container.innerHTML = '';

    // add category buttons (including "all" itself)
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
            renderCart();
        });
        list.appendChild(div);
    });

    content.appendChild(list);
    const info = document.createElement('div');
    info.id = 'cart-info';
    info.textContent = 'Полезная информация о заказе будет здесь.';
    content.appendChild(info);
    const contract = document.createElement('div');
    contract.id = 'cart-contract';
    contract.innerHTML = `
        <label><input type="checkbox" id="agree"> Я согласен</label>
        <button id="pay-button">Оплатить заказ</button>
    `;
    content.appendChild(contract);
}

function renderAbout() {
    const content = $('#content');
    content.innerHTML = '<div id="about"><p>О проекте</p></div>';
}

function switchScreen(screen) {
    state.screen = screen;
    renderBottomNav();
    if (screen === 'catalog') {
        renderCategoryFilter();
        renderCatalog();
    } else if (screen === 'cart') {
        renderCart();
    } else if (screen === 'about') {
        renderAbout();
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
        closeModal();
    }
});
on(document, 'click', '#bottom-nav .nav-btn', e => {
    switchScreen(e.target.dataset.screen);
});

// initialization
if (!state.activeCategory) state.activeCategory = 'all';
switchScreen(state.screen);
