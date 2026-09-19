export const ROLES = Object.freeze({
  STUDENT: 'STUDENT',
  MENTOR: 'MENTOR',
  ADMIN: 'ADMIN',
  GATE_SECURITY: 'GATE_SECURITY',
});

export const ACCOUNT_STATUS = Object.freeze({
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  ARCHIVED: 'ARCHIVED',
});

export const INSTITUTION_STATUS = Object.freeze({
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
});

export const RESIDENCY_STATUS = Object.freeze({
  NOT_ALLOCATED: 'NOT_ALLOCATED',
  ACTIVE: 'ACTIVE',
  CHECKED_OUT: 'CHECKED_OUT',
  ARCHIVED: 'ARCHIVED',
});

export const ALLOCATION_STATUS = Object.freeze({
  ACTIVE: 'ACTIVE',
  TRANSFERRED: 'TRANSFERRED',
  CHECKED_OUT: 'CHECKED_OUT',
});

export const BED_STATUS = Object.freeze({
  AVAILABLE: 'AVAILABLE',
  OCCUPIED: 'OCCUPIED',
  MAINTENANCE: 'MAINTENANCE',
});

export const ROOM_TYPES = Object.freeze(['SINGLE', 'DOUBLE', 'TRIPLE', 'DORM']);

export const LEAVE_STATUS = Object.freeze({
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
});

export const MOVEMENT_TYPE = Object.freeze({
  ENTRY: 'ENTRY',
  EXIT: 'EXIT',
});

export const PRESENCE_STATUS = Object.freeze({
  INSIDE: 'INSIDE',
  OUTSIDE: 'OUTSIDE',
  UNKNOWN: 'UNKNOWN',
});

export const COMPLAINT_CATEGORIES = Object.freeze([
  'ELECTRICAL',
  'PLUMBING',
  'CLEANLINESS',
  'FURNITURE',
  'INTERNET',
  'OTHER',
]);

export const COMPLAINT_PRIORITY = Object.freeze(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);

export const COMPLAINT_STATUS = Object.freeze({
  OPEN: 'OPEN',
  ACKNOWLEDGED: 'ACKNOWLEDGED',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
});

export const NOTICE_SCOPE = Object.freeze({
  INSTITUTION: 'INSTITUTION',
  HOSTEL: 'HOSTEL',
  ROLE: 'ROLE',
});

export const MESS_STATUS = Object.freeze({
  ENROLLED: 'ENROLLED',
  NOT_ENROLLED: 'NOT_ENROLLED',
  ENDED: 'ENDED',
});

export const ASSIGNMENT_STATUS = Object.freeze({
  ACTIVE: 'ACTIVE',
  REASSIGNED: 'REASSIGNED',
  CLOSED: 'CLOSED',
});
