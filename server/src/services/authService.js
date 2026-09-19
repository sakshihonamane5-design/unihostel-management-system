import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { ACCOUNT_STATUS, ROLES } from '../config/constants.js';
import { Institution } from '../models/Institution.js';
import { StudentProfile } from '../models/StudentProfile.js';
import { User } from '../models/User.js';
import { writeAudit } from '../models/AuditLog.js';
import { HttpError } from '../utils/http.js';
import { clearAuthCookie, hashToken, randomToken, setAuthCookie, signAccessToken } from '../utils/tokens.js';

const registerSchema = z.object({
  institutionCode: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(10),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  rollNumber: z.string().min(1),
  programme: z.string().min(1),
  department: z.string().min(1),
  academicYear: z.string().min(1),
  phone: z.string().min(8),
  emergencyContact: z.object({
    name: z.string().min(1),
    phone: z.string().min(8),
    relation: z.string().min(1),
  }),
  accessibilityRequirement: z.string().optional().default(''),
  allergyNote: z.string().optional().default(''),
  allergyConsented: z.boolean().optional().default(false),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  institutionCode: z.string().min(2),
});

function emailDomain(email) {
  return email.split('@')[1]?.toLowerCase();
}

export async function registerStudent(req, res) {
  const body = registerSchema.parse(req.body);
  const institution = await Institution.findOne({ code: body.institutionCode.toUpperCase() });
  if (!institution || institution.status !== 'ACTIVE') {
    throw new HttpError(400, 'Unknown or inactive institution');
  }
  const domain = emailDomain(body.email);
  if (!institution.allowedEmailDomains.map((d) => d.toLowerCase()).includes(domain)) {
    throw new HttpError(400, 'Email domain is not allowed for this institution');
  }
  const existing = await User.findOne({ institutionId: institution._id, email: body.email.toLowerCase() });
  if (existing) throw new HttpError(409, 'An account with this email already exists');

  const passwordHash = await bcrypt.hash(body.password, 12);
  const user = await User.create({
    institutionId: institution._id,
    email: body.email.toLowerCase(),
    passwordHash,
    role: ROLES.STUDENT,
    status: ACCOUNT_STATUS.PENDING,
    firstName: body.firstName,
    lastName: body.lastName,
  });
  await StudentProfile.create({
    institutionId: institution._id,
    userId: user._id,
    rollNumber: body.rollNumber,
    programme: body.programme,
    department: body.department,
    academicYear: body.academicYear,
    phone: body.phone,
    emergencyContact: body.emergencyContact,
    accessibilityRequirement: body.accessibilityRequirement,
    allergyNote: body.allergyConsented ? body.allergyNote : '',
    allergyConsented: Boolean(body.allergyConsented && body.allergyNote),
  });
  await writeAudit({
    institutionId: institution._id,
    actorId: user._id,
    action: 'STUDENT_REGISTERED',
    resourceType: 'User',
    resourceId: user._id,
    metadata: { email: user.email, role: user.role },
  });
  res.status(201).json({
    message: 'Registration submitted. An administrator must approve the account before login.',
    userId: user._id,
    status: user.status,
    role: user.role,
  });
}

export async function login(req, res, env) {
  const body = loginSchema.parse(req.body);
  const institution = await Institution.findOne({ code: body.institutionCode.toUpperCase() });
  if (!institution) throw new HttpError(401, 'Invalid credentials');
  const user = await User.findOne({ institutionId: institution._id, email: body.email.toLowerCase() });
  if (!user) throw new HttpError(401, 'Invalid credentials');
  const ok = await bcrypt.compare(body.password, user.passwordHash);
  if (!ok) throw new HttpError(401, 'Invalid credentials');
  if (user.status !== ACCOUNT_STATUS.ACTIVE) {
    throw new HttpError(403, `Account is ${user.status.toLowerCase()} and cannot sign in`);
  }
  user.lastLoginAt = new Date();
  await user.save();
  const token = signAccessToken(
    { sub: String(user._id), institutionId: String(institution._id), role: user.role },
    env,
  );
  setAuthCookie(res, token, env);
  res.json({
    user: {
      id: user._id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      institutionId: user.institutionId,
    },
    institution: publicInstitution(institution),
  });
}

export function logout(_req, res, env) {
  clearAuthCookie(res, env);
  res.json({ message: 'Signed out' });
}

export async function currentUser(req, res) {
  const profile = await StudentProfile.findOne({ userId: req.user._id, institutionId: req.user.institutionId });
  res.json({
    user: {
      id: req.user._id,
      email: req.user.email,
      role: req.user.role,
      status: req.user.status,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      institutionId: req.user.institutionId,
    },
    institution: publicInstitution(req.institution),
    studentProfile: profile,
  });
}

export async function requestPasswordReset(req, res, env) {
  const body = z.object({ email: z.string().email(), institutionCode: z.string().min(2) }).parse(req.body);
  const institution = await Institution.findOne({ code: body.institutionCode.toUpperCase() });
  const user = institution
    ? await User.findOne({ institutionId: institution._id, email: body.email.toLowerCase() })
    : null;
  let resetToken = null;
  if (user && user.status === ACCOUNT_STATUS.ACTIVE) {
    resetToken = randomToken();
    user.passwordResetTokenHash = hashToken(resetToken);
    user.passwordResetExpires = new Date(Date.now() + env.PASSWORD_RESET_MINUTES * 60 * 1000);
    await user.save();
  }
  const payload = {
    message: 'If an active account exists for that email, a reset token has been issued.',
  };
  if (process.env.NODE_ENV !== 'production' && resetToken) {
    payload.devResetToken = resetToken;
  }
  res.json(payload);
}

export async function confirmPasswordReset(req, res) {
  const body = z.object({ token: z.string().min(10), password: z.string().min(10) }).parse(req.body);
  const tokenHash = hashToken(body.token);
  const user = await User.findOne({
    passwordResetTokenHash: tokenHash,
    passwordResetExpires: { $gt: new Date() },
  });
  if (!user) throw new HttpError(400, 'Reset token is invalid or expired');
  user.passwordHash = await bcrypt.hash(body.password, 12);
  user.passwordResetTokenHash = null;
  user.passwordResetExpires = null;
  await user.save();
  res.json({ message: 'Password updated. You may now sign in.' });
}

export function publicInstitution(institution) {
  return {
    id: institution._id,
    name: institution.name,
    shortName: institution.shortName,
    code: institution.code,
    logoUrl: institution.logoUrl,
    loginBannerUrl: institution.loginBannerUrl,
    primaryColour: institution.primaryColour,
    accentColour: institution.accentColour,
    supportEmail: institution.supportEmail,
    supportPhone: institution.supportPhone,
    status: institution.status,
    allowedEmailDomains: institution.allowedEmailDomains,
  };
}
