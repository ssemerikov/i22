			let hidden_section, users;

			fetch('section.hidden')
			  .then(response => response.text()) // 1. Отримати відповідь і викликати .text()
			  .then(data => {
			    hidden_section = data; // 2. Присвоїти текстовий вміст змінній
			  })
			  .catch(error => console.error('Помилка завантаження файлу section.hidden:', error)); // Додатково: для обробки помилок			

			fetch('users.json')
			  .then(response => response.json()) // 1. Отримати відповідь і викликати .json()
			  .then(data => {
			    users = data; // 2. Присвоїти текстовий вміст змінній
			  })
			  .catch(error => console.error('Помилка завантаження файлу users.json:', error)); // Додатково: для обробки помилок			


// Створюємо асинхронну функцію
async function loadUsers() {
  try {
    const response = await fetch('users.json'); // 1. Чекаємо на відповідь від сервера
    const users = await response.json();     // 2. Чекаємо на перетворення даних у JSON

    // Працюємо з даними тут, після того як вони гарантовано завантажені
    console.log('Дані завантажено:', users);
    console.log('Перший користувач:', users[0].user);

  } catch (error) {
    console.error('Помилка завантаження файлу:', error);
  }
}

// Викликаємо функцію, щоб запустити процес
//loadUsers();			

		function entersection() {
		
			const username = document.getElementById("username").value;
			
			const password = document.getElementById("password").value;
			
			const section_sklad = document.getElementById("sklad");

			let canenter = false;
			
			for(let u of users) {
				if(u.user == username && u.pass == password)
					canenter = true;
			}
			
			if(canenter) {
				alert("Вам дозволено увійти до секції");
				section_sklad.innerHTML = hidden_section; //"<h1>Вам дозволено увійти до секції</h1>";
			}
			else
				alert("Вам не дозволено увійти до секції");
		}

