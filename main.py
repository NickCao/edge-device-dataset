from bs4 import BeautifulSoup
import requests


def main():
    r = requests.get(
        "https://www.nvidia.com/en-us/autonomous-machines/embedded-systems/jetson-orin/"
    )
    r.raise_for_status()
    s = BeautifulSoup(r.text, features="html.parser")
    table = s.find(id="jetson-prod-module-table")
    for row in table.find_all("tr"):
        print("------------------------------------------")
        for col in row.find_all("td"):
            print(col.get("colspan", 1))
            print(col.get_text())


if __name__ == "__main__":
    main()
