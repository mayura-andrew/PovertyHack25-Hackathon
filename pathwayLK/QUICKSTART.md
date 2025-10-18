# Quick Start Guide - PathwayLK API

Get the Education Pathway API running in 5 minutes!

## Prerequisites

- Docker & Docker Compose installed
- Go 1.21+ (optional, if running without Docker)

## Step 1: Start Neo4j

```bash
docker-compose up -d neo4j
```

Wait ~30 seconds for Neo4j to start, then verify:

```bash
curl http://localhost:7474
```

You should see the Neo4j browser page.

## Step 2: Populate the Database

Make the script executable and run it:

```bash
chmod +x scripts/populate_neo4j_http.sh
./scripts/populate_neo4j_http.sh
```

You should see "✅ Database populated successfully!"

## Step 3: Set Environment Variables

```bash
export NEO4J_URI=bolt://localhost:7687
export NEO4J_USERNAME=neo4j
export NEO4J_PASSWORD=password123
export PORT=8080
export ENVIRONMENT=development
export LOG_LEVEL=info
```

Or create a `.env` file (not tracked in git):

```bash
cat > .env << 'EOF'
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=password123
NEO4J_DATABASE=neo4j
PORT=8080
ENVIRONMENT=development
LOG_LEVEL=info
LOG_FORMAT=console
EOF
```

## Step 4: Run the API Server

```bash
go run cmd/server/main.go
```

You should see:
```
{"level":"info","timestamp":"...","service":"mathprereq-api","version":"2.0.0","msg":"Server started successfully","address":":8080"}
```

## Step 5: Test the API

Open a new terminal and run:

```bash
# Test health
curl http://localhost:8080/health

# Get all institutes
curl http://localhost:8080/api/v1/pathway/institutes | jq

# Get all careers
curl http://localhost:8080/api/v1/pathway/careers | jq

# Get programs from OUSL
curl "http://localhost:8080/api/v1/pathway/institutes/The%20Open%20University%20of%20Sri%20Lanka/programs" | jq
```

Or run the comprehensive test suite:

```bash
chmod +x scripts/test_api.sh
./scripts/test_api.sh
```

## Success! 🎉

Your API is now running and ready to serve education pathway data!

## Next Steps

1. **Read the full API documentation**: `API_DOCUMENTATION.md`
2. **Understand the architecture**: `PATHWAY_README.md`
3. **Review implementation details**: `IMPLEMENTATION_SUMMARY.md`

## Common Issues

### Issue: Neo4j Connection Failed

**Solution**: Check Neo4j is running and credentials are correct

```bash
docker-compose ps neo4j
docker-compose logs neo4j
```

### Issue: Empty Results

**Solution**: Re-run the population script

```bash
./scripts/populate_neo4j_http.sh
```

### Issue: Port Already in Use

**Solution**: Change the port or kill the process

```bash
# Change port
export PORT=8081

# Or find and kill the process using port 8080
lsof -ti:8080 | xargs kill -9
```

## Using Docker Compose (Alternative)

If you want to run everything with Docker:

```bash
# Start all services
docker-compose up -d

# Populate database
./scripts/populate_neo4j_http.sh

# View logs
docker-compose logs -f app

# Stop everything
docker-compose down
```

## API Examples for Frontend

### Get All Institutes
```javascript
const response = await fetch('http://localhost:8080/api/v1/pathway/institutes');
const { data } = await response.json();
console.log(data); // Array of institutes
```

### Find Career Paths
```javascript
const response = await fetch('http://localhost:8080/api/v1/pathway/career-paths', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    qualifications: [
      "G.C.E. (A/L) Examination Pass",
      "Completion of Advanced Certificate in Science"
    ]
  })
});
const { data } = await response.json();
console.log(data); // Array of education paths
```

### Get Program Details
```javascript
const programName = encodeURIComponent('Bachelor of Software Engineering Honours');
const response = await fetch(`http://localhost:8080/api/v1/pathway/programs/${programName}`);
const { data } = await response.json();
console.log(data); // Program details with requirements and career paths
```

## Development Tips

### Enable Debug Logging
```bash
export LOG_LEVEL=debug
export LOG_FORMAT=console
```

### Check Health Status
```bash
curl http://localhost:8080/api/v1/health-detailed | jq
```

### View Neo4j Graph
Open http://localhost:7474 in your browser and run:

```cypher
// View all nodes
MATCH (n) RETURN n LIMIT 25

// View program relationships
MATCH (p:Program)-[r]-(n) RETURN p, r, n LIMIT 50

// Count nodes by type
MATCH (n) RETURN labels(n)[0] as type, count(*) as count
```

## Need Help?

1. Check the logs for error messages
2. Verify Neo4j connectivity: `docker-compose logs neo4j`
3. Test database directly: http://localhost:7474
4. Review `API_DOCUMENTATION.md` for endpoint details
5. Check `IMPLEMENTATION_SUMMARY.md` for architecture info

---

**You're all set!** Start building your frontend and querying the education pathways! 🚀
