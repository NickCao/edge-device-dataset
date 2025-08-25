from bs4 import BeautifulSoup
import requests
import pandas as pd
from collections import OrderedDict


def main():
    r = requests.get(
        "https://www.nvidia.com/en-us/autonomous-machines/embedded-systems/jetson-orin/"
    )
    r.raise_for_status()
    s = BeautifulSoup(r.text, features="html.parser")
    table = s.find(id="jetson-prod-module-table")
    data = OrderedDict()
    for ir, row in enumerate(table.find_all("tr")):
        content = []
        if ir == 0:
            continue
        if ir == 1:
            label = "Name"
        for ic, col in enumerate(row.find_all("td")):
            if ic == 0 and ir != 1:
                label = col.get_text()
            else:
                content.extend(int(col.get("colspan", 1)) * [col.get_text()])
        data[label] = content
    df = pd.DataFrame(data)
    df.to_excel("orin.xlsx")


if __name__ == "__main__":
    main()
