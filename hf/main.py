from huggingface_hub import hf_hub_download
from pathlib import Path
import json


models = [
    "ibm-granite/granite-4.0-tiny-preview",
    "ibm-granite/granite-3.3-2b-instruct",
    "ibm-granite/granite-3.3-8b-instruct",
    "ibm-granite/granite-3.2-2b-instruct",
    "ibm-granite/granite-3.2-8b-instruct",
    "meta-llama/Llama-2-7b-hf",
    "meta-llama/Llama-2-13b-hf",
    "meta-llama/Llama-2-70b-hf",
]

configs = {}
for model in models:
    with Path(hf_hub_download(repo_id=model, filename="config.json")).open() as f:
        configs[model] = json.load(f)
with Path("configs.json").open("w") as f:
    json.dump(configs, f)
