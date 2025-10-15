docker-compose down --volumes
docker-compose build --no-cache
docker-compose up -d


How To run :

uvicorn api:app --reload