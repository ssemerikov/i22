//console.log("Наш сервер працює");

const http = require('http'); // Підключення модуля (б-ка)
const url = require("url");
const fs = require('fs');
const path = require('path');

const port = 3000; // номер порту


let books;

// прочитати книжки з файлу books.json
const booksData = fs.readFileSync('books.json', 'utf8');
books = JSON.parse(booksData);

//типи MIME для різних типів файлів
const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif'
};

const server = http.createServer((req, res) => {

    const parsedURL = url.parse(req.url, true);
    //console.log(parsedURL);
    const pathname = parsedURL.pathname;
    const method = req.method;

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    //res.setHeader('Content-Type', 'application/json');

    if (method === 'OPTIONS') {
        res.statusCode = 204;
        res.end();
        return;
    }

    console.log(method, pathname);

    res.statusCode = 200;

    // роутинг
    if(pathname === "/api/books" && method === "GET") {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(books));
        return;
    }

    if(pathname === "/api/books" && method === "POST") {
        console.log("Отримано запит на додавання книги");
        // додати книгу
        let body = "";
        req.on("data", chunk => {
            body += chunk;//.toString();
        });
        req.on("end", () => {
            const newBook = JSON.parse(body);
            newBook.id = books.length + 1;
            books.push(newBook);
            // зберегти оновлений список книжок у файл
            fs.writeFileSync('books.json', JSON.stringify(books, null, 2), 'utf8');
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 201;
            res.end(JSON.stringify(newBook));
            console.log("Додано нову книгу:", newBook);
        });
        return;
    }
    
    if(pathname.startsWith("/api/books") && method === "DELETE") {
        //видалення книги
        const id = parseInt(pathname.split("/").pop()); // отримуємо id з URL: [3]
        books = books.filter(book => book.id !== id);
        // зберегти оновлений список книжок у файл
        fs.writeFileSync('books.json', JSON.stringify(books, null, 2), 'utf8');
        console.log(`Книга з id ${id} видалена`);
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(
            { success: true, message: `Книга з id ${id} видалена`}
        ));   
        return;     
    }
    
    // обробка статичних файлів (HTML, CSS, JS) -- недороблено, не працює
    const publicPath = path.join(__dirname, 'public');
    let filePath = path.join(publicPath, pathname === '/' ? 'index.html' : pathname);
    const ext = path.extname(filePath);
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.statusCode = 404;
            res.end('Файл не знайдено');
        } else {
            res.setHeader('Content-Type', contentType);
            res.end(content);
        }
    });

    if(pathname === "/api/health" && method === "GET") {
            res.end(JSON.stringify(
                { success: true, message: "Сервер працює",
                    timestamp: new Date().toISOString()
                 }
            ));
        }
    else {
        res.statusCode = 404;
        res.end(JSON.stringify(
            {   
                pathname: pathname,
                message: "Невідомий шлях, використовуйте /api/books"
            }
        ));
    }

    /*
    */
});

server.listen(port, () => {
  console.log(`Сервер працює на порту ${port}`);
});
