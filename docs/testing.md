# Testing

## Backend

Vitest + Supertest + MongoDB Memory Server.

```bash
npm run test:server
```

Coverage includes:

- Health and OpenAPI
- Student registration role/status rules
- Admin approval and cookie session
- Cross-institution isolation
- Password-reset token structure
- Bed contention / existing occupancy
- Deterministic mentor selection
- Leave + duplicate EXIT rejection
- Complaint workflow order
- Report authorization

## Frontend

Vitest + React Testing Library (jsdom).

```bash
npm run test:client
```

## Quality gates used before milestone commits

```bash
npm test
npm run lint
npm run build
```
