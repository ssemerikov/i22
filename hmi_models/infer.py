"""Simple CLI inference for the trained GPT2 model.
Loads model from --model_dir (default: hmi_models/trained) or falls back to directory_on_my_computer.
"""

import argparse
import os
from transformers import GPT2LMHeadModel, GPT2TokenizerFast
import torch


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--model_dir', default='hmi_models/trained')
    p.add_argument('--tokenizer_dir', default='/home/cc/Desktop/i22/directory_on_my_computer/')
    p.add_argument('--prompt', default='Привіт', help='Prompt text')
    p.add_argument('--max_length', type=int, default=50)
    p.add_argument('--temperature', type=float, default=1.0)
    args = p.parse_args()

    model_dir = args.model_dir if os.path.isdir(args.model_dir) else args.tokenizer_dir

    tokenizer = GPT2TokenizerFast.from_pretrained(model_dir)
    model = GPT2LMHeadModel.from_pretrained(model_dir)
    model.eval()

    inputs = tokenizer(args.prompt, return_tensors='pt')
    with torch.no_grad():
        outputs = model.generate(**inputs, max_length=args.max_length, do_sample=True, temperature=args.temperature)
    text = tokenizer.decode(outputs[0], skip_special_tokens=True)
    print(text)

if __name__ == '__main__':
    main()
