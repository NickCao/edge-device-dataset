from bs4 import BeautifulSoup
from more_itertools import consume
import requests
import pandas as pd
import re
from collections import OrderedDict

prices = pd.DataFrame.from_records(
    [
        {"Name": "Jetson AGX Orin Developer Kit", "Price": 1999},
        {"Name": "Jetson AGX Orin 64GB", "Price": 1799},
        {"Name": "Jetson AGX Orin Industrial", "Price": 2349},
        {"Name": "Jetson AGX Orin 32GB", "Price": None},
        {"Name": "Jetson Orin NX 16GB", "Price": 699},
        {"Name": "Jetson Orin NX 8GB", "Price": 479},
        {"Name": "Jetson Orin Nano Super Developer Kit", "Price": 249},
        {"Name": "Jetson Orin Nano 8GB", "Price": 249},
        {"Name": "Jetson Orin Nano 4GB", "Price": 229},
        {"Name": "Jetson AGX Thor Developer Kit", "Price": 3499},
        {"Name": "Jetson T5000", "Price": 3199},
        {"Name": "Jetson T4000", "Price": None},
        {"Name": "Jetson AGX Xavier Industrial", "Price": 1449},
        {"Name": "Jetson AGX Xavier (64GB)", "Price": 1399},
        {"Name": "Jetson AGX Xavier (32GB)", "Price": 999},
        {"Name": "Jetson Xavier NX (16GB)", "Price": 579},
        {"Name": "Jetson Xavier NX (8GB)", "Price": 479},
        {"Name": "Jetson TX2i", "Price": 849},
        {"Name": "Jetson TX2", "Price": 199},
        {"Name": "Jetson TX2 4GB", "Price": None},
        {"Name": "Jetson TX2 NX", "Price": None},
        {"Name": "Jetson Nano", "Price": 129},
    ]
)


def normalize_flops(flops):
    flops, unit = flops.split(maxsplit=1)
    match unit:
        case "TOPS" | "TOPs" | "TFLOPS":
            unit = "TFLOPS"
        case "GFLOPS":
            unit = "GFLOPS"
        case "TFLOPS (FP4—Sparse)":
            unit = "TFLOPS (FP4-Sparse)"
        case _:
            raise NotImplementedError
    return f"{flops} {unit}"


gpu_re = re.compile(
    r"^(?P<core>\d+)-core\s+"
    r"NVIDIA\s+"
    r"(?P<arch>.+?)(?:\s+architecture)?\s+"
    r"GPU"
    r"(?:\s+with\s+(?P<tensor>\d+)(?:\s+(?P<tensor_gen>[\w-]+))?\s+Tensor\s+Cores)?"
    r"(?P<extra>.*)$"
)


def normalize_gpu(gpu):
    match = gpu_re.match(gpu)
    core = int(match.group("core"))
    arch = match.group("arch").rstrip("™").removesuffix(" c")
    tensor_gen = match.group("tensor_gen")
    tensor = int(match.group("tensor") or 0)
    extra = match.group("extra") or ""
    gpu = f"{core}-core {arch}"
    if tensor > 0:
        if tensor_gen:
            gpu += f" with {tensor} {tensor_gen} tensor cores"
        else:
            gpu += f" with {tensor} tensor cores"
    if extra:
        gpu += f" and {extra.strip()}"
    return gpu


memory_re = re.compile(
    r"^(\d+)\s*GB\s+(\d+)-bit\s+(LPDDR\d[xX]?)\s*(\(.*?ECC.*?\))?\s*([\d.]+)\s*GB/s$"
)


def normalize_memory(memory):
    match = memory_re.match(memory)
    size = match.group(1)
    width = match.group(2)
    gen = match.group(3)
    ecc = match.group(4) is not None
    speed = float(match.group(5))
    memory = f"{size} GB {width}-bit {gen} @ {speed} GB/s"
    if ecc:
        memory += " ECC"
    return memory


def url_to_df(
    url,
    offset,
    name_offset,
    table_id="jetson-prod-module-table",
    nano=False,
):
    r = requests.get(url)
    r.raise_for_status()
    s = BeautifulSoup(r.text, features="html.parser")
    table = s.find(id=table_id)
    data = OrderedDict()
    rows = iter(table.find_all("tr"))
    consume(rows, offset)
    data["Name"] = [col.get_text().strip() for col in next(rows).find_all("td")][
        name_offset:
    ]
    for row in rows:
        content = []
        for ic, col in enumerate(row.find_all("td")):
            if ic == 0:
                label = col.get_text().strip().rstrip("*")
                match label:
                    case "Camera" | "CSI Camera":
                        label = "Camera"
                #     case "Vision Accelerator" | "DL Accelerator":
                #         label = "Accelerator"
            else:
                if nano:
                    content.append(col.get_text().strip())
                else:
                    content.extend(
                        int(col.get("colspan", 1)) * [col.get_text().strip()]
                    )
        data[label] = content
    return pd.DataFrame(data)


def main():
    orin = url_to_df(
        "https://www.nvidia.com/en-us/autonomous-machines/embedded-systems/jetson-orin/",
        offset=1,
        name_offset=0,
    )
    thor = url_to_df(
        "https://www.nvidia.com/en-us/autonomous-machines/embedded-systems/jetson-thor/",
        offset=0,
        name_offset=1,
    )
    xavier = url_to_df(
        "https://www.nvidia.com/en-us/autonomous-machines/embedded-systems/jetson-xavier-series/",
        offset=1,
        name_offset=0,
        table_id="jetson-xavier-table",
    )
    tx2 = url_to_df(
        "https://www.nvidia.com/en-us/autonomous-machines/embedded-systems/jetson-tx2/",
        offset=1,
        name_offset=0,
        table_id="jetson-tx2-table",
    )
    nano = url_to_df(
        "https://www.nvidia.com/en-us/autonomous-machines/embedded-systems/jetson-nano/product-development/",
        offset=0,
        name_offset=1,
        table_id="jetson-tx2-table",
        nano=True,
    )
    jetson = pd.concat([orin, thor, xavier, tx2, nano]).reset_index(drop=True)
    jetson = jetson.merge(prices, on="Name")
    jetson["AI Performance"] = jetson["AI Performance"].apply(normalize_flops)
    jetson["GPU"] = jetson["GPU"].apply(normalize_gpu)
    jetson["Memory"] = jetson["Memory"].apply(normalize_memory)
    jetson.to_csv("jetson.csv", sep="\t")
    jetson.to_excel("jetson.xlsx", sheet_name="Jetson", freeze_panes=(1, 2))


if __name__ == "__main__":
    main()
