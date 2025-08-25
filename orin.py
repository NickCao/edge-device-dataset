from bs4 import BeautifulSoup
from more_itertools import consume
import requests
import pandas as pd
from collections import OrderedDict


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
    data["Name"] = [col.get_text() for col in next(rows).find_all("td")][name_offset:]
    for row in rows:
        content = []
        for ic, col in enumerate(row.find_all("td")):
            if ic == 0:
                label = col.get_text().rstrip("*")
                match label:
                    case "Camera" | "CSI Camera":
                        label = "Camera"
                #     case "Vision Accelerator" | "DL Accelerator":
                #         label = "Accelerator"
            else:
                if nano:
                    content.append(col.get_text())
                else:
                    content.extend(int(col.get("colspan", 1)) * [col.get_text()])
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
    jetson = pd.concat([orin, thor, xavier, tx2, nano])
    jetson.to_csv("jetson.csv", sep="\t")
    jetson.to_excel("jetson.xlsx")


if __name__ == "__main__":
    main()
