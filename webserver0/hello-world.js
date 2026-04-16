const http = require('node:http');
const url = require('url');
const fs = require('fs');
const path = require('path');

const hostname = '127.0.0.1';
const port = 3000;

const server = http.createServer((req, res) => {
    console.log(`Received request: ${req.method} ${req.url}`);
    const parsedUrl = url.parse(req.url, true);
    
    if(parsedUrl.pathname === '/user') {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/html');
        res.write('<h1>User Page</h1>\n');
        res.end();
        return;
    }

    if(parsedUrl.pathname === '/ls') {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        const baseDir = path.resolve('../public');
        let requestedDir = parsedUrl.query.dir;
        if (requestedDir === undefined && parsedUrl.search && parsedUrl.search.startsWith('?')) {
            requestedDir = parsedUrl.search.slice(1);
        }
        requestedDir = requestedDir || '.';
        const dir = path.resolve(baseDir, requestedDir);
        if (dir !== baseDir && !dir.startsWith(baseDir + path.sep)) {
            res.write('<p>Доступ заборонено</p>\n');
            res.end();
            return;
        }
        res.write('<h1>Вміст каталогу</h1>\n');
        if (dir !== baseDir) {
            const parentRelative = path.relative(baseDir, path.dirname(dir));
            res.write(`<a href="/ls?dir=${encodeURIComponent(parentRelative)}">ДОГОРИ!</a><br>\n`);
        }
        console.log(`Reading directory: ${dir}`);
        try {
            const files = fs.readdirSync(dir);
            res.write('<ul>\n');
            for (const file of files) {
                const fullPath = path.join(dir, file);
                try {
                    const stat = fs.statSync(fullPath);
                    if (stat.isDirectory()) {
                        const relativePath = path.relative(baseDir, fullPath);
                        res.write(`<li><a href="/ls?dir=${encodeURIComponent(relativePath)}">${file}/</a></li>\n`);
                    } else {
                        const relativePath = path.relative(baseDir, fullPath);
                        res.write(`<li><a href="/download?file=${encodeURIComponent(relativePath)}">${file}</a></li>\n`);
                    }
                } catch (err) {
                    res.write(`<li>${file} (error)</li>\n`);
                }
            }
            res.write('</ul>\n');
        } catch (err) {
            res.write('<p>Помилка читання каталогу</p>\n');
        }
        res.end();
        return;
    }

    // Аналіз req.url для /client з параметрами запиту
    if(parsedUrl.pathname === '/client') {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.write('<h1>Client Page</h1>\n');

        const query = parsedUrl.query;

        if (Object.keys(query).length === 0) {
            res.write('<p>Немає товарів</p>\n');
        } else {
            res.write('<h2>Список товарів</h2>\n');
            res.write('<table border="1">\n');
            res.write('<tr><th>Тип товару</th><th>Назва товару</th></tr>\n');
            for (const [key, value] of Object.entries(query)) {
                res.write(`<tr><td>${key}</td><td>${value}</td></tr>\n`);
            }
            res.write('</table>\n');
        }
        console.log('Query params:', query);
        res.end();
        return;
    }

    if(parsedUrl.pathname === '/download') {
        const baseDir = path.resolve('../public');
        const relativePath = decodeURIComponent(parsedUrl.query.file || '');
        if (!relativePath) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'text/plain');
            res.end('Bad Request: no file specified');
            return;
        }
        const filePath = path.resolve(baseDir, relativePath);        console.log(`Processing download for file: ${relativePath}, resolved to: ${filePath}`);        if (filePath !== baseDir && !filePath.startsWith(baseDir + path.sep)) {
            res.statusCode = 403;
            res.setHeader('Content-Type', 'text/plain');
            res.end('Forbidden');
            return;
        }
        try {
            const stat = fs.statSync(filePath);
            if (stat.isFile()) {
                res.setHeader('Content-Type', 'application/octet-stream');
                res.setHeader('Content-Disposition', `attachment; filename="${path.basename(filePath)}"`);
                res.end(fs.readFileSync(filePath));
            } else {
                res.statusCode = 404;
                res.setHeader('Content-Type', 'text/plain');
                res.end('Not Found: not a file');
            }
        } catch (err) {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'text/plain');
            res.end('Not Found');
        }
        return;
    }

    res.statusCode = 404;
    // встановити кодування для української мови
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.write('<h1>Page Not Found - це наше повідомлення</h1>\n');
    res.end();
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
