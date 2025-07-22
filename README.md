
Run API :


python3 -m venv venv
source venv/bin/activate  # Linux/Mac

pip install fastapi uvicorn

´uvicorn main:app --reload´


curl -X POST http://127.0.0.1:8000/analyze/ \
     -H "Content-Type: application/json" \
     -d '{"code": "print("hola mundo")"}'