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
    '.jshttps://d85f-193-151-15-243.ngrok-free.app/api/health': 'application/javascript',
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

    if(pathname === "/api/health" && method === "GET") {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify(
                { success: true, message: "Сервер працює",
                    timestamp: new Date().toISOString()
                 }
            ));
            return;
    }


    res.statusCode = 200;

    // роутинг
    if(pathname === "/api/books" && method === "GET") {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
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
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
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
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify(
            { success: true, message: `Книга з id ${id} видалена`}
        ));   
        return;     
    }
    
    // обробка статичних файлів (HTML, CSS, JS)
    let filePath = pathname === '/' ? 'index.html' : pathname;
    filePath = path.join(__dirname, 'public', filePath);
    const ext = path.extname(filePath);
    const contentType = mimeTypes[ext] || 'text/plain';
    console.log("Запит на файл:", filePath);
    console.log("Content-Type:", contentType);

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.statusCode = 404;
                res.setHeader('Content-Type', 'text/html; charset=utf-8');
                res.end('<h1>404 - файл не знайдено</h1>');
            }
            else {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'text/html; charset=utf-8');
                res.end('<h1>500 - внутрішня помилка сервера</h1>');
            }
        }
        else {
            res.statusCode = 200;
            if (contentType.startsWith('text/') || contentType === 'application/javascript' || contentType === 'application/json') {
                res.setHeader('Content-Type', contentType + '; charset=utf-8');
            } else {
                res.setHeader('Content-Type', contentType);
            }
            res.end(content);
        }
    });



    /*
    else {
        res.statusCode = 404;
        res.end(JSON.stringify(
            {   
                pathname: pathname,
                message: "Невідомий шлях, використовуйте /api/books"
            }
        ));
    }

    */
});

server.listen(port, () => {
  console.log(`Сервер працює на порту ${port}`);
});
