# Architecture

UniHostel is an npm-workspace monorepo:

- `client/` React 19, Vite, Tailwind CSS, React Router
- `server/` Express, Mongoose, Zod validation, HTTP-only JWT cookies
- `docs/` academic and operational documentation

```
Browser (Vite :5173)
    └── REST /api  (credentials: include)
            └── Express (:5000)
                    └── MongoDB Atlas (Mongoose)
```

## Isolation

Authenticated requests load the user and institution. All list/get/update queries include `institutionId` from the session, never from an untrusted client-supplied institution override.

## Authn/Authz

- Passwords hashed with bcrypt
- JWT stored in an HTTP-only `SameSite=Lax` cookie
- Role checks on privileged routes
- Login rate limiting outside the test environment

## Mentor assignment

`selectLeastLoadedMentor` is a deterministic filter-and-sort: same institution, hostel eligibility, active, below capacity, lowest load, then earliest created, then ObjectId. No ranking models are used.
