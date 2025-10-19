# PovertyHack 2025 — 24-hour Hackathon

#### Date - 17th to 18th of October, 2025
#### Location - Faculty of Health Sciences, The Open University of Sri Lanka
#### Organized by Sri Lanka Association for the Advancement of Science (https://www.slaas.lk/)

This repository contains our hackathon solution for PovertyHack 2025. The project combines a React + Vite frontend (client/) with a Go backend (pathwayLK/) that provides learning roadmaps, YouTube scraping, LLM integration and cached learning resources stored in MongoDB / Neo4j.

## Structure
- client/ — React + TypeScript frontend (Vite)
- pathwayLK/ — Go backend, scrapers, LLM client, DB connectors, and API
- scripts/ — helpers for populating databases and testing APIs

## Quick start (Linux)
1. Frontend
   - cd client
   - pnpm install
   - pnpm dev

2. Backend
   - cd pathwayLK
   - (option A) make run
   - (option B) go run ./cmd/server

3. Optional: start supporting services (Mongo/Neo4j) with docker-compose in pathwayLK if needed:
   - cd pathwayLK
   - docker-compose up -d

## Notes
- Learning resources (YouTube) are scraped/cached by the backend and exposed via API; the frontend embeds videos so users can view resources even if the LLM is unavailable.
- See pathwayLK/README.md and pathwayLK/QUICKSTART.md for backend details and configuration.

