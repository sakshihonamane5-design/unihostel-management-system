# Database design

MongoDB collections (Mongoose models):

| Collection | Purpose |
| --- | --- |
| institutions | Branding, email domains, status |
| users | Login identity, role, account status |
| studentprofiles | Academic and emergency data |
| hostels, blocks, floors, rooms, beds | Physical structure |
| residencies | Check-in / checkout lifecycle |
| allocations | Bed occupancy history |
| mentorprofiles, mentorassignments, mentorcheckins, escalations | Mentorship |
| leaverequests, gatepasses, movements | Leave and gate |
| complaints | Facility issues |
| notices | Announcements |
| messenrolments | Mess registry |
| auditlogs | Safe action history |

## Integrity

- Unique `(institutionId, email)` on users
- Unique `(institutionId, rollNumber)` on student profiles
- Partial unique indexes: one active residency per student, one active allocation per student, one active occupant per bed
- Bed claim uses `findOneAndUpdate` on `occupantId: null` to reduce double-booking races
- Room capacity is re-checked before allocation
- Historical allocations are closed, never deleted
