from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "¡Hola desde FastAPI!"}

@app.post("/analyze/")
def analyze_item():
    return {"message": "Ete es tu codigo mejorado mijin"}