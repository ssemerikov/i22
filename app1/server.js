//console.log("Наш сервер працює");

const http = require('http'); // Підключення модуля (б-ка)
const url = require("url");

const port = 3000; // номер порту

let books = [
    {
        id: 1,
        author: "Пітер Гамільтон",
        title: "Нейтронний алхімік"
    },
    {
        id: 2,
        author: "Кім Стенлі Робінсон",
        title: "Червоний Марс"
    },
    {
        id: 3,
        author: "Енді Вейр",
        title: "Артеміда"
    }
];


const server = http.createServer((req, res) => {

    res.setHeader('Content-Type', 'application/json');

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');

    const parsedURL = url.parse(req.url, true);
    //console.log(parsedURL);

    const pathname = parsedURL.pathname;
    const method = req.method;

    if (method === 'OPTIONS') {
        res.statusCode = 204;
        res.end();
        return;
    }

    console.log(method, pathname);

    res.statusCode = 200;

    // роутинг
    if(pathname === "/api/books" && method === "GET") {
        res.end(JSON.stringify(books));
    }
    else if(pathname === "/api/books" && method === "POST") {
        // додати книгу
        let body = "";
        req.on("data", chunk => {
            body += chunk;//.toString();
        });
        req.on("end", () => {
            const newBook = JSON.parse(body);
            newBook.id = books.length + 1;
            books.push(newBook);
            res.statusCode = 201;
            res.end(JSON.stringify(newBook));
            console.log("Додано нову книгу:", newBook);
        });
    }
    else if(pathname.startsWith("/api/books") && method === "DELETE") {
        //видалення книги
        const id = parseInt(pathname.split("/").pop()); // отримуємо id з URL: [3]
        books = books.filter(book => book.id !== id);
        console.log(`Книга з id ${id} видалена`);
        res.end(JSON.stringify(
            { success: true, message: `Книга з id ${id} видалена`}
        ));        
     }
     else if(pathname === "/api/health" && method === "GET") {
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
