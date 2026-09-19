# UniHostel

Multi-institution centralized hostel management system. The first demonstration institution is **Sardar Patel Institute of Technology (SPIT)**.

Each institution’s records are isolated by `institutionId`. Administrators cannot access another institution’s data. The application does not include AI or machine-learning features.

## Repository layout

- `client/` — React + Vite + Tailwind CSS
- `server/` — Node.js, Express, Mongoose, Zod
- `docs/` — SRS, architecture, API, testing, security, and research notes

## Prerequisites

- Node.js 20 or later
- npm 10 or later
- A MongoDB Atlas cluster (or any MongoDB URI) for running the app locally

Automated tests use an in-memory MongoDB and do **not** require Atlas.

## Local setup

1. Copy `.env.example` to `.env` in the repository root.
2. Set `MONGODB_URI` to your Atlas connection string.
3. Replace `JWT_SECRET` and the `SEED_*_PASSWORD` values.
4. Install dependencies and start both apps:

```bash
npm install
npm run seed
npm run dev
```

- API: http://localhost:5000
- Health: http://localhost:5000/api/health
- Frontend: http://localhost:5173
- OpenAPI UI: http://localhost:5000/api/docs

## Demo accounts (development seed)

Passwords are **not** hard-coded in the frontend. They come from `.env` when you run `npm run seed`.

| Role | Email (SPIT) | Env password |
| --- | --- | --- |
| Hostel Admin | `warden@spit.ac.in` | `SEED_ADMIN_PASSWORD` |
| Gate Security | `gate@spit.ac.in` | `SEED_SECURITY_PASSWORD` |
| Senior-student Mentor | `mentor.senior@spit.ac.in` | `SEED_MENTOR_PASSWORD` |
| Student | `student.one@spit.ac.in` | `SEED_STUDENT_PASSWORD` |
| Student | `student.two@spit.ac.in` | `SEED_STUDENT_PASSWORD` |

Public registration always creates a **Student** account with status `PENDING`. Admin, Mentor, and Gate Security roles can only be assigned by an authorized administrator.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start API and Vite together |
| `npm test` | Server and client tests |
| `npm run lint` | ESLint for both packages |
| `npm run build` | Production builds |
| `npm run seed` | Load SPIT demonstration data |

## Documentation

- [Software requirements](docs/SRS.md)
- [Architecture](docs/architecture.md)
- [Database design](docs/database-design.md)
- [API overview](docs/API.md)
- [Testing](docs/testing.md)
- [Security](docs/security.md)
- [Research references](docs/research-references.md)

## Licence

Academic mini-project for third-year Computer Science and Engineering coursework.
