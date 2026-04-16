document.addEventListener('DOMContentLoaded', () => {
    // Змінні стану
    let menuData = [];
    let cart = JSON.parse(localStorage.getItem('restaurantCart')) || [];
    
    // Елементи DOM
    const menuContainer = document.getElementById('menu-container');
    const searchInput = document.getElementById('searchInput');
    const vegFilter = document.getElementById('vegFilter');
    const categoryBtns = document.querySelectorAll('.category-btn');
    const cartCount = document.getElementById('cartCount');
    const cartBtn = document.getElementById('cartBtn');

    // 1. ЗАВАНТАЖЕННЯ ДАНИХ (Fetch API)
    // ------------------------------------------------
    async function loadMenu() {
        try {
            const response = await fetch('menu.json');
            if (!response.ok) throw new Error('Помилка завантаження');
            menuData = await response.json();
            renderMenu(menuData);
        } catch (error) {
            console.error(error);
            menuContainer.innerHTML = '<p class="text-center text-danger">Не вдалося завантажити меню :(</p>';
        }
    }

    // 2. ВІДОБРАЖЕННЯ МЕНЮ (DOM Manipulation)
    // ------------------------------------------------
    function renderMenu(items) {
        menuContainer.innerHTML = '';
        
        if (items.length === 0) {
            menuContainer.innerHTML = '<p class="text-center">Нічого не знайдено</p>';
            return;
        }

        items.forEach(item => {
            // Створення іконок
            const vegIcon = item.vegetarian ? '<span class="badge bg-success ms-1" title="Вегетаріанське"><i class="bi bi-leaf"></i></span>' : '';
            const spicyIcon = item.spicy ? '<span class="badge bg-danger ms-1" title="Гостре"><i class="bi bi-fire"></i></span>' : '';

            // Створення картки
            const card = document.createElement('div');
            card.className = 'col-lg-4 col-md-6 fade-in';
            card.innerHTML = `
                <div class="card h-100 dish-card border-0 shadow-sm">
                    <img src="${item.image}" class="card-img-top" alt="${item.name}" style="height: 200px; object-fit: cover;">
                    <div class="card-body text-center">
                        <h5 class="card-title font-serif">${item.name} ${vegIcon} ${spicyIcon}</h5>
                        <p class="card-text text-muted small">${item.ingredients.join(', ')}</p>
                        <h5 class="text-warning fw-bold">${item.price} грн</h5>
                        <button class="btn btn-outline-dark btn-sm mt-2" onclick="addToCart(${item.id})">
                            В кошик <i class="bi bi-cart-plus"></i>
                        </button>
                    </div>
                </div>
            `;
            menuContainer.appendChild(card);
        });
    }

    // 3. ФІЛЬТРАЦІЯ (Interactivity)
    // ------------------------------------------------
    function filterMenu() {
        const searchTerm = searchInput.value.toLowerCase();
        const isVeg = vegFilter.checked;
        const activeCategory = document.querySelector('.category-btn.active').dataset.category;

        const filtered = menuData.filter(item => {
            // Перевірка категорії
            const categoryMatch = activeCategory === 'all' || item.category === activeCategory;
            // Перевірка вегетаріанства
            const vegMatch = !isVeg || item.vegetarian;
            // Перевірка пошуку (назва або інгредієнти)
            const searchMatch = item.name.toLowerCase().includes(searchTerm) || 
                                item.ingredients.some(ing => ing.toLowerCase().includes(searchTerm));
            
            return categoryMatch && vegMatch && searchMatch;
        });

        renderMenu(filtered);
    }

    // Слухачі подій для фільтрів
    searchInput.addEventListener('input', filterMenu);
    vegFilter.addEventListener('change', filterMenu);

    categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Зміна активної кнопки
            categoryBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filterMenu();
        });
    });

    // 4. КОШИК (LocalStorage)
    // ------------------------------------------------
    window.addToCart = function(id) {
        const item = menuData.find(i => i.id === id);
        cart.push(item);
        updateCartUI();
        saveCart();
        alert(`${item.name} додано до кошика!`);
    };

    function updateCartUI() {
        cartCount.textContent = cart.length;
    }

    function saveCart() {
        localStorage.setItem('restaurantCart', JSON.stringify(cart));
    }

    // Клік на кошик (показує суму)
    cartBtn.addEventListener('click', () => {
        if(cart.length === 0) {
            alert("Кошик порожній");
            return;
        }
        const total = cart.reduce((sum, item) => sum + item.price, 0);
        alert(`У вас ${cart.length} товарів на суму ${total} грн.\n(Тут могло б бути модальне вікно замовлення)`);
    });

    // 5. БРОНЮВАННЯ (Form & Validation)
    // ------------------------------------------------
    // Заповнення часу роботи
    const timeSelect = document.getElementById('timeInput');
    for (let i = 10; i <= 22; i++) {
        const option = document.createElement('option');
        option.value = `${i}:00`;
        option.textContent = `${i}:00`;
        timeSelect.appendChild(option);
    }

    const bookingForm = document.getElementById('bookingForm');
    bookingForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const phone = document.getElementById('phoneInput');
        // Проста валідація телефону (мінімум 10 цифр)
        const phoneRegex = /^\+?[0-9]{10,12}$/;

        if (!phoneRegex.test(phone.value.replace(/[\s-]/g, ''))) {
            phone.classList.add('is-invalid');
            return;
        } else {
            phone.classList.remove('is-invalid');
            phone.classList.add('is-valid');
        }

        alert('Столик заброньовано успішно!');
        bookingForm.reset();
        document.querySelectorAll('.is-valid').forEach(el => el.classList.remove('is-valid'));
    });

    // 6. LIGHTBOX ГАЛЕРЕЯ
    // ------------------------------------------------
     
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const closeBtn = document.querySelector('.close-lightbox');

    // Делегування подій (бо галерея статична, але це хороша практика)
    document.getElementById('gallery').addEventListener('click', (e) => {
        if (e.target.classList.contains('gallery-item')) {
            lightbox.style.display = 'block';
            lightboxImg.src = e.target.src;
        }
    });

    closeBtn.addEventListener('click', () => {
        lightbox.style.display = 'none';
    });

    // Закриття по ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === "Escape") lightbox.style.display = 'none';
    });

    // Ініціалізація
    loadMenu();
    updateCartUI();
});