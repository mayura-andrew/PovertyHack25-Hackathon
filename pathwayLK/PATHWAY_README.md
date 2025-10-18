# PathwayLK - Education Pathway API

A Go-based REST API for querying the Sri Lankan education knowledge graph, built with Neo4j, providing information about institutes, programs, qualifications, and career paths.

## Features

- 🏫 **Institute Management** - Query all educational institutes
- 📚 **Program Discovery** - Find programs by institute or search by name
- 🎓 **Qualification Mapping** - Map qualifications to available programs
- 💼 **Career Pathways** - Discover career paths and required programs
- 🔍 **Smart Search** - Find educational pathways based on your qualifications
- 🏥 **Health Checks** - Monitor service health and connectivity

## Tech Stack

- **Language**: Go 1.21+
- **Framework**: Gin (HTTP router)
- **Database**: Neo4j v5+ (Knowledge Graph)
- **Driver**: neo4j-go-driver/v6
- **Logging**: Uber Zap
- **Config**: Environment variables

## Prerequisites

- Go 1.21 or higher
- Neo4j 5.x
- Docker & Docker Compose (optional)

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd pathwayLK
```

### 2. Set Environment Variables

Create a `.env` file or export these variables:

```bash
export NEO4J_URI=bolt://localhost:7687
export NEO4J_USERNAME=neo4j
export NEO4J_PASSWORD=password123
export NEO4J_DATABASE=neo4j
export PORT=8080
export ENVIRONMENT=development
export LOG_LEVEL=info
```

### 3. Start Neo4j with Docker Compose

```bash
docker-compose up -d neo4j
```

Wait for Neo4j to be ready, then verify:
```bash
curl http://localhost:7474
```

### 4. Populate Neo4j Database

Make the script executable and run it:

```bash
chmod +x scripts/populate_neo4j.sh
./scripts/populate_neo4j.sh
```

Or use the HTTP version if you don't have cypher-shell:

```bash
chmod +x scripts/populate_neo4j_http.sh
./scripts/populate_neo4j_http.sh
```

### 5. Run the Server

```bash
go run cmd/server/main.go
```

The server will start on `http://localhost:8080`

## API Endpoints

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete endpoint documentation.

### Quick Examples

```bash
# Get all institutes
curl http://localhost:8080/api/v1/pathway/institutes

# Get programs for OUSL
curl "http://localhost:8080/api/v1/pathway/institutes/The%20Open%20University%20of%20Sri%20Lanka/programs"

# Get all careers
curl http://localhost:8080/api/v1/pathway/careers

# Find career paths by qualifications
curl -X POST http://localhost:8080/api/v1/pathway/career-paths \
  -H "Content-Type: application/json" \
  -d '{
    "qualifications": [
      "G.C.E. (O/L) Examination Pass",
      "Age Requirement"
    ]
  }'

# Get pathways to become a Software Engineer
curl "http://localhost:8080/api/v1/pathway/careers/Software%20Engineer/pathways"
```

## Project Structure

```
pathwayLK/
├── cmd/
│   └── server/
│       └── main.go              # Application entry point
├── internal/
│   ├── api/
│   │   ├── handlers/
│   │   │   ├── handlers.go      # Base handlers
│   │   │   └── pathway_handler.go  # Pathway-specific handlers
│   │   ├── middleware/
│   │   │   └── middleware.go    # Request middleware
│   │   └── routes/
│   │       └── routes.go        # Route definitions
│   ├── containers/
│   │   └── containers.go        # Dependency injection
│   ├── core/
│   │   ├── config/
│   │   │   └── config.go        # Configuration management
│   │   └── llm/
│   │       └── client.go        # LLM client (future use)
│   ├── data/
│   │   ├── neo4j/
│   │   │   └── client.go        # Neo4j database client
│   │   ├── mongodb/
│   │   │   └── client.go        # MongoDB client (future use)
│   │   └── weaviate/
│   │       └── client.go        # Weaviate client (future use)
│   └── services/
│       └── pathway/
│           └── service.go       # Business logic layer
├── pkg/
│   └── logger/
│       └── logger.go            # Logging utilities
├── scripts/
│   ├── populate_neo4j.sh        # Database setup script
│   └── populate_neo4j_http.sh   # HTTP-based setup script
├── docker-compose.yml           # Docker services
├── Dockerfile                   # Container image
├── go.mod                       # Go dependencies
├── go.sum                       # Dependency checksums
├── API_DOCUMENTATION.md         # Full API docs
└── README.md                    # This file
```

## Development

### Build

```bash
go build -o pathwaylk cmd/server/main.go
```

### Run Tests

```bash
go test ./...
```

### Run with Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEO4J_URI` | Neo4j connection URI | `bolt://localhost:7687` |
| `NEO4J_USERNAME` | Neo4j username | `neo4j` |
| `NEO4J_PASSWORD` | Neo4j password | `password123` |
| `NEO4J_DATABASE` | Neo4j database name | `neo4j` |
| `PORT` | Server port | `8080` |
| `ENVIRONMENT` | Environment (development/production) | `development` |
| `LOG_LEVEL` | Logging level (debug/info/warn/error) | `info` |
| `LOG_FORMAT` | Log format (json/console) | `json` |

## Neo4j Graph Schema

The knowledge graph consists of the following node types:

- **Institute** - Educational institutions (e.g., OUSL, VTA)
- **Faculty** - Academic faculties within institutes
- **Department** - Departments within faculties
- **Program** - Educational programs and courses
- **Qualification** - Entry requirements and prerequisites
- **Career** - Career paths and job titles

### Relationships

- `(Institute)-[:HAS_FACULTY]->(Faculty)`
- `(Faculty)-[:HAS_DEPARTMENT]->(Department)`
- `(Department)-[:OFFERS]->(Program)`
- `(Institute)-[:OFFERS]->(Program)`
- `(Program)-[:REQUIRES]->(Qualification)`
- `(Program)-[:IS_PREREQUISITE_FOR]->(Program)`
- `(Program)-[:LEADS_TO]->(Career)`

## API Response Format

All endpoints return JSON with the following structure:

### Success Response
```json
{
  "success": true,
  "data": [...],
  "count": 10,
  "request_id": "abc-123",
  "timestamp": "2025-10-18T10:30:00Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "request_id": "abc-124",
  "timestamp": "2025-10-18T10:31:00Z"
}
```

## Logging

The application uses structured logging with Zap. Logs include:

- Request ID for tracing
- Timestamp
- HTTP method and path
- Response status
- Latency
- Error details (if any)

Example log entry:
```json
{
  "level": "info",
  "timestamp": "2025-10-18T10:30:00Z",
  "service": "mathprereq-api",
  "version": "2.0.0",
  "request_id": "abc-123",
  "method": "GET",
  "path": "/api/v1/pathway/institutes",
  "status": 200,
  "latency": "12ms"
}
```

## Health Monitoring

### Simple Health Check
```bash
curl http://localhost:8080/health
```

### Detailed Health Check
```bash
curl http://localhost:8080/api/v1/health-detailed
```

This checks:
- Neo4j connectivity
- MongoDB connectivity (if enabled)
- Weaviate connectivity (if enabled)
- LLM service health (if enabled)

## Troubleshooting

### Neo4j Connection Issues

1. **Check Neo4j is running:**
   ```bash
   docker-compose ps neo4j
   ```

2. **Verify credentials:**
   ```bash
   docker-compose logs neo4j
   ```

3. **Test connection manually:**
   ```bash
   curl http://localhost:7474
   ```

### API Returns Empty Results

1. **Verify database is populated:**
   ```bash
   # Open Neo4j Browser at http://localhost:7474
   # Run: MATCH (n) RETURN count(n)
   ```

2. **Re-run population script:**
   ```bash
   ./scripts/populate_neo4j.sh
   ```

### Build Errors

1. **Update dependencies:**
   ```bash
   go mod tidy
   go mod download
   ```

2. **Clear build cache:**
   ```bash
   go clean -cache
   go build ./cmd/server
   ```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

[Add your license here]

## Support

For issues and questions:
- Open an issue on GitHub
- Check existing documentation
- Review API_DOCUMENTATION.md

## Roadmap

- [ ] Add authentication and authorization
- [ ] Implement caching layer (Redis)
- [ ] Add more advanced search filters
- [ ] Integrate LLM for personalized recommendations
- [ ] Add GraphQL support
- [ ] Implement rate limiting
- [ ] Add OpenAPI/Swagger documentation
- [ ] Create frontend dashboard
