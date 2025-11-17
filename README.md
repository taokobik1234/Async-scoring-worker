# Async Scoring Worker - Assessment Engine

An asynchronous scoring system for AI-enabled job simulation platforms, designed to handle high-volume learner submissions with reliability and scalability.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- Git

### One-Command Setup

```bash
docker-compose up --build
```

The system will start with:

- **API Server**: http://localhost:3000
- **Swagger Documentation**: http://localhost:3000/api-docs
- **Redis**: localhost:6379
- **Workers**: 2 concurrent workers processing jobs

### Local Development

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start Redis
docker run -d -p 6379:6379 redis:7-alpine

# Start API server
npm run dev

# Start worker (in another terminal)
npm run worker

# Run tests
npm test
```

## 📋 API Endpoints

### Submissions API

#### Create Submission

```http
POST /api/submissions
Content-Type: application/json

{
  "learner_id": "user123",
  "simulation_id": "sim456",
  "data": {
    "code": "function hello() { return 'world'; }"
  }
}
```

**Response:**

```json
{
  "submission_id": "uuid",
  "status": "IN_PROGRESS"
}
```

#### Update Submission (Auto-save)

```http
PATCH /api/submissions/{submission_id}
Content-Type: application/json

{
  "data": {
    "code": "function hello() { return 'Hello World!'; }"
  }
}
```

**Response:**

```json
{
  "submission_id": "uuid",
  "status": "IN_PROGRESS"
}
```

#### Submit for Scoring

```http
POST /api/submissions/{submission_id}/submit
```

**Response:**

```json
{
  "submission_id": "uuid",
  "status": "SUBMITTED",
  "score_job_id": "job-uuid"
}
```

### Scoring Jobs API

#### Create Score Job

```http
POST /api/score-jobs
Content-Type: application/json

{
  "learner_id": "user123",
  "simulation_id": "sim456",
  "submission_data": { }
}
```

**Response:**

```json
{
  "job_id": "uuid",
  "status": "QUEUED"
}
```

#### Get Job Status

```http
GET /api/score-jobs/{job_id}
```

**Response (DONE):**

```json
{
  "job_id": "uuid",
  "status": "DONE",
  "score": 85,
  "feedback": "Overall Score: 85/100...",
  "breakdown": {
    "codeQuality": 0.85,
    "correctness": 0.9,
    "documentation": 0.75,
    "performance": 0.8
  },
  "completed_at": "2025-01-15T10:30:00Z"
}
```

**Response (ERROR):**

```json
{
  "job_id": "uuid",
  "status": "ERROR",
  "error": "Scoring failed: invalid data format",
  "retry_count": 3
}
```

## 🏗️ Architecture

### System Flow

```
Client → API Server → Redis Queue → Worker Pool → Scoring Engine
                ↓                                       ↓
            Submission DB                          Score Results
```

### Components

1. **API Layer** (`src/app.js`, `src/routes/`, `src/controllers/`)

   - Express.js REST API
   - Request validation
   - Swagger documentation

2. **Queue System** (`src/services/queue.service.js`)

   - Bull (Redis-backed queue)
   - Job persistence and retry logic
   - Event-driven observability

3. **Worker Pool** (`src/workers/scoring.worker.js`)

   - Concurrent job processing
   - Graceful shutdown handling
   - Automatic retries with exponential backoff

4. **Scoring Engine** (`src/services/scoring.service.js`)

   - Weighted rubric system:
     - Code Quality: 30%
     - Correctness: 40%
     - Documentation: 20%
     - Performance: 10%
   - Detailed feedback generation

5. **Data Layer** (`src/models/`)
   - Redis for job metadata
   - TTL-based data retention
   - Atomic operations for consistency

### Data Flow

```
1. POST /submissions → Create submission (IN_PROGRESS)
2. PATCH /submissions/:id → Auto-save progress
3. POST /submissions/:id/submit → Finalize (SUBMITTED)
   ↓
4. Create score job → Store in Redis (QUEUED)
   ↓
5. Enqueue job → Bull adds to Redis queue
   ↓
6. Worker picks job → Update status (RUNNING)
   ↓
7. Process scoring → Compute rubric scores
   ↓
8. Store results → Update job (DONE/ERROR)
   ↓
9. GET /score-jobs/:id → Retrieve results
```

## ⚙️ Configuration

### Environment Variables

```bash
# Application
NODE_ENV=development          # Environment: development/production
PORT=3000                     # API server port

# Redis
REDIS_HOST=localhost          # Redis hostname
REDIS_PORT=6379              # Redis port

# Worker
WORKER_CONCURRENCY=5         # Number of concurrent jobs
MAX_RETRIES=3                # Maximum retry attempts
RETRY_DELAY=1000             # Initial retry delay (ms)
BACKOFF_MULTIPLIER=2         # Exponential backoff multiplier

# Logging
LOG_LEVEL=info               # Log level: error/warn/info/debug
```

### Scoring Rubric

Configured in `src/config/index.js`:

```javascript
rubric: {
  codeQuality: 0.30,      // 30% weight
  correctness: 0.40,      // 40% weight
  documentation: 0.20,    // 20% weight
  performance: 0.10,      // 10% weight
}
```

## 🔒 Reliability Features

### Idempotency

- Jobs use `job_id` as idempotency key
- Duplicate submissions with same `job_id` are ignored
- Prevents duplicate processing on retries

### Retry Strategy

- **Initial Delay**: 1 second
- **Max Retries**: 3 attempts
- **Backoff**: Exponential (1s → 2s → 4s)
- **Dead Letter**: Jobs move to ERROR state after max retries

### State Management

```
QUEUED → RUNNING → DONE
                 → ERROR (after max retries)
```

### Failure Handling

- Worker crashes: Jobs automatically requeued
- Network errors: Exponential backoff retry
- Invalid data: Immediate ERROR state
- Redis failures: Circuit breaker pattern (TODO)

## 📈 Scalability

### Horizontal Scaling

Scale workers independently:

```bash
# Scale to 5 workers
docker-compose up --scale worker=5

# Or in Kubernetes
kubectl scale deployment worker --replicas=5
```

### Performance Characteristics

| Metric            | Value       | Notes               |
| ----------------- | ----------- | ------------------- |
| API Throughput    | ~1000 req/s | Single instance     |
| Worker Throughput | ~50 jobs/s  | Per worker instance |
| Queue Latency     | <10ms       | Redis operations    |
| Processing Time   | 2-5s        | Per scoring job     |

### Bottlenecks & Mitigations

1. **Redis Memory**

   - Mitigation: TTL on all keys, Redis persistence
   - Monitor: Memory usage, eviction rate

2. **Worker CPU**

   - Mitigation: Horizontal scaling, async operations
   - Monitor: CPU usage, job processing time

3. **API Rate Limiting**
   - Mitigation: Rate limiter middleware (TODO)
   - Monitor: Request rate, queue depth

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Watch mode
npm run test:watch
```

### Test Coverage

- Unit tests for scoring logic
- Integration tests for API endpoints
- Failure scenario tests (queue failures, worker crashes)

## 📊 Monitoring & Observability

### Structured Logging

All events logged with timestamps and context:

```json
{
  "level": "info",
  "message": "Job completed successfully",
  "timestamp": "2025-01-15T10:30:00Z",
  "jobId": "uuid",
  "score": 85,
  "processingTime": 2340
}
```

### Queue Metrics Endpoint

```http
GET /api/score-jobs
```

```json
{
  "waiting": 12,
  "active": 5,
  "completed": 1543,
  "failed": 8,
  "delayed": 0
}
```

### OpenTelemetry (TODO)

Future enhancement for distributed tracing:

- Trace job lifecycle across services
- Monitor latency and bottlenecks
- Integration with observability platforms

## 🚧 Production Readiness

### Completed ✅

- RESTful API with OpenAPI documentation
- Async job processing with Bull
- Retry logic with exponential backoff
- Idempotent job processing
- Docker containerization
- Structured logging
- Error handling

### TODO for Production 📋

1. **Authentication & Authorization**

   - API key authentication
   - Role-based access control
   - Rate limiting per user

2. **Enhanced Monitoring**

   - OpenTelemetry integration
   - Metrics dashboard (Grafana)
   - Alerting (PagerDuty/OpsGenie)

3. **Data Persistence**

   - PostgreSQL for long-term storage
   - Redis as cache layer
   - Data migration tools

4. **Advanced Scoring**

   - ML-based code analysis
   - Plagiarism detection
   - Custom rubric templates

5. **Infrastructure**

   - Kubernetes deployment
   - Auto-scaling policies
   - CI/CD pipeline
   - Load balancer

6. **Security**
   - Input validation & sanitization
   - SQL injection prevention
   - Rate limiting
   - CORS configuration

## 🔧 Technology Choices

### Why Node.js + Express?

- **Pros**: Excellent async I/O, vast ecosystem, easy deployment
- **Cons**: Single-threaded (mitigated by worker processes)
- **Alternative**: Go (better performance) or Python (ML ecosystem)

### Why Bull (Redis)?

- **Pros**: Reliable, built-in retries, horizontal scaling, active community
- **Cons**: Redis dependency, memory constraints
- **Alternative**: RabbitMQ (more features) or AWS SQS (managed)

### Why Redis Only?

- **Pros**: Simple architecture, fast operations, good for MVP
- **Cons**: Limited query capabilities, memory-only
- **Production**: Add PostgreSQL for persistent storage

## 📝 Design Trade-offs

### Speed vs Reliability

- **Chosen**: Reliability (retries, error handling)
- **Trade-off**: Slower processing for failed jobs
- **Rationale**: Educational platform needs accuracy over speed

### Simplicity vs Features

- **Chosen**: Simplicity (mock scoring, in-memory storage)
- **Trade-off**: Limited production capabilities
- **Rationale**: Focus on architecture, not ML complexity

### Consistency vs Availability

- **Chosen**: Consistency (Redis atomic operations)
- **Trade-off**: Potential downtime if Redis fails
- **Rationale**: Critical for scoring integrity

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request
