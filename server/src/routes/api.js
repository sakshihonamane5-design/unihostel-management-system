import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { ROLES } from '../config/constants.js';
import { authRequired, requireRoles } from '../middleware/auth.js';
import { asyncHandler } from '../utils/http.js';
import * as auth from '../services/authService.js';
import * as users from '../services/userService.js';
import * as hostels from '../services/hostelService.js';
import * as residency from '../services/residencyService.js';
import * as mentors from '../services/mentorService.js';
import * as leave from '../services/leaveService.js';
import * as ops from '../services/opsService.js';
import * as reports from '../services/reportService.js';
import { Institution } from '../models/Institution.js';
import { publicInstitution } from '../services/authService.js';
import { z } from 'zod';

export function createApiRouter(env) {
  const api = Router();
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many login attempts. Please try again later.' },
    skip: () => env.NODE_ENV === 'test',
  });

  api.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'unihostel-api',
      time: new Date().toISOString(),
    });
  });

  api.get('/institutions/public/:code', asyncHandler(async (req, res) => {
    const institution = await Institution.findOne({ code: req.params.code.toUpperCase() });
    if (!institution) return res.status(404).json({ error: 'Institution not found' });
    res.json({ institution: publicInstitution(institution) });
  }));

  api.post('/auth/register', asyncHandler(auth.registerStudent));
  api.post(
    '/auth/login',
    loginLimiter,
    asyncHandler((req, res) => auth.login(req, res, env)),
  );
  api.post('/auth/logout', (req, res) => auth.logout(req, res, env));
  api.get('/auth/me', authRequired(env), asyncHandler(auth.currentUser));
  api.post(
    '/auth/password-reset/request',
    asyncHandler((req, res) => auth.requestPasswordReset(req, res, env)),
  );
  api.post('/auth/password-reset/confirm', asyncHandler(auth.confirmPasswordReset));

  const authed = authRequired(env);
  const admin = [authed, requireRoles(ROLES.ADMIN)];
  const staff = [authed, requireRoles(ROLES.ADMIN, ROLES.GATE_SECURITY)];
  const mentorStaff = [authed, requireRoles(ROLES.ADMIN, ROLES.MENTOR)];

  api.get('/institutions/current', authed, (req, res) => {
    res.json({ institution: publicInstitution(req.institution) });
  });
  api.patch(
    '/institutions/current',
    ...admin,
    asyncHandler(async (req, res) => {
      const body = z
        .object({
          logoUrl: z.string().optional(),
          loginBannerUrl: z.string().optional(),
          primaryColour: z.string().optional(),
          accentColour: z.string().optional(),
          supportEmail: z.string().email().optional(),
          supportPhone: z.string().optional(),
        })
        .parse(req.body);
      Object.assign(req.institution, body);
      await req.institution.save();
      res.json({ institution: publicInstitution(req.institution) });
    }),
  );

  api.get('/users', ...admin, asyncHandler(users.listUsers));
  api.post('/users/:id/approve', ...admin, asyncHandler(users.approveUser));
  api.patch('/users/:id/status', ...admin, asyncHandler(users.setUserStatus));
  api.patch('/users/:id/role', ...admin, asyncHandler(users.assignRole));

  api.get('/students', ...admin, asyncHandler(users.listStudents));
  api.get('/students/me', authed, asyncHandler(users.getOwnStudent));
  api.get('/students/:id', authed, asyncHandler(users.getStudent));
  api.patch('/students/me', authed, asyncHandler(users.updateStudent));
  api.patch('/students/:id', ...admin, asyncHandler(users.updateStudent));
  api.post('/students/:id/archive', ...admin, asyncHandler(users.archiveStudent));

  api.get('/hostels/tree', authed, asyncHandler(hostels.hostelTree));
  api.post('/hostels', ...admin, asyncHandler(hostels.createHostel));
  api.get('/hostels', authed, asyncHandler(hostels.listHostels));
  api.post('/blocks', ...admin, asyncHandler(hostels.createBlock));
  api.post('/floors', ...admin, asyncHandler(hostels.createFloor));
  api.post('/rooms', ...admin, asyncHandler(hostels.createRoom));
  api.post('/beds', ...admin, asyncHandler(hostels.createBed));

  api.post('/residencies/check-in', ...admin, asyncHandler(residency.checkIn));
  api.post('/residencies/transfer', ...admin, asyncHandler(residency.transferBed));
  api.post('/residencies/check-out', ...admin, asyncHandler(residency.checkOut));
  api.get('/residencies/history', authed, asyncHandler(residency.allocationHistory));

  api.post('/mentors', ...admin, asyncHandler(mentors.designateMentor));
  api.post('/mentors/assign', ...admin, asyncHandler(mentors.assignMentor));
  api.post('/mentors/reassign', ...admin, asyncHandler(mentors.reassignMentor));
  api.get('/mentors/dashboard', ...mentorStaff, asyncHandler(mentors.mentorDashboard));
  api.post('/mentors/check-ins', ...mentorStaff, asyncHandler(mentors.createCheckIn));
  api.get('/mentors/check-ins', authed, asyncHandler(mentors.listCheckIns));
  api.post('/mentors/escalations', ...mentorStaff, asyncHandler(mentors.escalateToWarden));
  api.get('/mentors/escalations', ...admin, asyncHandler(mentors.listEscalations));

  api.post('/leaves', authed, asyncHandler(leave.createLeave));
  api.get('/leaves', authed, asyncHandler(leave.listLeaves));
  api.post('/leaves/:id/decision', ...admin, asyncHandler(leave.decideLeave));
  api.get('/gate-passes/mine', authed, asyncHandler(leave.myGatePasses));
  api.post('/gate/verify', ...staff, asyncHandler(leave.verifyGatePass));
  api.post('/gate/movements', ...staff, asyncHandler(leave.recordMovement));
  api.get('/gate/lookup', ...staff, asyncHandler(leave.lookupStudent));
  api.get('/gate/movements', ...staff, asyncHandler(leave.listMovements));

  api.post('/complaints', authed, asyncHandler(ops.createComplaint));
  api.get('/complaints', authed, asyncHandler(ops.listComplaints));
  api.patch('/complaints/:id', ...admin, asyncHandler(ops.updateComplaint));
  api.post('/notices', ...admin, asyncHandler(ops.createNotice));
  api.get('/notices', authed, asyncHandler(ops.listNotices));
  api.post('/notices/:id/acknowledge', authed, asyncHandler(ops.acknowledgeNotice));

  api.post('/mess', ...admin, asyncHandler(reports.upsertMess));
  api.get('/mess', authed, asyncHandler(reports.listMess));
  api.get('/reports', ...admin, asyncHandler(reports.reports));
  api.get('/audit', ...admin, asyncHandler(reports.listAudit));
  api.post('/emergency-assist', authed, asyncHandler(reports.createEmergencyAssist));

  return api;
}
