# 🚀 Kasparro Backend - Crypto Market Data ETL

A robust, dockerized ETL (Extract, Transform, Load) system that ingests real-time cryptocurrency data from multiple sources, normalizes it into a unified schema, and serves it via a REST API.

**Live Demo (AWS EC2):** [http://13.61.182.138:3000/data](http://13.61.182.138:3000/data)

---

## 📌 Project Overview

This project implements a scalable backend system designed to handle the ingestion of financial market data. It adheres to **Clean Architecture** principles and includes production-grade features such as rate limiting, schema drift detection, and automated job scheduling.

### **Features Implemented**

#### **P0: Foundation Layer**
- **Multi-Source Ingestion:** Fetches data from **CoinPaprika** (API), **CoinGecko** (API), and local **CSV** files.
- **Unified Schema:** Normalizes disparate data structures into a single Postgres database schema.
- **Dockerized Environment:** Fully containerized setup (App + Postgres) using Docker Compose.

#### **P1: Growth Layer**
- **Job Tracking:** Tracks every ETL run with status (SUCCESS/FAILED), record counts, and timestamps.
- **Idempotency:** Prevents duplicate records using atomic database transactions (`upsert`).
- **Observability:** Provides a `/stats` endpoint for monitoring system health and ETL history.

#### **P2: Differentiator Layer (Advanced)**
- **🛡️ Rate Limiting:** Protects the API from abuse (100 req/15min per IP).
- **🔄 Resilience:** Implements **Exponential Backoff** retry logic for flaky 3rd-party APIs.
- **⚠️ Schema Drift Detection:** Automatically detects and logs warnings if external API structures change (using `json-diff`), preventing silent pipeline failures.

---

## 🛠️ Tech Stack

- **Runtime:** Node.js (v18 Alpine)
- **Framework:** Express.js
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Infrastructure:** Docker & Docker Compose
- **Cloud:** AWS EC2 (Ubuntu 24.04 LTS)
- **Testing:** Jest & Supertest
- **Scheduling:** Node-Cron

---

## 🔌 API Documentation

### 1. Get Market Data
Returns a paginated list of normalized crypto market data.

- **Endpoint:** `GET /data`
- **Query Params:**
  - `limit`: Number of records (default: 10)
  - `page`: Page number (default: 1)
  - `symbol`: Filter by coin symbol (e.g., `BTC`)
- **Example:** `/data?symbol=BTC&limit=5`

### 2. System Statistics
Returns ETL job history and system health metrics.

- **Endpoint:** `GET /stats`
- **Response:**
  ```json
  {
    "summary": {
      "total_runs": 15,
      "success_rate": "100.0%",
      "last_successful_run": "2025-12-10T09:30:00.000Z"
    },
    "recent_runs": [...]
  }
  ```

### 3. Health Check
Verifies DB connectivity and server uptime.

- **Endpoint:** `GET/health`

---

## ⚙️ Local Setup & Installation

#### Prerequisites
- Docker & Docker Compose installed.

#### Steps

1. Clone the repository
````bash
git clone https://github.com/Navin0062/kasparro-backend.git
cd kasparro-backend
````

2. Configure Environment Create a `.env` file in the root directory:
````bash
DATABASE_URL="postgresql://user:password@db:5432/kasparro_db?schema=public"
PORT=3000
````

3. Start the System
````bash
docker compose up --build -d
````

4. Initialize Database
````bash
docker compose exec app npx prisma migrate dev --name init
````
5. Run Manual ETL (Optional) The system runs automatically every 5 minutes, but you can force a run:
````bash
docker compose exec app node src/modules/ingestion/pipeline.js
````
---

## 🧪 Testing
The project includes unit tests for ETL logic and integration tests for API endpoints.

````bash
# Run tests inside the container
docker compose exec app npm test
````

Test Coverage:
- ✅ ETL Logic: Verifies data normalization and error handling.
- ✅ API Integration: Verifies endpoints return 200 OK and correct JSON structure.
- ✅ Schema Drift: Mocks API changes to ensure warnings are triggered.

---

## 📂 Project Structure
````bash
src/
├── config/             # Configuration files
├── modules/
│   ├── ingestion/      # ETL Logic
│   │   ├── sources/    # Adapters (CoinGecko, CoinPaprika, CSV)
│   │   └── pipeline.js # Main ETL Engine
├── index.js            # Express App Entry Point
prisma/
│   └── schema.prisma   # Database Schema Definition
tests/                  # Jest Unit & Integration Tests
docker-compose.yml      # Container Orchestration
Dockerfile              # App Image Definition
````

---

## ☁️ Deployment
This project is deployed on AWS EC2.

- **Instance Type** : t2.micro / t3.micro (Free Tier)
- **OS** : Ubuntu Server 24.04 LTS
- **Security** : Port 3000 opened via AWS Security Groups.
- **Process** : Docker Compose manages the lifecycle of the App and Database on the cloud server.

---

**Author** : Navin Kumar 
**License** : MIT


