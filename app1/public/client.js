const API_URL = 'http://localhost:3000/api/books';

//const API_URL = 'https://24e2-193-151-15-243.ngrok-free.app/api/books';

// завантаження книжок при старті документу
document.addEventListener("DOMContentLoaded", loadBooks);

// отримання книжок з сервера
async function loadBooks() {
    try {
        const response = await fetch(API_URL);
        const books = await response.json();
        console.log(books);
        displayBooks(books);
    }
    catch (error) {
        console.error("Помилка при завантаженні книжок:", error);
        showStatus("Помилка при завантаженні книжок: " + error.message, 'error');
    }
}

// додання книжки
async function addBook() {
    const titleInput = document.getElementById("title");
    const authorInput = document.getElementById("author");
    const title = titleInput.value.trim();
    const author = authorInput.value.trim();

    if (!title || !author) {
        showStatus("Будь ласка, заповніть всі поля", 'error');
        return;
    }

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, author })
        });
        
        if (response.ok) {
            titleInput.value = '';
            authorInput.value = '';
            await loadBooks();
            showStatus("Книжку додано успішно", 'success');
        } 
    }
    catch (error) {
        console.error("Помилка при додаванні книжки:", error);
        showStatus("Помилка при додаванні книжки: " + error.message, 'error');
    }
}

// видалення книжки
async function deleteBook(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        if (response.ok) {
            await loadBooks();
            showStatus("Книжку видалено успішно", 'success');
        } 
    }
    catch (error) {
        console.error("Помилка при видаленні книжки:", error);
        showStatus("Помилка при видаленні книжки: " + error.message, 'error');
    }
}

// відображення книжок на сторінці
function displayBooks(books) {
    const bookList = document.getElementById("book-list");

    if(books.length === 0) {
        bookList.innerHTML = "<li>Немає книжок для відображення</li>";
        return;
    }
    bookList.innerHTML = books.map(book => `
        <li>
            <strong>${book.title}</strong> <br> <small>${book.author}</small>
            <button class="delete-btn" onclick="deleteBook(${book.id})">Видалити</button>
        </li>
    `).join('');
}

// показ статусу операції
function showStatus(message, type) {
    const statusDiv = document.getElementById("status");
    statusDiv.textContent = message;
    statusDiv.className = type; // 'success' або 'error'
    setTimeout(() => {
        statusDiv.textContent = '';
        statusDiv.className = '';
    }, 3000);
}
