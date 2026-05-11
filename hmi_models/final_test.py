"""
0. Документація - https://huggingface.co/docs/transformers/trainer

1. Оригінальна модель - у /home/cc/Desktop/i22/directory_on_my_computer/ 

2. model = GPT2LMHeadModel.from_pretrained("/home/cc/Desktop/i22/directory_on_my_computer/")

tokenizer = GPT2Tokenizer.from_pretrained('/home/cc/Desktop/i22/directory_on_my_computer/')

Тензори у форматі pt.

3. Задача - генерація тексту з різною температурою та різної довжини після донавчання.

4. Дані - текстові файли у каталозі /home/cc/Desktop/i22/hmi_models/corpus/ 

5. Використання Trainer API.

6. Навчити модель.

7. Зберегти навчену модель у /home/cc/Desktop/i22/hmi_models/trained/

8. Побудувати прости інтерфейс для перевірки: запит - відповідь.

"""

