const fs = require('fs');
const path = require('path');
const express = require('express');

const app = express();
app.use(express.json());

// CORS
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(204).end();
    next();
});

const port = 3000;

let books;
const booksData = fs.readFileSync('books.json', 'utf8');
books = JSON.parse(booksData);

app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: "Сервер працює",
        timestamp: new Date().toISOString()
    });
});

app.get('/api/books', (req, res) => {
    res.json(books);
});

app.post('/api/books', (req, res) => {
    const newBook = req.body;
    newBook.id = books.length + 1;
    books.push(newBook);
    fs.writeFileSync('books.json', JSON.stringify(books, null, 2), 'utf8');
    console.log('Додано нову книгу:', newBook);
    res.status(201).json(newBook);
});

app.delete('/api/books/:id', (req, res) => {
    const id = parseInt(req.params.id);
    books = books.filter(book => book.id !== id);
    fs.writeFileSync('books.json', JSON.stringify(books, null, 2), 'utf8');
    console.log(`Книга з id ${id} видалена`);
    res.json({ success: true, message: `Книга з id ${id} видалена` });
});

app.use(express.static(path.join(__dirname, 'public')));

app.listen(port, () => {
    console.log(`Сервер працює на порту ${port}`);
});