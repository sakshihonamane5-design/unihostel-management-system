import { ACCOUNT_STATUS, INSTITUTION_STATUS, ROLES } from '../config/constants.js';

export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export function errorHandler(err, _req, res, _next) {
  if (err.name === 'ZodError') {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.issues,
    });
  }
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (err.code === 11000) {
    return res.status(409).json({ error: 'A record with those unique fields already exists' });
  }
  const status = err.status || 500;
  const payload = { error: err.message || 'Internal server error' };
  if (err.details) payload.details = err.details;
  if (status >= 500 && process.env.NODE_ENV !== 'test') {
    console.error(err);
  }
  return res.status(status).json(payload);
}

export function notFoundHandler(_req, res) {
  res.status(404).json({ error: 'Not found' });
}

export function assertSameInstitution(user, institutionId) {
  if (!user?.institutionId || String(user.institutionId) !== String(institutionId)) {
    throw new HttpError(403, 'Access to another institution is not permitted');
  }
}

export function isAdmin(user) {
  return user?.role === ROLES.ADMIN;
}

export function isActiveAccount(user) {
  return user?.status === ACCOUNT_STATUS.ACTIVE;
}

export function isActiveInstitution(institution) {
  return institution?.status === INSTITUTION_STATUS.ACTIVE;
}
