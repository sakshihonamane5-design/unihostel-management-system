import { User } from '../models/User.js';
import { Institution } from '../models/Institution.js';
import { ACCOUNT_STATUS, INSTITUTION_STATUS } from '../config/constants.js';
import { HttpError } from '../utils/http.js';
import { verifyAccessToken } from '../utils/tokens.js';

export function authRequired(env) {
  return async (req, res, next) => {
    try {
      const token = req.cookies?.[env.COOKIE_NAME];
      if (!token) throw new HttpError(401, 'Authentication required');
      const payload = verifyAccessToken(token, env);
      const user = await User.findById(payload.sub);
      if (!user) throw new HttpError(401, 'Authentication required');
      if (user.status !== ACCOUNT_STATUS.ACTIVE) {
        throw new HttpError(403, 'Account is not active');
      }
      const institution = await Institution.findById(user.institutionId);
      if (!institution || institution.status !== INSTITUTION_STATUS.ACTIVE) {
        throw new HttpError(403, 'Institution is not active');
      }
      req.user = user;
      req.institution = institution;
      req.tokenPayload = payload;
      next();
    } catch (err) {
      next(err);
    }
  };
}

export function requireRoles(...roles) {
  return (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new HttpError(403, 'You do not have permission for this action'));
    }
    next();
  };
}

export function scopedInstitution(query, institutionId) {
  return { ...query, institutionId };
}
