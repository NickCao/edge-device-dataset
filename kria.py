import pandas as pd

som = pd.read_csv("amd/kria/som.csv")
som.drop("Area", axis=1, inplace=True)
som = som.set_index("Parameter")
som = som.T.reset_index()
print(som)
som.to_csv("kria.csv")
som.to_excel("kria.xlsx")
