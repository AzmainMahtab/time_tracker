
## Overview ##
This project is a high-performance **Time Tracking API** designed to ingest, process, and report on application usage data in real-time. Built to handle the "high-frequency ping" nature of desktop trackers (which send updates every few seconds), the system utilizes an asynchronous processing pipeline to ensure the API remains responsive while maintaining high data integrity. Also controll multi device authentication, session managment and chaching.


## Architectural Philosophy ##

This project was made using **Hexagonal** structure to keep a strict separation between business rules and side effects.  **Domain-Driven Design (DDD)** adherence to the core business logic was enforced. The domain becomes the source of truth not the database schema. 

### Dependency rule ###

With dependency inversion all the dependencies only flow inward. The domain layer is plain TypeScript, with no dependency with no third-party libraries. So the business logic is more or less "immortal". All the frameworks may change overtime and the implementations may have breaking changes but that doesn't affect the core business logic. Also allows a plug and play like nature where any component of the project can be switched without disrupting the main business logic. 

## Technology ##

<p align="left">
  <a href="https://skillicons.dev">
    <img src="https://skillicons.dev/icons?i=ts,express,postgres,redis,docker" >
  </a>

</p>

**Core Libraries**

| Libraries | Purpose |
|-----------|---------|------|
|Express        |Routing  |
|Zod  |DTO Validation| 
|pg        |Postgres Drover| 
|redis   |Redis client library|
|dotenv   |ENV management | 

## Data flow
```
┌─────────┐   JSON    ┌─────────────┐   DTO   ┌─────────────┐
│ Client  ├──────────►│ Controllers ├────────►│  Services   │
└─────────┘   (DTO)   └─────────────┘         └──────┬──────┘
                                                     │
                                                     │ Domain
                                                     │ Models
                                                     │
┌─────────┐   JSON    ┌─────────────┐  Domain ┌──────▼──────┐
│ Client  │◄──────────┤ Controllers │◄────────┤ Repositories│
└─────────┘   (DTO)   └─────────────┘  Models └─────────────┘
```

## Folder structure
command `tree -I 'node_modules|dist|build|.git' -L 4`

```
.
├── docker-compose.yml
├── Dockerfile
├── package.json
├── package-lock.json
├── README.md
├── src
│   ├── api
│   │   └── http
│   │       ├── app.ts
│   │       ├── controllers
│   │       ├── dtos
│   │       ├── middlewares
│   │       ├── routes
│   │       └── server.ts
│   ├── config
│   │   └── env.ts
│   ├── domains
│   │   ├── auth.domain.ts
│   │   ├── usage.domain.ts
│   │   ├── user.domain.ts
│   │   └── user.perams.ts
│   ├── infra
│   │   ├── bullmq
│   │   │   ├── connection.ts
│   │   │   └── usage.workers.ts
│   │   ├── postgres
│   │   │   ├── migrate.ts
│   │   │   ├── pool.ts
│   │   │   ├── report.repository.ts
│   │   │   ├── session.repository.ts
│   │   │   ├── usage.repository.ts
│   │   │   ├── user.repository.test.ts
│   │   │   └── user.repository.ts
│   │   └── redis
│   │       ├── client.ts
│   │       └── redis.respository.ts
│   ├── migrations
│   │   ├── 0001_create_user.sql
│   │   ├── 0002_session_table.sql
│   │   └── 0003_app_usage_table.sql
│   ├── ports
│   │   ├── auth.port.ts
│   │   ├── cache.port.ts
│   │   ├── hash.port.ts
│   │   ├── jwt.port.ts
│   │   ├── report.port.ts
│   │   ├── session.ports.ts
│   │   ├── usage.port.ts
│   │   └── user.ports.ts
│   ├── secure
│   │   ├── hash.adapter.ts
│   │   └── jwt.adapter.ts
│   ├── services
│   │   ├── auth.service.test.ts
│   │   ├── auth.service.ts
│   │   ├── report.sercie.ts
│   │   ├── usage.service.test.ts
│   │   ├── usage.service.ts
│   │   ├── user.service.test.ts
│   │   └── user.service.ts
│   └── types
│       └── express.d.ts
├── tsconfig.json
└── vitest.config.ts

19 directories, 46 files

```
## SQL Schemas
**Users table**
```sql
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  uuid UUID DEFAULT uuidv7(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_uuid ON users (uuid);
```
**Sessions table**
```sql
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  uuid UUID DEFAULT uuidv7(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_uuid ON users (uuid);
```

**App_usage table**
```sql
-- Enable extension for EXCLUDE constraints with non-range types (user_id)
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE IF NOT EXISTS app_usage (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    app_name VARCHAR(255) NOT NULL,
    domain VARCHAR(255),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
   
    -- Constrain for no overlaping usage for the same user
    CONSTRAINT no_overlapping_usage EXCLUDE USING gist (
        user_id WITH =,
        tstzrange(start_time, end_time) WITH &&
    )
);

-- Index for Report APIs 
CREATE INDEX idx_usage_report_lookup ON app_usage (user_id, start_time DESC);
```

## Reports SQL breakdown

The reporting system relies on PostgreSQL's advanced **Interval Arithmetic** and **Timezone Displacement** to calculate usage accurately across global regions.

---

### 1. The Apps Report Query
This query aggregates total active time per application for a specific user on a given local calendar day.
**app reporting SQL**
```sql
SELECT 
    app_name, 
    SUM(end_time - start_time) as duration
FROM app_usage
WHERE user_id = $1 
  AND (start_time AT TIME ZONE $3)::date = $2::date
GROUP BY app_name
ORDER BY duration DESC;
```
**domain reporting SQL**
```sql
SELECT 
    domain as url, 
    SUM(end_time - start_time) as duration
FROM app_usage
WHERE user_id = $1 
  AND (start_time AT TIME ZONE $3)::date = $2::date
GROUP BY domain
ORDER BY duration DESC;
```
#### SQL Logic Breakdown:

* **`SUM(end_time - start_time)`**: Subtracting two `TIMESTAMPTZ` values in Postgres returns an `INTERVAL` type. The `SUM` function then mathematically totals these durations (handling overflows from seconds to minutes and minutes to hours automatically).
* **`AT TIME ZONE $3`**: Crucial for global accuracy. It shifts the UTC storage time to the user's local offset (e.g., `America/New_York`) before the date is evaluated.
* **`::date`**: Casts the shifted timestamp to a `YYYY-MM-DD` format to match the user's input `$2`.
* **`GROUP BY app_name`**: Collapses potentially hundreds of "pings" into a single summarized row per application.
* Exactly the same steatergy is applied for **`GROUP BY domain`**

## Scaling Strategy & Architectural Evolution

To handle millions of "pings" per minute from a global user base, the system scales horizontally across three distinct layers.

### Ingestion Scaling
The **API Layer** is intentionally "thin." It does not perform database IO.
* **Horizontal Scaling:** We can deploy multiple instances of the Express API behind a **Load Balancer** (Nginx/AWS ELB).
* **Backpressure Management:** By moving pings (usage/track) directly into **Redis**, the API can respond in `<10ms`, even if the database is under heavy load.
* **Statelessness:** Since authentication is handled via JWT, any API node can handle any request.

### Processing Scaling 
The **Worker Layer** (BullMQ) handles the "heavy lifting" (Domain logic, URL normalization, and DB Merging).
* **Parallel Workers:** We can spin up dozens of worker containers across different servers. BullMQ ensures that a job is only processed once. For even bigger thrpughput handleing we can use Apache Kafka
* **Concurrency Control:** We limit the number of concurrent jobs per worker to prevent CPU exhaustion during URL parsing or complex merging logic.
* **Job Prioritization:** We can separate "Real-time Tracking" jobs from "Report Generation" jobs into different Redis queues to ensure tracking never lags.


### Storage Scaling
PostgreSQL is usually the first bottleneck. We solve this using three specific techniques:

#### Read/Write Splitting
We can use a **Primary Database** for writes (inserts from Workers) and multiple **Read Replicas** for generating reports. This ensures that a heavy user generating a yearly report doesn't slow down the tracking pings of other users.

#### Table Partitioning
As the `app_usage` table reaches hundreds of millions of rows, we implement **Range Partitioning** by month.
* **Benefit:** When a user queries a report for `2026-03-01`, Postgres only searches the "March 2026" partition, ignoring billions of rows from previous years.
* **Maintenance:** Old data (e.g., from 3 years ago) can be archived or dropped instantly by dropping a partition.

#### Connection Pooling
We use **PgBouncer** to manage thousands of database connections from our distributed workers, preventing the "Too many clients" error.



---

