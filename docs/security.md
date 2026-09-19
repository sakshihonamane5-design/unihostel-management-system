# Security

- HTTP-only cookies; JWT is not stored in `localStorage`
- bcrypt password hashes
- Zod validation on request bodies
- Helmet and CORS with a configured origin and credentials
- Login rate limiting
- Institution scoping on queries
- Public registration cannot choose privileged roles
- Audit metadata strips keys matching password/token/secret/cookie/authorization/hash
- `.env` is gitignored; `.env.example` has placeholders only
- Demo passwords live in environment variables, never in frontend source

## Threat notes

This is an academic mini-project. Production hardening would additionally include CSRF tokens for cookie sessions, stricter cookie `Secure`/`Domain` settings, Atlas IP allow lists, and a real email channel for password resets (development currently returns a token only when `NODE_ENV` is not production).
