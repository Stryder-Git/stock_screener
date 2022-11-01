from analyzer import Analyzer
from fastapi import FastAPI
import json

app = FastAPI()

print("setting up data")
Analyzer.set_data()

@app.get("/")
async def root():#c: str):
    print("creating analyzer")

    configs = {} # json.loads(c)
    print(configs)
    analyzer = Analyzer(configs)

    return {"symbols": analyzer()}

