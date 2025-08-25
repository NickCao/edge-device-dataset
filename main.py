from bs4 import BeautifulSoup
import requests


def main():
    r = requests.get(
        "https://www.nvidia.com/en-us/autonomous-machines/embedded-systems/jetson-orin/"
    )
    r.raise_for_status()
    s = BeautifulSoup(r.text)
    print(s)


if __name__ == "__main__":
    main()
