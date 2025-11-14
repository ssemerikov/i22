	let logprior = null; // Змінено на null для перевірки завантаження
	let loglikelihood = null; // Змінено на null для перевірки завантаження

	/*
        // Завантажити навчену модель із файлу JSON 
        fetch('naive_bayes_model.json')
            .then(response => response.json())
            .then(data => {
                logprior = data.logprior;
                loglikelihood = data.loglikelihood;
            });
        */
        
	// Функція для завантаження моделі з вибраного файлу
	function loadModel(event) {
	    const file = event.target.files[0];
	    if (!file) {
		return;
	    }

	    const reader = new FileReader();

	    reader.onload = function(e) {
		try {
		    const data = JSON.parse(e.target.result);
		    // Перевірка наявності необхідних полів у файлі
		    if (data && typeof data.logprior !== 'undefined' && data.loglikelihood) {
		        logprior = data.logprior;
		        loglikelihood = data.loglikelihood;
		        document.getElementById('result').textContent = "Модель успішно завантажено!";
		    } else {
		        logprior = null;
		        loglikelihood = null;
		        document.getElementById('result').textContent = "Помилка: Невірний формат моделі у файлі.";
		    }
		} catch (error) {
		    logprior = null;
		    loglikelihood = null;
		    document.getElementById('result').textContent = "Помилка при читанні JSON-файлу: " + error.message;
		    console.error(error);
		}
	    };

	    reader.readAsText(file);
	}
        

        // Опрацювання повідомлення
        function processTweet(tweet) {
            // Тут явно варто її покращити
            // return tweet.toLowerCase().split(' ');
            // Тут явно варто її покращити (наприклад, видалити пунктуацію)
	    return tweet.toLowerCase().split(/\s+/).filter(word => word.length > 0);
        }

        // Наївний баєсів класифікатор

        function naiveBayesPredict(tweet, logprior, loglikelihood) {
            const words = processTweet(tweet);
            let p = logprior;

            for (const word of words) {
                if (word in loglikelihood) {
		    // loglikelihood[word] є об'єктом, що містить логарифм імовірності
		    // для позитивного ('pos') та негативного ('neg') класів.
		    // Припускаємо, що модель повертає різницю логарифмів імовірностей: log(P(pos|word)) - log(P(neg|word))
		    // Якщо ваша модель зберігає іншим чином (наприклад, окремо для кожного класу),
		    // цей код може потребувати коригування.
		    // Зазвичай модель зберігає log(P(word|pos)) та log(P(word|neg)).
		    
		    // Якщо loglikelihood[word] — це ОДНЕ число (різниця логарифмів правдоподібності: log(P(w|pos)/P(w|neg))),
		    // то поточний код працює коректно.
                    p += loglikelihood[word];
                }
            }

            return p;
        }

        function classifyTweet() {
        /*
            const tweet = document.getElementById('tweetInput').value;
            const prediction = naiveBayesPredict(tweet, logprior, loglikelihood);
            const sentiment = prediction > 0 ? 'позитивна' : 'негативна';
            document.getElementById('result').textContent = `Визначена тональність: ${sentiment}`;
        */
            const tweet = document.getElementById('tweetInput').value;
	    const resultElement = document.getElementById('result');

	    // Перевірка, чи завантажено модель
	    if (logprior === null || loglikelihood === null) {
		resultElement.textContent = '❌ Будь ласка, спочатку завантажте файл моделі (naive_bayes_model.json).';
		return;
	    }

	    if (!tweet.trim()) {
		resultElement.textContent = 'Введіть текст для класифікації.';
		return;
	    }

	    const prediction = naiveBayesPredict(tweet, logprior, loglikelihood);
	    // Прогнозування: якщо P > 0, то логарифм імовірності позитивного класу вищий
	    // (log(P(pos|tweet)) - log(P(neg|tweet)) > 0), отже, тональність позитивна.
	    const sentiment = prediction > 0 ? 'позитивна' : 'негативна';
	    
	    // Додаємо показник прогнозування для кращого розуміння
	    const probabilityIndicator = prediction > 0 ? ` (+${prediction.toFixed(4)})` : ` (${prediction.toFixed(4)})`;

	    resultElement.textContent = `✅ Визначена тональність: ${sentiment}${probabilityIndicator}`;

        }

