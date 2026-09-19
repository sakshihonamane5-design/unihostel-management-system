import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startTestApp, stopTestApp, loginAs, TEST_ENV } from './helpers.js';
import { User } from '../src/models/User.js';
import { Institution } from '../src/models/Institution.js';
import { ACCOUNT_STATUS, ROLES } from '../src/config/constants.js';

let api;

describe('authentication and isolation', () => {
  beforeAll(async () => {
    ({ request: api } = await startTestApp());
  });
  afterAll(async () => {
    await stopTestApp();
  });

  it('registers students as PENDING with STUDENT role only', async () => {
    const res = await api.post('/api/auth/register').send({
      institutionCode: 'SPIT',
      email: 'freshman@spit.ac.in',
      password: 'StrongPass_123!',
      firstName: 'New',
      lastName: 'Student',
      rollNumber: '2024CS199',
      programme: 'B.Tech',
      department: 'CSE',
      academicYear: '1',
      phone: '9111111111',
      emergencyContact: { name: 'Parent', phone: '9222222222', relation: 'Parent' },
    });
    expect(res.status).toBe(201);
    expect(res.body.role).toBe(ROLES.STUDENT);
    expect(res.body.status).toBe(ACCOUNT_STATUS.PENDING);
    const login = await api.post('/api/auth/login').send({
      email: 'freshman@spit.ac.in',
      password: 'StrongPass_123!',
      institutionCode: 'SPIT',
    });
    expect(login.status).toBe(403);
  });

  it('rejects registration for disallowed email domains', async () => {
    const res = await api.post('/api/auth/register').send({
      institutionCode: 'SPIT',
      email: 'user@gmail.com',
      password: 'StrongPass_123!',
      firstName: 'X',
      lastName: 'Y',
      rollNumber: '2024CS200',
      programme: 'B.Tech',
      department: 'CSE',
      academicYear: '1',
      phone: '9111111112',
      emergencyContact: { name: 'Parent', phone: '9222222223', relation: 'Parent' },
    });
    expect(res.status).toBe(400);
  });

  it('allows an admin to approve and then the student can sign in via cookie', async () => {
    const { cookie } = await loginAs(api, 'warden@spit.ac.in', TEST_ENV.SEED_ADMIN_PASSWORD);
    const pending = await User.findOne({ email: 'freshman@spit.ac.in' });
    const approve = await api.post(`/api/users/${pending._id}/approve`).set('Cookie', cookie);
    expect(approve.status).toBe(200);
    const login = await loginAs(api, 'freshman@spit.ac.in', 'StrongPass_123!');
    expect(login.res.status).toBe(200);
    expect(login.cookie).toContain('unihostel_token=');
    const me = await api.get('/api/auth/me').set('Cookie', login.cookie);
    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe('freshman@spit.ac.in');
    const logout = await api.post('/api/auth/logout').set('Cookie', login.cookie);
    expect(logout.status).toBe(200);
  });

  it('prevents one institution from reading another institution’s users', async () => {
    const other = await Institution.create({
      name: 'Other College',
      shortName: 'OTH',
      code: 'OTH',
      allowedEmailDomains: ['other.edu'],
      supportEmail: 'a@other.edu',
      supportPhone: '1',
      status: 'ACTIVE',
    });
    const bcrypt = await import('bcryptjs');
    await User.create({
      institutionId: other._id,
      email: 'admin@other.edu',
      passwordHash: await bcrypt.hash('ChangeMe_Admin_123!', 10),
      role: ROLES.ADMIN,
      status: ACCOUNT_STATUS.ACTIVE,
      firstName: 'Other',
      lastName: 'Admin',
    });
    const spitAdmin = await loginAs(api, 'warden@spit.ac.in', TEST_ENV.SEED_ADMIN_PASSWORD);
    const users = await api.get('/api/users').set('Cookie', spitAdmin.cookie);
    expect(users.status).toBe(200);
    expect(users.body.users.every((u) => String(u.institutionId) === String(users.body.users[0].institutionId))).toBe(
      true,
    );
    expect(users.body.users.some((u) => u.email === 'admin@other.edu')).toBe(false);
  });

  it('issues a development password-reset token structure', async () => {
    const res = await api.post('/api/auth/password-reset/request').send({
      email: 'warden@spit.ac.in',
      institutionCode: 'SPIT',
    });
    expect(res.status).toBe(200);
    expect(res.body.devResetToken).toBeTruthy();
    const confirm = await api.post('/api/auth/password-reset/confirm').send({
      token: res.body.devResetToken,
      password: 'ChangeMe_Admin_123!',
    });
    expect(confirm.status).toBe(200);
  });
});
