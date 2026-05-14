const API_URL = `${window.location.origin}/api/books`;
const AUTH_URL = `${window.location.origin}/api/auth`;

let currentUser = null;
let authToken = localStorage.getItem('libraryToken');
let searchDebounce = null;

// ─── Ініціалізація ───

document.addEventListener('DOMContentLoaded', () => {
    if (authToken) {
        restoreSession();
    } else {
        showView('view-start');
    }
});

async function restoreSession() {
    try {
        const response = await fetch(`${AUTH_URL}/me`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            showLibrarianView();
        } else {
            authToken = null;
            localStorage.removeItem('libraryToken');
            showView('view-start');
        }
    } catch {
        authToken = null;
        localStorage.removeItem('libraryToken');
        showView('view-start');
    }
}

// ─── Навігація між видами ───

function showView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    document.getElementById(viewId).classList.remove('hidden');

    if (viewId === 'view-reader') {
        loadGenres();
        loadBooks('reader-book-list');
    }
    if (viewId === 'view-librarian') {
        loadGenres();
        loadBooks('book-list');
    }
    if (viewId === 'view-admin') loadUsers();
}

// ─── Автентифікація ───

async function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;

    if (!username || !password) {
        showLoginStatus('Будь ласка, заповніть всі поля', 'error');
        return;
    }

    try {
        const response = await fetch(`${AUTH_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();

        if (response.ok) {
            authToken = data.token;
            currentUser = { id: data.id, username: data.username, role: data.role };
            localStorage.setItem('libraryToken', authToken);
            showLibrarianView();
        } else {
            showLoginStatus(data.message || 'Помилка входу', 'error');
        }
    } catch (error) {
        showLoginStatus('Помилка з\'єднання з сервером', 'error');
    }
}

function showLibrarianView() {
    const userInfo = document.getElementById('user-info');
    userInfo.textContent = `${currentUser.username} (${roleLabel(currentUser.role)})`;

    const adminBtn = document.getElementById('btn-admin-panel');
    if (currentUser.role === 'admin') {
        adminBtn.classList.remove('hidden');
    } else {
        adminBtn.classList.add('hidden');
    }

    showView('view-librarian');
}

async function handleLogout() {
    try {
        await fetch(`${AUTH_URL}/logout`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
    } catch {}

    authToken = null;
    currentUser = null;
    localStorage.removeItem('libraryToken');
    showView('view-start');
}

function logoutReader() {
    showView('view-start');
}

function showLoginStatus(message, type) {
    const statusDiv = document.getElementById('login-status');
    statusDiv.textContent = message;
    statusDiv.className = type;
    setTimeout(() => { statusDiv.textContent = ''; statusDiv.className = ''; }, 5000);
}

function roleLabel(role) {
    const labels = { reader: 'Читач', librarian: 'Бібліотекар', admin: 'Адміністратор' };
    return labels[role] || role;
}

// ─── API-запити з автентифікацією ───

async function apiFetch(url, options = {}) {
    const headers = { ...options.headers };
    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }
    if (options.body && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, { ...options, headers });

    if (response.status === 401 || response.status === 403) {
        authToken = null;
        currentUser = null;
        localStorage.removeItem('libraryToken');
        showView('view-start');
        showStatus('Сесію завершено. Увійдіть знову.', 'error');
        return null;
    }

    return response;
}

// ─── Пошук і сортування ───

function loadBooks(listId, search = '', sort = '', order = 'asc', genre = '') {
    const bookList = document.getElementById(listId);
    if (!bookList) return;

    let url = API_URL;
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (sort) params.set('sort', sort);
    if (order) params.set('order', order);
    if (genre) params.set('genre', genre);

    const queryString = params.toString();
    if (queryString) url += '?' + queryString;

    fetch(url)
        .then(r => r.json())
        .then(books => displayBooks(books, listId))
        .catch(error => {
            console.error('Помилка при завантаженні книжок:', error);
        });
}

function handleSearch(listId) {
    const searchInput = document.getElementById('search-input');
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => {
        loadBooksFromUI(listId);
    }, 300);
}

function handleSortChange(listId) {
    loadBooksFromUI(listId);
}

function loadBooksFromUI(listId) {
    const searchInput = document.getElementById('search-input');
    const sortSelect = document.getElementById('sort-select');
    const orderSelect = document.getElementById('order-select');
    const genreSelect = document.getElementById('genre-select');

    loadBooks(
        listId,
        searchInput ? searchInput.value : '',
        sortSelect ? sortSelect.value : '',
        orderSelect ? orderSelect.value : 'asc',
        genreSelect ? genreSelect.value : ''
    );
}

async function loadGenres() {
    try {
        const response = await fetch(`${API_URL.replace('/books', '/genres')}`);
        const genres = await response.json();
        populateGenreSelects(genres);
    } catch (error) {
        console.error('Помилка при завантаженні жанрів:', error);
    }
}

function populateGenreSelects(genres) {
    const selects = ['reader-genre-select', 'genre-select'];
    selects.forEach(id => {
        const select = document.getElementById(id);
        if (!select) return;
        select.innerHTML = '<option value="">Всі жанри</option>';
        genres.forEach(g => {
            const option = document.createElement('option');
            option.value = g;
            option.textContent = g;
            select.appendChild(option);
        });
    });
}

// ─── Книги ───

async function addBook() {
    const titleInput = document.getElementById('title');
    const authorInput = document.getElementById('author');
    const genreInput = document.getElementById('genre');
    const yearInput = document.getElementById('year');
    const title = titleInput.value.trim();
    const author = authorInput.value.trim();
    const genre = genreInput ? genreInput.value.trim() : '';
    const year = yearInput ? parseInt(yearInput.value) : null;

    if (!title || !author) {
        showStatus('Будь ласка, заповніть назву та автора', 'error');
        return;
    }

    try {
        const response = await apiFetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({ title, author, genre, year })
        });

        if (!response) return;

        if (response.ok) {
            titleInput.value = '';
            authorInput.value = '';
            if (genreInput) genreInput.value = '';
            if (yearInput) yearInput.value = '';
            loadBooks('book-list');
            showStatus('Книжку додано успішно', 'success');
        } else {
            const data = await response.json();
            showStatus(data.message || 'Помилка при додаванні книжки', 'error');
        }
    } catch (error) {
        showStatus('Помилка при додаванні книжки: ' + error.message, 'error');
    }
}

async function deleteBook(id) {
    try {
        const response = await apiFetch(`${API_URL}/${id}`, { method: 'DELETE' });
        if (!response) return;

        if (response.ok) {
            loadBooks('book-list');
            showStatus('Книжку видалено успішно', 'success');
        } else {
            const data = await response.json();
            showStatus(data.message || 'Помилка при видаленні книжки', 'error');
        }
    } catch (error) {
        showStatus('Помилка при видаленні книжки: ' + error.message, 'error');
    }
}

async function editBook(id) {
    const response = await fetch(API_URL);
    const books = await response.json();
    const book = books.find(b => b.id === id);
    if (!book) return;

    const title = prompt('Назва книги:', book.title);
    if (!title) return;
    const author = prompt('Автор:', book.author);
    if (!author) return;
    const genre = prompt('Жанр:', book.genre || '');
    const yearInput = prompt('Рік видання:', book.year || '');
    const year = yearInput ? parseInt(yearInput) : null;

    try {
        const res = await apiFetch(`${API_URL}/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ title, author, genre, year })
        });

        if (!res) return;

        if (res.ok) {
            loadBooks('book-list');
            showStatus('Книжку оновлено', 'success');
        } else {
            const data = await res.json();
            showStatus(data.message || 'Помилка при оновленні', 'error');
        }
    } catch (error) {
        showStatus('Помилка: ' + error.message, 'error');
    }
}

function displayBooks(books, listId) {
    const bookList = document.getElementById(listId);
    if (!bookList) return;

    while (bookList.firstChild) {
        bookList.removeChild(bookList.firstChild);
    }

    if (books.length === 0) {
        const emptyMsg = document.createElement('p');
        emptyMsg.textContent = 'Немає книжок для відображення';
        bookList.appendChild(emptyMsg);
        return;
    }

    const isLibrarian = listId === 'book-list';

    books.forEach(book => {
        const li = document.createElement('li');
        li.className = 'book-item';

        const info = document.createElement('div');
        info.className = 'book-info';

        const titleEl = document.createElement('strong');
        titleEl.textContent = book.title;

        const details = document.createElement('div');
        details.className = 'book-details';

        const authorEl = document.createElement('small');
        authorEl.textContent = book.author;

        const genreEl = document.createElement('small');
        if (book.genre) genreEl.textContent = book.genre;

        const yearEl = document.createElement('small');
        if (book.year) yearEl.textContent = book.year;

        details.appendChild(authorEl);
        if (book.genre) details.appendChild(document.createElement('br'));
        if (book.genre) details.appendChild(genreEl);
        if (book.year) {
            details.appendChild(document.createElement('br'));
            details.appendChild(yearEl);
        }

        info.appendChild(titleEl);
        info.appendChild(details);
        li.appendChild(info);

        if (isLibrarian) {
            const actions = document.createElement('div');
            actions.className = 'book-actions';

            const editBtn = document.createElement('button');
            editBtn.className = 'btn-edit';
            editBtn.textContent = 'Редагувати';
            editBtn.addEventListener('click', () => editBook(book.id));

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn-delete';
            deleteBtn.textContent = 'Видалити';
            deleteBtn.addEventListener('click', () => deleteBook(book.id));

            actions.appendChild(editBtn);
            actions.appendChild(deleteBtn);
            li.appendChild(actions);
        }

        bookList.appendChild(li);
    });
}

// ─── Адміністратор: користувачі ───

async function loadUsers() {
    try {
        const response = await apiFetch(`${window.location.origin}/api/users`);
        if (!response || !response.ok) return;

        const data = await response.json();
        displayUsers(data.users);
    } catch (error) {
        console.error('Помилка при завантаженні користувачів:', error);
    }
}

function displayUsers(users) {
    const tbody = document.getElementById('user-list');
    while (tbody.firstChild) {
        tbody.removeChild(tbody.firstChild);
    }

    users.forEach(user => {
        const tr = document.createElement('tr');

        const tdId = document.createElement('td');
        tdId.textContent = user.id;

        const tdUsername = document.createElement('td');
        tdUsername.textContent = user.username;

        const tdRole = document.createElement('td');
        const badge = document.createElement('span');
        badge.className = `role-badge role-${user.role}`;
        badge.textContent = roleLabel(user.role);
        tdRole.appendChild(badge);

        const tdCreated = document.createElement('td');
        tdCreated.textContent = new Date(user.createdAt).toLocaleDateString('uk-UA');

        const tdActions = document.createElement('td');
        if (user.id !== currentUser.id) {
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn-delete';
            deleteBtn.textContent = 'Видалити';
            deleteBtn.addEventListener('click', () => deleteUser(user.id));
            tdActions.appendChild(deleteBtn);
        }

        tr.appendChild(tdId);
        tr.appendChild(tdUsername);
        tr.appendChild(tdRole);
        tr.appendChild(tdCreated);
        tr.appendChild(tdActions);

        tbody.appendChild(tr);
    });
}

async function handleAddUser(event) {
    event.preventDefault();
    const username = document.getElementById('new-username').value.trim();
    const password = document.getElementById('new-password').value;
    const role = document.getElementById('new-role').value;

    if (!username || !password) {
        showAdminStatus('Логін та пароль обовʼязкові', 'error');
        return;
    }

    try {
        const response = await apiFetch(`${window.location.origin}/api/users`, {
            method: 'POST',
            body: JSON.stringify({ username, password, role })
        });

        if (!response) return;

        if (response.ok) {
            document.getElementById('new-username').value = '';
            document.getElementById('new-password').value = '';
            await loadUsers();
            showAdminStatus('Користувача додано успішно', 'success');
        } else {
            const data = await response.json();
            showAdminStatus(data.message || 'Помилка при додаванні користувача', 'error');
        }
    } catch (error) {
        showAdminStatus('Помилка: ' + error.message, 'error');
    }
}

async function deleteUser(id) {
    try {
        const response = await apiFetch(`${window.location.origin}/api/users/${id}`, {
            method: 'DELETE'
        });

        if (!response) return;

        if (response.ok) {
            await loadUsers();
            showAdminStatus('Користувача видалено', 'success');
        } else {
            const data = await response.json();
            showAdminStatus(data.message || 'Помилка при видаленні', 'error');
        }
    } catch (error) {
        showAdminStatus('Помилка: ' + error.message, 'error');
    }
}

function showAdminStatus(message, type) {
    const statusDiv = document.getElementById('admin-status');
    statusDiv.textContent = message;
    statusDiv.className = type;
    setTimeout(() => { statusDiv.textContent = ''; statusDiv.className = ''; }, 5000);
}

// ─── Статус ───

function showStatus(message, type) {
    const statusDiv = document.getElementById('status');
    if (!statusDiv) return;
    statusDiv.textContent = message;
    statusDiv.className = type;
    setTimeout(() => { statusDiv.textContent = ''; statusDiv.className = ''; }, 10000);
}