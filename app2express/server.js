const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const express = require('express');

//const port = 3000;
const port = process.env.PORT || 3000;


const app = express();
app.use(express.json());

/*
    План модифікації бібліотеки:

    1. Додати стартову сторінку з вибором між режимом читача та бібліотекаря.
    2. Реалізувати режим читача:
        - Відображення списку книг.
    3. Реалізувати режим бібліотекаря:
        - Додати можливість додавання нових книг.
        - Додати можливість видалення книг.
    4. Для входу до режиму бібліотекаря можна використовувати просту форму з паролем.
    Якщо пароль правильний, користувач отримує доступ до функцій бібліотекаря.
    5. Пароль не має зберігатися у відкритому вигляді, а може бути захищений
    за допомогою хешування.
    6. Може бути декілька користувачів з різними правами доступу
    (наприклад, читачі та бібліотекарі),
    7. Необхідно забезпечити безпеку даних, наприклад, за допомогою аутентифікації та авторизації,
    8. Можна додати можливість редагування інформації про книги
    (наприклад, змінювати назву, автора тощо).
    9. Користувач-адміністратор може створювати інших користувачів з різними
    правами доступу та редагувати їхні дані - може бути певна панель адміністратора.
    10. Можна додати можливість пошуку книг за назвою, автором або жанром.
    11. Можна додати можливість сортування книг за різними критеріями (наприклад, за назвою, автором, датою додавання тощо).

*/

// CORS
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.status(204).end();
    next();
});

app.use((req, res, next) => {
    console.log(`${new Date().toISOString()}: ${req.method} ${req.url}`);
    next();
});

const BOOKS_FILE = path.join(__dirname, 'books.json');
const USERS_FILE = path.join(__dirname, 'users.json');
const SESSION_TTL = 2 * 60 * 60 * 1000; // 2 години

// Допоміжні функції для роботи з файлами
async function loadData(filePath) {
    const data = await fs.promises.readFile(filePath, 'utf8');
    return JSON.parse(data);
}

async function saveData(filePath, data) {
    await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}

// Хешування паролів (scrypt)
function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, Buffer.from(salt, 'hex'), 64).toString('hex');
    return salt + ':' + hash;
}

function verifyPassword(password, storedHash) {
    const [salt, hash] = storedHash.split(':');
    const computed = crypto.scryptSync(password, Buffer.from(salt, 'hex'), 64);
    return crypto.timingSafeEqual(computed, Buffer.from(hash, 'hex'));
}

// Сесії (токени)
const sessions = new Map();

function authMiddleware(...roles) {
    return (req, res, next) => {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'Необхідна автентифікація' });
        }

        const token = authHeader.split(' ')[1];
        const session = sessions.get(token);
        if (!session) {
            return res.status(401).json({ success: false, message: 'Недійсний токен' });
        }

        if (Date.now() > session.expires) {
            sessions.delete(token);
            return res.status(401).json({ success: false, message: 'Токен прострочений' });
        }

        if (roles.length > 0 && !roles.includes(session.role)) {
            return res.status(403).json({ success: false, message: 'Недостатньо прав доступу' });
        }

        req.user = { id: session.userId, username: session.username, role: session.role };
        next();
    };
}

function cleanExpiredSessions() {
    const now = Date.now();
    for (const [token, session] of sessions) {
        if (now > session.expires) sessions.delete(token);
    }
}

// Дані (завантажуються асинхронно при старті)
let books = [];
let users = [];

// ─── Автентифікація ───

app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Логін та пароль обовʼязкові' });
    }

    const user = users.find(u => u.username === username);
    if (!user || !verifyPassword(password, user.passwordHash)) {
        return res.status(401).json({ success: false, message: 'Невірний логін або пароль' });
    }

    cleanExpiredSessions();
    const token = crypto.randomBytes(32).toString('hex');
    sessions.set(token, {
        userId: user.id,
        username: user.username,
        role: user.role,
        expires: Date.now() + SESSION_TTL
    });

    res.json({ success: true, token, role: user.role, username: user.username });
});

app.post('/api/auth/logout', authMiddleware(), (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    sessions.delete(token);
    res.json({ success: true, message: 'Вихід виконано' });
});

app.get('/api/auth/me', authMiddleware(), (req, res) => {
    res.json({ success: true, user: req.user });
});

// ─── Книги ───

app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: "Сервер працює",
        timestamp: new Date().toISOString()
    });
});

app.get('/api/books', (req, res) => {
    const { search, sort, order, genre } = req.query;
    let result = [...books];

    // Пошук за назвою, автором або жанром
    if (search) {
        const term = search.toLowerCase();
        result = result.filter(b =>
            b.title.toLowerCase().includes(term) ||
            b.author.toLowerCase().includes(term) ||
            (b.genre && b.genre.toLowerCase().includes(term))
        );
    }

    // Фільтр за жанром
    if (genre) {
        result = result.filter(b => b.genre === genre);
    }

    // Сортування
    if (sort) {
        const sortOrder = order === 'desc' ? -1 : 1;
        result.sort((a, b) => {
            let aVal = a[sort];
            let bVal = b[sort];
            if (sort === 'title' || sort === 'author' || sort === 'genre') {
                aVal = (aVal || '').toLowerCase();
                bVal = (bVal || '').toLowerCase();
            }
            if (aVal < bVal) return -1 * sortOrder;
            if (aVal > bVal) return 1 * sortOrder;
            return 0;
        });
    }

    res.json(result);
});

app.get('/api/genres', (req, res) => {
    const genres = [...new Set(books.map(b => b.genre).filter(g => g))];
    genres.sort();
    res.json(genres);
});

app.post('/api/books', authMiddleware('librarian', 'admin'), (req, res) => {
    const { title, author, genre, year } = req.body;
    if (!title || !author || !title.trim() || !author.trim()) {
        return res.status(400).json({ success: false, message: 'Назва та автор обовʼязкові' });
    }

    const newBook = {
        id: books.length > 0 ? Math.max(...books.map(b => b.id)) + 1 : 1,
        title: title.trim(),
        author: author.trim(),
        genre: genre ? genre.trim() : '',
        year: year ? parseInt(year) : null,
        createdAt: new Date().toISOString()
    };
    books.push(newBook);

    saveData(BOOKS_FILE, books).then(() => {
        console.log('Додано нову книгу:', newBook);
        res.status(201).json(newBook);
    }).catch(err => {
        console.error('Помилка збереження:', err);
        res.status(500).json({ success: false, message: 'Помилка збереження даних' });
    });
});

app.put('/api/books/:id', authMiddleware('librarian', 'admin'), (req, res) => {
    const id = parseInt(req.params.id);
    const book = books.find(b => b.id === id);
    if (!book) {
        return res.status(404).json({ success: false, message: `Книгу з id ${id} не знайдено` });
    }

    const { title, author, genre, year } = req.body;
    if (!title || !author || !title.trim() || !author.trim()) {
        return res.status(400).json({ success: false, message: 'Назва та автор обовʼязкові' });
    }

    book.title = title.trim();
    book.author = author.trim();
    if (genre) book.genre = genre.trim();
    if (year) book.year = parseInt(year);

    saveData(BOOKS_FILE, books).then(() => {
        console.log('Оновлено книгу:', book);
        res.json({ success: true, book });
    }).catch(err => {
        console.error('Помилка збереження:', err);
        res.status(500).json({ success: false, message: 'Помилка збереження даних' });
    });
});

app.delete('/api/books/:id', authMiddleware('librarian', 'admin'), (req, res) => {
    const id = parseInt(req.params.id);
    const book = books.find(b => b.id === id);
    if (!book) {
        return res.status(404).json({ success: false, message: `Книгу з id ${id} не знайдено` });
    }

    books = books.filter(b => b.id !== id);
    saveData(BOOKS_FILE, books).then(() => {
        console.log(`Книга з id ${id} видалена`);
        res.json({ success: true, message: `Книга з id ${id} видалена` });
    }).catch(err => {
        console.error('Помилка збереження:', err);
        res.status(500).json({ success: false, message: 'Помилка збереження даних' });
    });
});

// ─── Користувачі (тільки адмін) ───

app.get('/api/users', authMiddleware('admin'), (req, res) => {
    const usersWithoutPasswords = users.map(u => {
        const { passwordHash, ...rest } = u;
        return rest;
    });
    res.json({ users: usersWithoutPasswords });
});

app.post('/api/users', authMiddleware('admin'), (req, res) => {
    const { username, password, role } = req.body;
    if (!username || !password || !role) {
        return res.status(400).json({ success: false, message: 'Логін, пароль і роль обовʼязкові' });
    }

    if (!['reader', 'librarian', 'admin'].includes(role)) {
        return res.status(400).json({ success: false, message: 'Невірна роль' });
    }

    if (users.find(u => u.username === username)) {
        return res.status(400).json({ success: false, message: 'Користувач з таким логіном вже існує' });
    }

    const newUser = {
        id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
        username,
        passwordHash: hashPassword(password),
        role,
        createdAt: new Date().toISOString()
    };
    users.push(newUser);

    saveData(USERS_FILE, users).then(() => {
        console.log('Додано користувача:', newUser.username);
        const { passwordHash, ...userWithoutPass } = newUser;
        res.status(201).json({ success: true, user: userWithoutPass });
    }).catch(err => {
        console.error('Помилка збереження:', err);
        res.status(500).json({ success: false, message: 'Помилка збереження даних' });
    });
});

app.delete('/api/users/:id', authMiddleware('admin'), (req, res) => {
    const id = parseInt(req.params.id);
    const user = users.find(u => u.id === id);
    if (!user) {
        return res.status(404).json({ success: false, message: `Користувача з id ${id} не знайдено` });
    }

    if (user.id === req.user.id) {
        return res.status(400).json({ success: false, message: 'Неможливо видалити самого себе' });
    }

    users = users.filter(u => u.id !== id);
    saveData(USERS_FILE, users).then(() => {
        console.log(`Користувача з id ${id} видалено`);
        res.json({ success: true, message: `Користувача з id ${id} видалено` });
    }).catch(err => {
        console.error('Помилка збереження:', err);
        res.status(500).json({ success: false, message: 'Помилка збереження даних' });
    });
});

// ─── Статичні файли ───

app.use(express.static(path.join(__dirname, 'public')));

// ─── Запуск сервера ───

async function startServer() {
    books = await loadData(BOOKS_FILE);
    users = await loadData(USERS_FILE);
    app.listen(port, () => {
        console.log(`Сервер працює на порту ${port}`);
    });
}

startServer().catch(err => {
    console.error('Помилка запуску сервера:', err);
    process.exit(1);
});