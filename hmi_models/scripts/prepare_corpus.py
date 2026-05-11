"""Prepare corpus for Trainer API
Reads text files from input_dir, tokenizes using GPT2 tokenizer (or provided tokenizer dir), and saves a tokenized dataset to output_dir using datasets.save_to_disk.
This updated version chunks long documents into overlapping blocks to produce many training examples.
Designed for quick CPU runs; default stride is half the block_size.
"""

import argparse
import os
from datasets import Dataset
from transformers import GPT2TokenizerFast


def read_text_files(input_dir):
    texts = []
    for root, _, files in os.walk(input_dir):
        for fname in files:
            path = os.path.join(root, fname)
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    texts.append(f.read())
            except Exception:
                # skip binary or unreadable files
                continue
    return texts


def chunk_token_ids(ids, block_size, stride):
    chunks = []
    if len(ids) < block_size:
        return chunks
    for start in range(0, len(ids) - block_size + 1, stride):
        chunk = ids[start:start + block_size]
        if len(chunk) == block_size:
            chunks.append(chunk)
    return chunks


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--input_dir', default='hmi_models/corpus', help='Directory with text files')
    p.add_argument('--output_dir', default='hmi_models/data', help='Where to save tokenized dataset')
    p.add_argument('--tokenizer_dir', default='/home/cc/Desktop/i22/directory_on_my_computer/', help='Tokenizer directory (optional)')
    p.add_argument('--block_size', type=int, default=128)
    p.add_argument('--stride', type=int, default=None, help='Stride for overlapping chunks; defaults to block_size//2')
    p.add_argument('--min_chunks_per_file', type=int, default=1, help='Require at least this many chunks per file to include')
    args = p.parse_args()

    texts = read_text_files(args.input_dir)
    if len(texts) == 0:
        raise SystemExit('No text files found in '+args.input_dir)

    tokenizer = GPT2TokenizerFast.from_pretrained(args.tokenizer_dir)
    if tokenizer.pad_token is None:
        # set pad token to eos to allow padding if needed in future
        tokenizer.pad_token = tokenizer.eos_token

    stride = args.stride or max(1, args.block_size // 2)

    all_chunks = []
    for doc in texts:
        ids = tokenizer.encode(doc)
        chunks = chunk_token_ids(ids, args.block_size, stride)
        # If no chunks (doc shorter than block_size) try to pad the last part
        if not chunks and len(ids) > 0:
            # pad with eos token id to block_size
            pad_len = args.block_size - len(ids)
            padded = ids + [tokenizer.eos_token_id] * pad_len
            chunks = [padded]
        if len(chunks) >= args.min_chunks_per_file:
            for c in chunks:
                all_chunks.append({"input_ids": c, "attention_mask": [1] * len(c)})

    if len(all_chunks) == 0:
        raise SystemExit('No chunks produced; try reducing block_size or adjusting stride')

    ds = Dataset.from_list(all_chunks)

    os.makedirs(args.output_dir, exist_ok=True)
    ds.save_to_disk(args.output_dir)
    print(f'Saved tokenized dataset with {len(all_chunks)} examples to', args.output_dir)


if __name__ == '__main__':
    main()
