# API

Interactive OpenAPI UI: `http://localhost:5000/api/docs`  
Machine-readable spec: `http://localhost:5000/api/docs.json`

## Conventions

- Base path: `/api`
- JSON request and response bodies
- Session cookie `unihostel_token`
- Errors: `{ "error": "message" }`

## Selected endpoints

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/health` | Liveness |
| GET | `/institutions/public/:code` | Login branding |
| POST | `/auth/register` | Student only, PENDING |
| POST | `/auth/login` | Sets cookie |
| POST | `/auth/logout` | Clears cookie |
| GET | `/auth/me` | Current user |
| POST | `/residencies/check-in` | Admin |
| POST | `/residencies/transfer` | Admin |
| POST | `/residencies/check-out` | Admin |
| POST | `/mentors/assign` | Load-balanced if mentor omitted |
| POST | `/leaves` | Student |
| POST | `/gate/verify` | Gate / admin |
| POST | `/gate/movements` | ENTRY or EXIT |
| GET | `/reports` | Admin |
| GET | `/audit` | Admin |
