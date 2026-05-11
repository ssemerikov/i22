import torch
from torch.optim import AdamW
from transformers import AutoTokenizer, AutoModelForSequenceClassification

# Same as before
checkpoint = "/home/cc/Desktop/i22/directory_on_my_computer/"
tokenizer = AutoTokenizer.from_pretrained(checkpoint)
tokenizer.pad_token = tokenizer.eos_token  # Use existing EOS token as PAD
model = AutoModelForSequenceClassification.from_pretrained(checkpoint)

# Ensure model embeddings match tokenizer vocabulary size
model.resize_token_embeddings(len(tokenizer))
model.config.pad_token_id = tokenizer.pad_token_id  # Set pad token in model config

sequences = [
    "I've been waiting for a HuggingFace course my whole life.",
    "This course is amazing!",
]
batch = tokenizer(
    sequences,
    padding=True,
    truncation=True,
    return_tensors="pt",
)

# This is new
batch["labels"] = torch.tensor([1, 1])

optimizer = AdamW(model.parameters())
loss = model(**batch).loss
loss.backward()
optimizer.step()


sequences2 = [
    "I've been waiting for a HuggingFace course your whole life.",
    "This course is amazing, isn't it?",
    "Я не знаю, яку обрати фразу",
]
batch2 = tokenizer(
    sequences2,
    padding=True,
    truncation=True,
    return_tensors="pt",
)



# Get predictions from classification model
outputs = model(**batch2)
predictions = torch.argmax(outputs.logits, dim=-1)
print("Predictions:", predictions)
print("Loss:", loss.item())

