HMI models — training and inference helpers

Quick start (recommended: use a Python venv):

1. Create venv and install

python -m venv .venv
source .venv/bin/activate
pip install -r hmi_models/requirements.txt

2. Prepare tokenized dataset (uses tokenizer in /home/cc/Desktop/i22/directory_on_my_computer/ by default)

python hmi_models/scripts/prepare_corpus.py --input_dir hmi_models/corpus --output_dir hmi_models/data --tokenizer_dir /home/cc/Desktop/i22/directory_on_my_computer/ --block_size 128

3. Train (CPU-friendly small defaults). For quick debug add --small_run

python hmi_models/scripts/train.py --dataset_dir hmi_models/data --output_dir hmi_models/trained --epochs 1 --small_run

4. Inference (CLI)

python hmi_models/infer.py --model_dir hmi_models/trained --prompt "Тест" --max_length 40 --temperature 0.8

Notes:
- The code defaults to using the model/tokenizer found in /home/cc/Desktop/i22/directory_on_my_computer/ as the base.
- For real training use a GPU and increase batch size/epochs. These scripts are designed to be understandable and extendable.
