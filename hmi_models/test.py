# pip install transformers

"""
from transformers import pipeline

classif = pipeline("sentiment-analysis")

res = classif([
    "Michael Glantz, a top agent at Creative Artists Agency, calmly ate his appetizer during the commotion at the White House correspondents’ dinner. He had his reasons.",
    "Observations by Hubble Space Telescope (HST), the James Webb Space Telescope (JWST), combined with data from the Keck Observatory on Mauna Kea in Hawai'i, show that those two rings are two different colors. The observations that revealed the differences are reflectance spectra that measured the sunlight reflected from the ring's particles. “By decoding the light from these rings, we can trace both their particle size distribution and composition, which sheds light on their origins, offering new insight into how the Uranian system and planets like it formed and evolved,” said Imke de Pater, professor at the University of California, Berkeley, and lead author of a paper discussing the findings."
])

print(res)

"""

from transformers import GPT2LMHeadModel, GPT2Tokenizer

"""

model = BertModel.from_pretrained("google-bert/bert-base-cased")

tokenizer = BertTokenizer.from_pretrained('google-bert/bert-base-cased')

tokenizer.save_pretrained("directory_on_my_computer")

tokenizer.save_vocabulary("directory_on_my_computer")

model.save_pretrained("directory_on_my_computer")

/home/cc/Desktop/i22/directory_on_my_computer/ 

"""


model = GPT2LMHeadModel.from_pretrained("/home/cc/Desktop/i22/directory_on_my_computer/")

tokenizer = GPT2Tokenizer.from_pretrained('/home/cc/Desktop/i22/directory_on_my_computer/')

enc_in = tokenizer(
    "Я не знаю, яку обрати фразу",
    return_tensors='pt'
)

print(enc_in)
print(tokenizer.decode(enc_in['input_ids'][0]))

# Generate a human-readable text output from the model
generated_ids = model.generate(**enc_in, max_length=40)
readable_text = tokenizer.decode(generated_ids[0], skip_special_tokens=True)
print(readable_text)



