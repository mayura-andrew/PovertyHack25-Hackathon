# PathwayLK API Documentation

## Education Pathway API Endpoints

This API provides access to the education knowledge graph for Sri Lankan institutes, programs, qualifications, and careers.

### Base URL
```
http://localhost:8080/api/v1
```

---

## Endpoints

### 1. Get All Institutes
Retrieve all educational institutes in the system.

**Endpoint:** `GET /api/v1/pathway/institutes`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "name": "The Open University of Sri Lanka"
    },
    {
      "name": "Vocational Training Authority (VTA)"
    }
  ],
  "count": 2,
  "request_id": "abc-123",
  "timestamp": "2025-10-18T10:30:00Z"
}
```

---

### 2. Get Programs by Institute
Retrieve all programs offered by a specific institute.

**Endpoint:** `GET /api/v1/pathway/institutes/:name/programs`

**Parameters:**
- `name` (path) - Institute name (URL encoded)

**Example:**
```
GET /api/v1/pathway/institutes/The%20Open%20University%20of%20Sri%20Lanka/programs
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "name": "Bachelor of Software Engineering Honours",
      "institute": "The Open University of Sri Lanka",
      "faculty": "Faculty of Engineering Technology",
      "department": "Electrical and Computer Engineering",
      "requirements": [
        {
          "name": "G.C.E. (A/L) Examination Pass"
        },
        {
          "name": "Completion of Advanced Certificate in Science"
        }
      ],
      "prerequisites": [
        {
          "name": "Advanced Certificate in Science"
        }
      ],
      "career_paths": [
        {
          "title": "Software Engineer"
        },
        {
          "title": "Quality Assurance Engineer"
        },
        {
          "title": "DevOps Engineer"
        }
      ]
    }
  ],
  "count": 1,
  "institute": "The Open University of Sri Lanka",
  "request_id": "abc-124",
  "timestamp": "2025-10-18T10:31:00Z"
}
```

---

### 3. Get Program Details
Retrieve detailed information about a specific program.

**Endpoint:** `GET /api/v1/pathway/programs/:name`

**Parameters:**
- `name` (path) - Program name (URL encoded)

**Example:**
```
GET /api/v1/pathway/programs/Bachelor%20of%20Software%20Engineering%20Honours
```

**Response:**
```json
{
  "success": true,
  "data": {
    "name": "Bachelor of Software Engineering Honours",
    "institute": "The Open University of Sri Lanka",
    "faculty": "Faculty of Engineering Technology",
    "department": "Electrical and Computer Engineering",
    "requirements": [
      {
        "name": "G.C.E. (A/L) Examination Pass"
      },
      {
        "name": "Completion of Advanced Certificate in Science"
      }
    ],
    "prerequisites": [
      {
        "name": "Advanced Certificate in Science"
      }
    ],
    "career_paths": [
      {
        "title": "Software Engineer"
      },
      {
        "title": "Quality Assurance Engineer"
      },
      {
        "title": "DevOps Engineer"
      }
    ]
  },
  "request_id": "abc-125",
  "timestamp": "2025-10-18T10:32:00Z"
}
```

---

### 4. Get All Careers
Retrieve all available career paths.

**Endpoint:** `GET /api/v1/pathway/careers`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "title": "Civil Engineer"
    },
    {
      "title": "DevOps Engineer"
    },
    {
      "title": "Hardware Engineer"
    },
    {
      "title": "Network Administrator"
    },
    {
      "title": "Quality Assurance Engineer"
    },
    {
      "title": "Software Engineer"
    },
    {
      "title": "Structural Engineer"
    }
  ],
  "count": 7,
  "request_id": "abc-126",
  "timestamp": "2025-10-18T10:33:00Z"
}
```

---

### 5. Get Pathways to Career
Find educational pathways to reach a specific career.

**Endpoint:** `GET /api/v1/pathway/careers/:title/pathways`

**Parameters:**
- `title` (path) - Career title (URL encoded)

**Example:**
```
GET /api/v1/pathway/careers/Software%20Engineer/pathways
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "programs": [
        {
          "name": "Bachelor of Software Engineering Honours"
        },
        {
          "name": "Advanced Certificate in Science"
        }
      ],
      "qualifications": [
        {
          "name": "G.C.E. (A/L) Examination Pass"
        },
        {
          "name": "Completion of Advanced Certificate in Science"
        }
      ],
      "careers": [
        {
          "title": "Software Engineer"
        }
      ],
      "institute": "The Open University of Sri Lanka",
      "faculty": "Faculty of Engineering Technology",
      "department": "Electrical and Computer Engineering"
    }
  ],
  "count": 1,
  "career": "Software Engineer",
  "request_id": "abc-127",
  "timestamp": "2025-10-18T10:34:00Z"
}
```

---

### 6. Find Career Paths by Qualifications
Find possible career paths based on your qualifications.

**Endpoint:** `POST /api/v1/pathway/career-paths`

**Request Body:**
```json
{
  "qualifications": [
    "G.C.E. (O/L) Examination Pass",
    "Age Requirement"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "programs": [
        {
          "name": "Advanced Certificate in Science"
        }
      ],
      "qualifications": [
        {
          "name": "G.C.E. (O/L) Examination Pass"
        },
        {
          "name": "Age Requirement"
        },
        {
          "name": "Completion of NVQ Level 4 Program (O/L Equivalent)"
        }
      ],
      "careers": [],
      "institute": "The Open University of Sri Lanka",
      "faculty": "",
      "department": ""
    }
  ],
  "count": 1,
  "qualifications": [
    "G.C.E. (O/L) Examination Pass",
    "Age Requirement"
  ],
  "request_id": "abc-128",
  "timestamp": "2025-10-18T10:35:00Z"
}
```

---

## Health Check Endpoints

### Simple Health Check
**Endpoint:** `GET /health`

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-18T10:36:00Z",
  "uptime": "2h30m15s"
}
```

### Detailed Health Check
**Endpoint:** `GET /api/v1/health-detailed`

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-18T10:37:00Z",
  "uptime": "2h31m20s",
  "version": "1.0.0",
  "services": {
    "mongodb": true,
    "neo4j": true,
    "weaviate": true,
    "llm": true
  }
}
```

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message description",
  "request_id": "abc-129",
  "timestamp": "2025-10-18T10:38:00Z"
}
```

### HTTP Status Codes
- `200` - Success
- `400` - Bad Request (invalid input)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error
- `503` - Service Unavailable (health check failed)

---

## Example Usage with curl

```bash
# Get all institutes
curl http://localhost:8080/api/v1/pathway/institutes

# Get programs for OUSL
curl "http://localhost:8080/api/v1/pathway/institutes/The%20Open%20University%20of%20Sri%20Lanka/programs"

# Get program details
curl "http://localhost:8080/api/v1/pathway/programs/Bachelor%20of%20Software%20Engineering%20Honours"

# Get all careers
curl http://localhost:8080/api/v1/pathway/careers

# Get pathways to Software Engineer career
curl "http://localhost:8080/api/v1/pathway/careers/Software%20Engineer/pathways"

# Find career paths by qualifications
curl -X POST http://localhost:8080/api/v1/pathway/career-paths \
  -H "Content-Type: application/json" \
  -d '{
    "qualifications": [
      "G.C.E. (O/L) Examination Pass",
      "Age Requirement"
    ]
  }'
```

---

## Running the Server

### Using Docker Compose
```bash
docker-compose up
```

### Direct Execution
```bash
# Set environment variables
export NEO4J_URI=bolt://localhost:7687
export NEO4J_USERNAME=neo4j
export NEO4J_PASSWORD=password123
export PORT=8080

# Run the server
go run cmd/server/main.go
```

---

## Notes

- All timestamps are in UTC
- Request IDs are automatically generated for tracking
- URL parameters should be properly URL-encoded
- The API uses JSON for all request and response bodies
