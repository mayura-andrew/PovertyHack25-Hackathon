.PHONY: build run docker-build up tidy

build:
	go build -o bin/app ./cmd/app

run:
	go run ./cmd/app

docker-build:
	docker build -t ${PROJECT_NAME}:local .

up:
	docker-compose up --build

tidy:
	go mod tidy
