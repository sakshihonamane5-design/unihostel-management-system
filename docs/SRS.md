# Software Requirements Specification — UniHostel

## 1. Purpose

UniHostel is a centralized hostel management system for multiple institutions. The first demonstration institution is Sardar Patel Institute of Technology (SPIT). Records are isolated by `institutionId`. The product contains no AI or machine-learning features.

## 2. Users

| Role | How it is obtained |
| --- | --- |
| Student | Public registration (always `PENDING` until approved) |
| Senior-student Mentor | Assigned by an administrator |
| Hostel Admin / Warden | Assigned by an administrator |
| Gate Security | Assigned by an administrator |

Public registration cannot select Admin, Mentor or Gate Security.

## 3. Functional requirements

1. Institution configuration and branding
2. Authentication with HTTP-only cookies, account statuses, password-reset structure, login rate limiting
3. Student profiles and archival without silent deletion
4. Hostel / block / floor / room / bed structure with occupancy
5. Residency check-in, bed allocation, transfer, checkout and history
6. Deterministic mentor load balancing, check-ins, restricted notes, warden escalation
7. Leave requests, approval history, late return
8. Gate passes with QR-ready token structure, ENTRY/EXIT movements, duplicate rejection, manual lookup
9. Complaints with workflow OPEN → ACKNOWLEDGED → IN_PROGRESS → RESOLVED → CLOSED
10. Notices (institution, hostel, role) with optional acknowledgement
11. Mess enrolment registry only
12. Operational reports
13. Audit log without secrets

## 4. Non-functional requirements

- Institution isolation on every query
- Responsive light administrative UI
- Automated tests for authentication and core workflows
- OpenAPI documentation at `/api/docs`

## 5. Out of scope

Facial recognition, GPS tracking, AI/ML, mess billing, kitchen inventory, medical diagnosis, mental-health scoring.
