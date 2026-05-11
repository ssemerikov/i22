"""Train script using Hugging Face Trainer API.
Small-run defaults suitable for CPU debugging. Use --small_run to further reduce sizes.
"""

import argparse
import os
from transformers import GPT2LMHeadModel, GPT2TokenizerFast, TrainingArguments, Trainer
from datasets import load_from_disk
import torch


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--dataset_dir', default='hmi_models/data', help='Tokenized dataset dir (from prepare_corpus)')
    p.add_argument('--output_dir', default='hmi_models/trained', help='Where to save trained model')
    p.add_argument('--tokenizer_dir', default='/home/cc/Desktop/i22/directory_on_my_computer/', help='Initial tokenizer/model dir')
    p.add_argument('--epochs', type=int, default=1)
    p.add_argument('--per_device_train_batch_size', type=int, default=2)
    p.add_argument('--learning_rate', type=float, default=5e-5)
    p.add_argument('--small_run', action='store_true', help='Use tiny dataset/steps for CPU debugging')
    args = p.parse_args()

    # load dataset
    dataset = load_from_disk(args.dataset_dir)
    # dataset assumed already tokenized and contains input_ids/attention_mask

    # load model/tokenizer
    if args.small_run:
        # For CPU debugging: create a tiny model from config to avoid large downloads and reduce disk usage.
        print("Small run: creating tiny GPT2 config-based model for CPU debugging")
        # prefer using a local tokenizer if available to avoid downloads
        if os.path.isdir(args.tokenizer_dir):
            tokenizer = GPT2TokenizerFast.from_pretrained(args.tokenizer_dir)
            vocab_size = tokenizer.vocab_size if hasattr(tokenizer, 'vocab_size') else len(tokenizer.get_vocab())
        else:
            # fallback to a tiny dummy tokenizer (use a simple gpt2 tokenizer if available but may attempt download)
            try:
                tokenizer = GPT2TokenizerFast.from_pretrained('gpt2')
                vocab_size = tokenizer.vocab_size
            except Exception:
                raise SystemExit('No local tokenizer found and cannot download gpt2 tokenizer; provide --tokenizer_dir')
        from transformers import GPT2Config
        config = GPT2Config(n_embd=128, n_layer=2, n_head=4, vocab_size=vocab_size)
        model = GPT2LMHeadModel(config)
    else:
        if os.path.isdir(args.tokenizer_dir):
            tokenizer = GPT2TokenizerFast.from_pretrained(args.tokenizer_dir)
            model = GPT2LMHeadModel.from_pretrained(args.tokenizer_dir)
        else:
            tokenizer = GPT2TokenizerFast.from_pretrained('gpt2')
            model = GPT2LMHeadModel.from_pretrained('gpt2')

    if args.small_run:
        # take a tiny subset for CPU debug
        dataset = dataset.select(range(min(8, len(dataset))))

    save_strategy = 'no' if args.small_run else 'epoch'
    training_args = TrainingArguments(
        output_dir=args.output_dir,
        num_train_epochs=args.epochs,
        per_device_train_batch_size=args.per_device_train_batch_size,
        learning_rate=args.learning_rate,
        save_strategy=save_strategy,
        logging_steps=10,
        fp16=False,
        no_cuda=not torch.cuda.is_available(),
    )

    # Ensure labels exist for causal LM training (labels=input_ids)
    if isinstance(dataset, dict):
        # if DatasetDict, take 'train' split or map each split
        for k in dataset.keys():
            if 'labels' not in dataset[k].column_names:
                dataset[k] = dataset[k].map(lambda batch: {'labels': batch['input_ids']}, batched=True)
    else:
        if 'labels' not in dataset.column_names:
            dataset = dataset.map(lambda batch: {'labels': batch['input_ids']}, batched=True)

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=dataset,
    )

    trainer.train()
    trainer.save_model(args.output_dir)
    tokenizer.save_pretrained(args.output_dir)
    print('Training complete. Model saved to', args.output_dir)


if __name__ == '__main__':
    main()
