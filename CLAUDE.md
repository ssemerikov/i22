# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a student portfolio repository for the "Web Programming" course at KDPU (Криворізький державний педагогічний університет), group I-22, by Serhiy Semerikov. It contains coursework, lab assignments, and experiments spanning web development, Node.js servers, and NLP/ML model training. All UI strings and comments are in **Ukrainian** — maintain this convention when editing.

## Architecture

The repo is a collection of independent subprojects, not a monolithic app:

### Web Servers (Node.js)
- **app1/** — Books CRUD API built with raw Node.js `http` module. No framework. In-memory data loaded from `books.json` on startup (changes are lost on restart). Port 3000.
- **app2express/** — Same books API rebuilt with Express 5. Data persists to `books.json` on every write. Port 3000. The top of `server.js` contains a Ukrainian comment block with a modification plan (reader/librarian modes, auth, search/sort).
- **webserver0/** — Minimal Node HTTP server serving static files from `../public` (must be run from `webserver0/`). Endpoints: `/ls` (directory listing with traversal guard), `/download`, `/client` (query param display), `/user`. Binds to `127.0.0.1:3000`.

### NLP/ML Pipeline (hmi_models/)
- **hmi_models/scripts/prepare_corpus.py** — Reads text files from corpus dir, tokenizes with GPT2TokenizerFast, chunks into overlapping blocks, saves HF dataset to disk.
- **hmi_models/scripts/train.py** — Fine-tunes GPT2 using HuggingFace Trainer API. Supports `--small_run` flag for CPU debugging with a tiny model config.
- **hmi_models/infer.py** — CLI inference for the trained GPT2 model.
- **hmi_models/ex2.py**, **test.py**, **final_test.py** — Additional educational scripts (not part of the core training pipeline).
- **hmi_models/README.md** — Has its own quick-start instructions for the ML pipeline.
- Base model and tokenizer live in `directory_on_my_computer/` (full GPT2 weights: `model.safetensors`, `config.json`, tokenizer files). Referenced by absolute path in training scripts.

### Static Web Content
- Root-level `index.html` — Main portfolio page (Bootstrap 5) linking to all experiments and labs.
- `public/` — Static assets directory served by webserver0.
- `bs-exp/`, `aframe/`, `three/`, `lab*` — Individual experiment/lab folders with standalone HTML/JS/CSS.

## Common Commands

### Node.js servers
```bash
# app1 (raw Node.js)
cd app1 && node server.js

# app2 (Express)
cd app2express && npm start

# webserver0 (simple file server) — run from webserver0/
cd webserver0 && node hello-world.js
```

### ML pipeline
```bash
# Setup
python -m venv .venv && source .venv/bin/activate
pip install -r hmi_models/requirements.txt

# Prepare dataset
python hmi_models/scripts/prepare_corpus.py --input_dir hmi_models/corpus --output_dir hmi_models/data --tokenizer_dir /home/cc/Desktop/i22/directory_on_my_computer/ --block_size 128

# Train (quick CPU debug)
python hmi_models/scripts/train.py --dataset_dir hmi_models/data --output_dir hmi_models/trained --epochs 1 --small_run

# Inference
python hmi_models/infer.py --model_dir hmi_models/trained --prompt "Тест" --max_length 40
```

### Jupyter notebooks
Open `lab4.ipynb` or `lab6.ipynb` with Jupyter: `jupyter notebook lab4.ipynb`

## Key Conventions

- **No build system** at the repo root — `package.json` is an empty `{}`. Each app subfolder has its own `package.json` and `node_modules/`.
- **No test runner** configured anywhere. No linter config.
- **No CI/CD** — `.github/workflows/` is absent.
- **`books.json`** must be valid JSON or the server crashes on startup. In app1, data is in-memory only (lost on restart). In app2express, writes persist to disk.
- **`word_embeddings.pkl`** is a ~274MB binary — never read it into memory indiscriminately. It's referenced from notebooks.
- **Path resolution**: webserver0 resolves `baseDir` as `../public` relative to its own directory — run it from `webserver0/`.
- **ML hardcoded paths**: `directory_on_my_computer/` contains the base GPT2 model and tokenizer and is referenced by absolute path `/home/cc/Desktop/i22/directory_on_my_computer/` in training scripts.
- **`.claude/settings.local.json`** exists with local permission allowlists — do not overwrite without review.
