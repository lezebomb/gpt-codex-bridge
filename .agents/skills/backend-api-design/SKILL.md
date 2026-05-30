---
name: backend-api-design
description: Design and implement backend APIs, services, validation, persistence, auth boundaries, and backend tests. Use for API endpoints, database changes, service logic, error handling, and integration contracts.
---

# Backend API Design

Before implementation, define:

- Endpoint or function contract
- Request/response schema
- Validation errors
- Authn/authz expectations
- Data model changes
- Migration risk
- Tests and observability

Treat migrations, destructive writes, and secrets as high-risk. Do not expose secrets in logs.
