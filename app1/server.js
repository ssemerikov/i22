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
        
        //res.end(JSON.stringify(books));
        res.end();
        res.statusCode = 201;
    }
    else {
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
