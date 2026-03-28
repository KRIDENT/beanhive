# ☕ Coffee Company — Backend Architecture Guide

> A comprehensive backend structure reference for the Coffee Company web application.
> Designed for senior engineers, architects, and backend developers.
> Grounded in Java Systems Design principles and modern distributed systems architecture.

---

## 📋 Table of Contents

1. [System Overview](#1-system-overview)
2. [Architecture Style](#2-architecture-style)
3. [Service Decomposition](#3-service-decomposition)
4. [API Design](#4-api-design)
5. [Data Architecture](#5-data-architecture)
6. [Caching Strategy](#6-caching-strategy)
7. [Authentication & Authorization](#7-authentication--authorization)
8. [Message Queue & Event Streaming](#8-message-queue--event-streaming)
9. [Scalability & Load Management](#9-scalability--load-management)
10. [Observability & Monitoring](#10-observability--monitoring)
11. [Security](#11-security)
12. [Deployment & Infrastructure](#12-deployment--infrastructure)
13. [File & Folder Structure](#13-file--folder-structure)
14. [Code Style & Conventions](#14-code-style--conventions)
15. [Backend Quick-Start Checklist](#15-backend-quick-start-checklist)

---

## 1. System Overview

The Coffee Company web application supports a global user base across 35,000+ locations. The backend must reliably serve:

| Capability              | Description                                                  |
|-------------------------|--------------------------------------------------------------|
| **Menu Service**        | Real-time product catalog with seasonal updates              |
| **Order Service**       | Multi-step order processing (in-store, mobile, pickup)       |
| **Rewards Service**     | Star tracking, tier management, redemption logic             |
| **Store Locator**       | Geospatial queries for nearest stores                        |
| **User Service**        | Account management, preferences, order history               |
| **Payment Service**     | Secure payment processing and stored cards                   |
| **Notification Service**| Push, email, and SMS alerts for order and rewards events     |
| **Seasonal Content API**| Dynamic campaign and promotional content delivery            |

### Scale Targets

| Metric                  | Target                             |
|-------------------------|------------------------------------|
| Active users (peak)     | 10M+ concurrent                    |
| Orders per second       | ~50,000 globally                   |
| Menu read QPS           | ~500,000 (read-heavy, cacheable)   |
| Rewards lookup latency  | < 100ms p99                        |
| API availability        | 99.99% uptime SLA                  |
| Data storage            | Multi-region, geo-redundant        |

---

## 2. Architecture Style

### Microservices with Domain-Driven Design (DDD)

Following the principles laid out in *Architecting Modern Systems* (Joshi), the system is structured around **bounded contexts** aligned to the business domain. Each service owns its data, is independently deployable, and communicates via well-defined contracts.

```
┌──────────────────────────────────────────────────────┐
│                   API GATEWAY LAYER                   │
│          (Rate limiting · Auth · Routing)             │
└───────────────────────────┬──────────────────────────┘
                            │
          ┌─────────────────┼────────────────────┐
          ▼                 ▼                    ▼
  ┌───────────────┐  ┌────────────┐   ┌──────────────────┐
  │  User Service │  │ Menu       │   │  Order Service   │
  │               │  │ Service    │   │                  │
  └───────────────┘  └────────────┘   └──────────────────┘
          │                 │                    │
          ▼                 ▼                    ▼
  ┌───────────────┐  ┌────────────┐   ┌──────────────────┐
  │ Rewards       │  │ Store      │   │  Payment Service │
  │ Service       │  │ Locator    │   │                  │
  └───────────────┘  └────────────┘   └──────────────────┘
          │                 │                    │
          └─────────────────┼────────────────────┘
                            ▼
              ┌─────────────────────────┐
              │   Event Bus (Kafka)     │
              │  Notification · Audit   │
              └─────────────────────────┘
```

### Design Principles

- **Single Responsibility** — each service owns exactly one bounded context
- **Loose Coupling, High Cohesion** — services communicate via events or versioned REST/gRPC contracts
- **Design for Failure** — circuit breakers, retries with exponential backoff, bulkheads
- **Stateless Services** — session state externalized to Redis; no sticky sessions
- **Idempotency** — all write operations are idempotent (safe to retry)
- **Eventual Consistency** — accepted for rewards and notifications; strong consistency required for payments and orders

---

## 3. Service Decomposition

### 3.1 User Service

**Responsibility:** Account lifecycle, preferences, profile data.

```
Endpoints:
  POST   /v1/users/register
  POST   /v1/users/login
  GET    /v1/users/{userId}
  PATCH  /v1/users/{userId}
  DELETE /v1/users/{userId}
  GET    /v1/users/{userId}/order-history

Owns:
  - users table (PostgreSQL)
  - sessions (Redis)
  - Preference data (MongoDB)

Publishes Events:
  - user.registered
  - user.profile.updated
  - user.deleted
```

### 3.2 Menu Service

**Responsibility:** Product catalog, pricing, nutritional data, seasonal updates.

```
Endpoints:
  GET    /v1/menu
  GET    /v1/menu/categories
  GET    /v1/menu/items/{itemId}
  GET    /v1/menu/seasonal
  POST   /v1/menu/items          (admin only)
  PATCH  /v1/menu/items/{itemId} (admin only)

Owns:
  - menu_items table (PostgreSQL)
  - Seasonal campaigns table
  - Nutritional data (PostgreSQL/JSONB)

Cache:
  - Full menu cached in Redis (TTL: 5 minutes)
  - CDN-cached at edge (TTL: 1 minute for seasonal, 10 minutes for standard)
```

### 3.3 Order Service

**Responsibility:** Order creation, state machine, fulfillment orchestration.

Order state machine:

```
PENDING → CONFIRMED → IN_PREPARATION → READY → COMPLETED
                   └→ CANCELLED
```

```
Endpoints:
  POST   /v1/orders
  GET    /v1/orders/{orderId}
  PATCH  /v1/orders/{orderId}/cancel
  GET    /v1/orders/user/{userId}

Owns:
  - orders table (PostgreSQL — strong consistency)
  - order_items table

Publishes Events:
  - order.created
  - order.confirmed
  - order.ready
  - order.completed
  - order.cancelled

Subscribes To:
  - payment.succeeded
  - payment.failed
  - inventory.reserved
```

### 3.4 Rewards Service

**Responsibility:** Stars accumulation, tier management, redemption.

```
Tier System:
  Green  (0–299 stars)   — base benefits
  Gold   (300+ stars)    — premium benefits

Endpoints:
  GET    /v1/rewards/{userId}
  POST   /v1/rewards/{userId}/redeem
  GET    /v1/rewards/{userId}/history

Owns:
  - rewards_accounts table (PostgreSQL)
  - rewards_transactions table

Cache:
  - Stars balance cached per-user in Redis (TTL: 30 seconds)

Publishes Events:
  - rewards.stars.earned
  - rewards.tier.upgraded
  - rewards.redeemed
```

### 3.5 Store Locator Service

**Responsibility:** Geospatial store search, hours, amenities.

```
Endpoints:
  GET    /v1/stores?lat={lat}&lng={lng}&radius={km}
  GET    /v1/stores/{storeId}
  GET    /v1/stores/{storeId}/hours

Owns:
  - stores table (PostgreSQL + PostGIS extension)
  - Geospatial index (GiST)

Cache:
  - Store list cached by geohash in Redis (TTL: 5 minutes)
```

### 3.6 Payment Service

**Responsibility:** Payment tokenization, charging, refunds.  
**Note:** This service never stores raw card numbers — integrates with a PCI-DSS certified vault (e.g., Stripe, Braintree).

```
Endpoints:
  POST   /v1/payments/charge
  POST   /v1/payments/refund
  GET    /v1/payments/{paymentId}

Publishes Events:
  - payment.succeeded
  - payment.failed
  - payment.refunded
```

### 3.7 Notification Service

**Responsibility:** Multi-channel notifications (push, email, SMS).  
Purely event-driven — subscribes to the event bus, never called directly by other services.

```
Subscribes To:
  - order.confirmed       → push + email
  - order.ready           → push
  - rewards.tier.upgraded → push + email
  - rewards.redeemed      → push

Channels:
  - Push   (FCM / APNs)
  - Email  (SendGrid)
  - SMS    (Twilio)
```

---

## 4. API Design

### 4.1 API Gateway

All external traffic routes through a single API Gateway layer that handles:

- **Authentication** — JWT validation before forwarding to services
- **Rate Limiting** — per-user and per-IP (see section 9)
- **Request Routing** — path-based routing to microservices
- **SSL Termination** — TLS at the gateway; internal traffic over mTLS
- **Request Logging** — all requests logged with correlation ID

**Recommended tool:** AWS API Gateway, Kong, or Nginx + custom middleware.

### 4.2 REST Conventions

All APIs follow RESTful conventions with consistent response shapes:

```json
// Success
{
  "data": { ... },
  "meta": {
    "requestId": "uuid-v4",
    "timestamp": "ISO-8601"
  }
}

// Error
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "The requested item does not exist.",
    "details": [ ... ]
  },
  "meta": {
    "requestId": "uuid-v4",
    "timestamp": "ISO-8601"
  }
}
```

### 4.3 Versioning

- All endpoints versioned under `/v1/`, `/v2/`, etc.
- Old versions sunset only after 6-month deprecation notice
- Version in URL path (not headers) for visibility and caching

### 4.4 Internal Service Communication

| Pattern        | Use Case                                              | Technology  |
|----------------|-------------------------------------------------------|-------------|
| Synchronous    | User-facing reads and writes requiring immediate ack  | REST / gRPC |
| Asynchronous   | Events, notifications, eventual-consistency workflows | Kafka       |
| Fan-out        | Menu price updates, seasonal content broadcasts       | Kafka topics with consumer groups |

### 4.5 gRPC (Internal)

High-throughput internal service-to-service calls (e.g., Order → Payment, Order → Rewards) use gRPC for lower latency and strong schema contracts via Protocol Buffers.

```proto
// Example: OrderService calls RewardsService
service RewardsService {
  rpc EarnStars(EarnStarsRequest) returns (EarnStarsResponse);
  rpc GetBalance(GetBalanceRequest) returns (BalanceResponse);
}
```

---

## 5. Data Architecture

### 5.1 Database-per-Service Pattern

Each microservice owns its own database. Cross-service queries are prohibited at the database level; data sharing happens via APIs or events.

| Service          | Primary Store          | Reason                                       |
|------------------|------------------------|----------------------------------------------|
| User Service     | PostgreSQL             | Relational, ACID, strong consistency         |
| Menu Service     | PostgreSQL + JSONB     | Structured + flexible nutritional data       |
| Order Service    | PostgreSQL             | ACID transactions, state machine integrity   |
| Rewards Service  | PostgreSQL             | Financial accuracy, no data loss tolerated   |
| Store Locator    | PostgreSQL + PostGIS   | Geospatial queries                           |
| Seasonal Content | MongoDB                | Flexible schema, rapid content updates       |
| Session Store    | Redis                  | TTL-based expiry, high-speed reads           |
| Search Index     | Elasticsearch          | Full-text product and store search           |

### 5.2 Schema Design Principles

From *Java Systems Design Interview* (del Nero):

- **Normalize first, denormalize intentionally** — premature denormalization causes data drift
- **Soft deletes** — never hard-delete user or order records; use `deleted_at` timestamps
- **Audit columns on every table** — `created_at`, `updated_at`, `created_by`
- **UUID primary keys** — avoids enumerable IDs in public-facing APIs
- **Immutable event log** — append-only tables for orders and rewards transactions

### 5.3 Example: Orders Table

```sql
CREATE TABLE orders (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES users(id),
  store_id       UUID NOT NULL,
  status         VARCHAR(32) NOT NULL DEFAULT 'PENDING',
  total_cents    INTEGER NOT NULL,
  currency       CHAR(3) NOT NULL DEFAULT 'USD',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at   TIMESTAMPTZ,
  deleted_at     TIMESTAMPTZ,

  CONSTRAINT orders_status_check
    CHECK (status IN ('PENDING','CONFIRMED','IN_PREPARATION','READY','COMPLETED','CANCELLED'))
);

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status  ON orders(status) WHERE deleted_at IS NULL;
```

### 5.4 Read Replicas

All services spin up at minimum one read replica:

- Write path → primary instance
- Read-heavy endpoints (menu fetch, store list, user profile) → read replica
- Replica lag monitored; stale reads acceptable for menu; NOT acceptable for rewards balance

### 5.5 Data Retention Policy

| Data Type           | Retention          |
|---------------------|--------------------|
| Order records       | 7 years (legal)    |
| User accounts       | Until deletion request + 30 days |
| Rewards history     | 5 years            |
| Logs / traces       | 90 days            |
| Seasonal campaigns  | 2 years            |

---

## 6. Caching Strategy

### 6.1 Cache Hierarchy

```
Client Request
     │
     ▼
[CDN Edge Cache]          ← Static assets, menu JSON (Cloudfront / Fastly)
     │
     ▼
[API Gateway Cache]       ← Short-lived GET response caching (1–5 min)
     │
     ▼
[Redis Application Cache] ← Session data, computed rewards, store lists
     │
     ▼
[Database]                ← Source of truth
```

### 6.2 Cache TTL Reference

| Data                    | Cache Layer | TTL          | Invalidation Trigger          |
|-------------------------|-------------|--------------|-------------------------------|
| Full menu               | Redis + CDN | 5 min / 1 min | Admin menu update event      |
| Seasonal content        | CDN         | 1 minute     | Campaign publish event        |
| Store list (by geohash) | Redis       | 5 minutes    | Store hours update event      |
| User session            | Redis       | 30 minutes   | Logout or token revocation    |
| Rewards balance         | Redis       | 30 seconds   | Stars earned / redeemed event |
| Product detail page     | CDN         | 10 minutes   | Product update event          |

### 6.3 Cache-Aside Pattern

All services implement cache-aside (lazy loading):

```
1. Check Redis for key
2. If HIT → return cached value
3. If MISS → query database
4. Write result to Redis with TTL
5. Return result to caller
```

### 6.4 Cache Stampede Prevention

For high-traffic keys (full menu, seasonal banner), use **probabilistic early expiration** combined with **distributed locking** via Redis `SET NX PX` to prevent thundering herd on cache miss.

---

## 7. Authentication & Authorization

### 7.1 Auth Flow

```
User Login
    │
    ▼
POST /v1/users/login
    │
    ▼
Validate credentials (bcrypt comparison)
    │
    ▼
Issue JWT (short-lived: 15 min) + Refresh Token (long-lived: 30 days)
    │
    ▼
Store refresh token in Redis (keyed by userId)
    │
    ▼
Return tokens to client
```

### 7.2 Token Strategy

| Token Type    | TTL      | Storage          | Purpose                           |
|---------------|----------|------------------|-----------------------------------|
| Access Token  | 15 min   | Memory (client)  | Authenticate API requests         |
| Refresh Token | 30 days  | HttpOnly cookie  | Obtain new access token silently  |
| Admin Token   | 1 hour   | Memory (client)  | Admin dashboard access            |

### 7.3 Authorization Roles

```
ROLE_CUSTOMER     — Standard user; can place orders, manage own account
ROLE_BARISTA      — Store staff; can update order status at their store
ROLE_STORE_ADMIN  — Store manager; can view store-level analytics
ROLE_ADMIN        — Internal staff; can manage menu, campaigns
ROLE_SUPER_ADMIN  — Engineering; full access
```

All role checks happen at the API Gateway and are re-verified at the service layer (defense in depth).

### 7.4 OAuth / SSO

Supports Google OAuth 2.0 and Apple Sign In for consumer logins. Internal admin tools use SAML 2.0 SSO via the corporate identity provider.

---

## 8. Message Queue & Event Streaming

### 8.1 Kafka Topic Design

Following event-driven architecture principles from *Architecting Modern Systems* (Joshi), every significant state change emits an event. Topics are named by domain and entity:

```
Topic Naming Convention: {domain}.{entity}.{event}

Topics:
  order.orders.created
  order.orders.status-changed
  payment.charges.succeeded
  payment.charges.failed
  rewards.stars.earned
  rewards.tier.upgraded
  user.accounts.registered
  menu.items.updated
  notification.push.requested
```

### 8.2 Partitioning Strategy

| Topic                     | Partition Key   | Rationale                               |
|---------------------------|-----------------|------------------------------------------|
| order.orders.*            | `orderId`       | All order events for one order go to same partition (ordering) |
| rewards.stars.*           | `userId`        | Per-user ordering of rewards events      |
| menu.items.updated        | `itemId`        | Item-level updates colocated             |
| notification.push.*       | `userId`        | Avoid out-of-order push notifications    |

### 8.3 Consumer Groups

Each service consuming from Kafka registers its own consumer group, ensuring:

- Independent scaling of consumers
- No message loss on service restart (offset commit after processing)
- At-least-once delivery with idempotent handlers

### 8.4 Dead Letter Queue (DLQ)

Failed messages after 3 retries (with exponential backoff) are moved to a DLQ topic (`*.dlq`) for manual inspection and replay. Alerts fire when DLQ depth exceeds threshold.

---

## 9. Scalability & Load Management

### 9.1 Horizontal Scaling

All services are stateless and horizontally scalable behind a load balancer. Kubernetes manages pod autoscaling via HPA (Horizontal Pod Autoscaler) based on CPU and custom metrics (RPS, queue depth).

```yaml
# Example HPA for Order Service
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: order-service-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: order-service
  minReplicas: 3
  maxReplicas: 50
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 60
```

### 9.2 Rate Limiting

Applied at the API Gateway, per authenticated user and per IP:

| Endpoint Category    | Rate Limit           | Burst Allowance |
|----------------------|----------------------|-----------------|
| Menu reads (GET)     | 1000 req/min per IP  | 200 extra       |
| Order placement      | 10 req/min per user  | 3 extra         |
| Auth (login/register)| 20 req/min per IP    | 5 extra         |
| Rewards lookup       | 60 req/min per user  | 10 extra        |
| Admin endpoints      | 500 req/min per role | 50 extra        |

429 responses include `Retry-After` headers.

### 9.3 Circuit Breaker Pattern

From *Java Systems Design Interview* (del Nero), every synchronous service-to-service call is wrapped in a circuit breaker:

```
States:
  CLOSED   → Normal operation; requests pass through
  OPEN     → Failure threshold exceeded; requests fail fast
  HALF-OPEN → Trial requests allowed; evaluates recovery

Thresholds (example — Order → Payment):
  Failure rate threshold: 50% over 10 requests
  Wait duration in OPEN:  30 seconds
  Slow call threshold:    2 seconds
```

**Tool:** Resilience4j (Java) or equivalent for each service language.

### 9.4 Bulkhead Pattern

Thread pools are isolated per upstream dependency. A slow Payment Service cannot exhaust Order Service threads used for other operations.

---

## 10. Observability & Monitoring

### 10.1 The Three Pillars

| Pillar   | Tool                        | Purpose                                     |
|----------|-----------------------------|---------------------------------------------|
| Logs     | ELK Stack (Elasticsearch + Logstash + Kibana) | Structured JSON logs, searchable |
| Metrics  | Prometheus + Grafana        | RED metrics (Rate, Errors, Duration)        |
| Traces   | Jaeger / OpenTelemetry      | Distributed request tracing across services |

### 10.2 Correlation ID

Every request receives a `X-Correlation-ID` header at the gateway. This ID propagates through all service calls and is included in every log line, enabling end-to-end trace reconstruction for any request.

### 10.3 Key Metrics to Monitor

```
Service-Level:
  - Request rate (RPS)
  - Error rate (4xx / 5xx percentage)
  - p50 / p95 / p99 latency
  - Active connections

Business-Level:
  - Orders placed per minute
  - Failed payment rate
  - Rewards redemptions per hour
  - Active sessions

Infrastructure:
  - Pod CPU / memory usage
  - Database connection pool saturation
  - Redis hit/miss ratio
  - Kafka consumer lag per topic
```

### 10.4 Alerting Thresholds

| Condition                        | Severity | Alert Channel         |
|----------------------------------|----------|-----------------------|
| Error rate > 1% for 2 min        | P1       | PagerDuty (on-call)   |
| p99 latency > 500ms for 5 min    | P1       | PagerDuty             |
| Kafka DLQ depth > 100            | P2       | Slack #incidents      |
| Database CPU > 80% for 10 min    | P2       | Slack #incidents      |
| Redis hit rate < 70%             | P3       | Slack #backend-alerts |

---

## 11. Security

### 11.1 Transport Security

- All external traffic: TLS 1.3 minimum
- Internal service-to-service: mTLS via service mesh (Istio)
- Certificates rotated automatically via cert-manager

### 11.2 Secrets Management

- **No secrets in code or environment variables** in production
- All secrets (DB passwords, API keys, JWT secret) stored in AWS Secrets Manager or HashiCorp Vault
- Secrets injected at runtime via sidecar or init containers
- Secrets rotation enforced every 90 days

### 11.3 Input Validation

- All API inputs validated at the gateway (schema validation) AND at the service layer
- SQL injection: parameterized queries only — no string interpolation in queries
- XSS: all user-provided content sanitized before storage and before rendering
- File uploads: type and size limits enforced; virus scanning before processing

### 11.4 PCI-DSS Compliance

The Payment Service never stores raw card numbers. The system maintains a PCI-DSS compliant scope boundary:

```
In-Scope (PCI):
  - Payment Service
  - Payment gateway communication

Out-of-Scope:
  - All other microservices
  - Logging infrastructure (card data masked before logging)
```

### 11.5 OWASP Top 10 Mitigations

| Threat                        | Mitigation                                           |
|-------------------------------|------------------------------------------------------|
| Broken Access Control         | JWT + RBAC; re-validate at service layer             |
| Cryptographic Failures        | AES-256 at rest; TLS 1.3 in transit                  |
| Injection                     | Parameterized queries; ORM-enforced                  |
| Insecure Design               | Threat modeling on every new service                 |
| Security Misconfiguration     | IaC (Terraform) with policy-as-code (OPA)            |
| Vulnerable Components         | Automated dependency scanning (Snyk / Dependabot)    |
| Auth Failures                 | Short-lived JWTs + refresh rotation + brute-force limits |
| Integrity Failures            | Signed container images; SBOMs generated per release |

---

## 12. Deployment & Infrastructure

### 12.1 Infrastructure Overview

```
Cloud Provider: AWS (primary) with multi-region active-active
Regions: us-east-1 (primary), eu-west-1, ap-southeast-1

Components:
  - EKS (Kubernetes) — service orchestration
  - RDS PostgreSQL (Multi-AZ) — per-service databases
  - ElastiCache Redis (Cluster Mode) — caching and sessions
  - MSK (Managed Kafka) — event streaming
  - S3 — static assets and media
  - CloudFront — CDN
  - Route 53 — DNS with health-check-based failover
  - ALB — Application Load Balancer per environment
```

### 12.2 Environments

| Environment | Purpose                            | Data          |
|-------------|-------------------------------------|---------------|
| `dev`       | Feature development                 | Synthetic      |
| `staging`   | Pre-production integration testing  | Anonymized     |
| `prod`      | Live traffic                        | Real           |

All environments are provisioned via **Terraform** (IaC). No manual console changes allowed in `staging` or `prod`.

### 12.3 CI/CD Pipeline

```
Code Push to GitHub
    │
    ▼
GitHub Actions CI:
  1. Lint & static analysis
  2. Unit tests
  3. Integration tests (Docker Compose)
  4. Build Docker image
  5. Push to ECR with commit SHA tag
    │
    ▼
ArgoCD (GitOps):
  6. Detect new image tag in Helm values
  7. Deploy to `dev` automatically
  8. Manual approval gate → deploy to `staging`
  9. Manual approval gate → deploy to `prod`
 10. Canary rollout (10% → 50% → 100%) in prod
```

### 12.4 Service Mesh

Istio manages:
- mTLS between all pods
- Traffic policies and retries
- Canary traffic splitting
- Distributed tracing injection

---

## 13. File & Folder Structure

```
coffee-company-backend/
├── services/
│   ├── user-service/
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   ├── repositories/
│   │   │   ├── models/
│   │   │   ├── events/
│   │   │   └── middleware/
│   │   ├── tests/
│   │   │   ├── unit/
│   │   │   └── integration/
│   │   ├── Dockerfile
│   │   └── package.json / pom.xml
│   ├── menu-service/
│   ├── order-service/
│   ├── rewards-service/
│   ├── store-locator-service/
│   ├── payment-service/
│   └── notification-service/
│
├── shared/
│   ├── proto/                  # gRPC .proto definitions
│   ├── events/                 # Kafka event schema (Avro / JSON Schema)
│   ├── middleware/             # Auth, logging, correlation ID
│   └── utils/                 # Shared validation helpers
│
├── infrastructure/
│   ├── terraform/
│   │   ├── environments/
│   │   │   ├── dev/
│   │   │   ├── staging/
│   │   │   └── prod/
│   │   └── modules/
│   │       ├── eks/
│   │       ├── rds/
│   │       ├── redis/
│   │       └── kafka/
│   ├── helm/
│   │   └── charts/
│   │       ├── user-service/
│   │       ├── menu-service/
│   │       └── ...
│   └── k8s/
│       ├── base/
│       └── overlays/
│
├── gateway/
│   ├── nginx.conf
│   ├── rate-limit.lua
│   └── auth-middleware/
│
├── docs/
│   ├── api/                    # OpenAPI / Swagger specs
│   ├── adr/                    # Architecture Decision Records
│   └── runbooks/               # On-call runbooks
│
├── scripts/
│   ├── db-migrate.sh
│   ├── seed-dev-data.sh
│   └── kafka-topic-init.sh
│
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
│
└── docker-compose.yml          # Local development
```

---

## 14. Code Style & Conventions

### 14.1 Naming Conventions

| Item                   | Convention        | Example                          |
|------------------------|-------------------|----------------------------------|
| REST endpoints         | `kebab-case`      | `/v1/menu-items/{itemId}`        |
| Database tables        | `snake_case`      | `order_items`, `rewards_accounts`|
| Environment variables  | `SCREAMING_SNAKE` | `DATABASE_URL`, `JWT_SECRET`     |
| Kafka topic names      | `kebab-case`      | `order.orders.created`           |
| Docker images          | `kebab-case`      | `coffee-menu-service:1.2.3`      |
| gRPC service names     | `PascalCase`      | `OrderService`, `RewardsService` |
| Event class names      | `PascalCase`      | `OrderCreatedEvent`              |
| Config keys (YAML)     | `camelCase`       | `maxRetries`, `connectionTimeout`|

### 14.2 API Response Codes

| Scenario                     | HTTP Status |
|------------------------------|-------------|
| Successful GET               | 200 OK      |
| Successful POST (created)    | 201 Created |
| Successful DELETE            | 204 No Content |
| Validation error             | 400 Bad Request |
| Unauthenticated              | 401 Unauthorized |
| Forbidden (no permission)    | 403 Forbidden |
| Resource not found           | 404 Not Found |
| Conflict (duplicate)         | 409 Conflict |
| Rate limit exceeded          | 429 Too Many Requests |
| Internal server error        | 500 Internal Server Error |
| Downstream service failure   | 503 Service Unavailable |

### 14.3 Logging Standard

All log entries are structured JSON:

```json
{
  "timestamp": "2024-11-01T14:23:00.000Z",
  "level": "INFO",
  "service": "order-service",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "uuid",
  "message": "Order created successfully",
  "orderId": "uuid",
  "durationMs": 42
}
```

Never log: passwords, credit card numbers, JWT tokens, PII (full name + address combined).

### 14.4 Error Handling Rules

- All unhandled exceptions caught at the controller boundary and mapped to standard error responses
- Never expose stack traces in production API responses
- All errors logged with full context (correlation ID, user ID, input payload — PII-masked)
- Downstream call failures return 503, never bubble up raw error messages

---

## 15. Backend Quick-Start Checklist

Use this before shipping any new service or feature to production:

### Service Design
- [ ] Service owns exactly one bounded context
- [ ] Database-per-service isolation enforced
- [ ] All external APIs versioned under `/v1/`
- [ ] gRPC proto files committed and reviewed
- [ ] Kafka topics defined with partition key documented

### Data
- [ ] All tables include `created_at`, `updated_at`, `deleted_at`
- [ ] UUID primary keys used (no sequential integers in public APIs)
- [ ] Read replica configured for read-heavy queries
- [ ] Database migrations are backwards-compatible and reversible
- [ ] No cross-service joins in database queries

### Caching
- [ ] Cache TTLs documented per endpoint
- [ ] Cache invalidation events wired to Kafka consumers
- [ ] Redis fallback handled gracefully (degrade to DB, don't crash)

### Security
- [ ] No secrets in code or version control
- [ ] All endpoints require auth (or explicitly marked public)
- [ ] Input validation at both gateway and service layer
- [ ] PCI scope boundary reviewed with payment team if applicable
- [ ] Dependency scan passing (no high/critical CVEs)

### Reliability
- [ ] Circuit breaker configured for all synchronous downstream calls
- [ ] Retry logic with exponential backoff and jitter
- [ ] DLQ configured for all Kafka consumers
- [ ] Health check endpoints (`/health/live` and `/health/ready`) implemented
- [ ] Graceful shutdown handled (drain in-flight requests)

### Observability
- [ ] Structured JSON logging implemented
- [ ] Correlation ID propagated through all calls
- [ ] OpenTelemetry tracing instrumented
- [ ] RED metrics (rate, errors, duration) exposed via Prometheus
- [ ] Grafana dashboard created for new service
- [ ] Alerting rules added for error rate and latency

### Deployment
- [ ] Dockerfile uses non-root user
- [ ] Docker image scanned for vulnerabilities
- [ ] Helm chart updated with resource requests/limits
- [ ] HPA configured with appropriate min/max replicas
- [ ] Canary rollout strategy configured in ArgoCD
- [ ] Rollback procedure documented in runbook

---

## 📚 References

- *Java Systems Design Interview* — Rafael Chinelato del Nero
- *Architecting Modern Systems: A Practical Guide* — Aarav Joshi
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [PCI-DSS v4.0](https://www.pcisecuritystandards.org/)
- [WCAG 2.1 — for API error message clarity](https://www.w3.org/WAI/WCAG21/quickref/)
- [Google SRE Book — Reliability patterns](https://sre.google/sre-book/table-of-contents/)
- [Kafka Design Patterns](https://kafka.apache.org/documentation/)

---

*This document is a living reference. All Architecture Decision Records (ADRs) for significant design choices are maintained in `/docs/adr/`. Update this document when service boundaries, data stores, or infrastructure components change.*
