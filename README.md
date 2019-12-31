
# Cats API

## Getting Started

### Create .env file in root directory

	PG_HOST=localhost
	PG_PORT=5432
	PG_USER=postgres
	PG_PASSWORD=password
	PG_DATABASE=cats
	PG_VERBOSE=1`

### Create Docker Container
	docker run --name psql -e POSTGRES_PASSWORD=password -d -p 5432:5432 postgres:latest

### Run
	npm install
	npm start
	
### Test
	npm run dbtest
	npm run apitest