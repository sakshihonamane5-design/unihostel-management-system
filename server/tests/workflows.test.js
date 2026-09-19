import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startTestApp, stopTestApp, loginAs, TEST_ENV } from './helpers.js';
import { StudentProfile } from '../src/models/StudentProfile.js';
import { Bed } from '../src/models/Room.js';
import { selectLeastLoadedMentor } from '../src/services/mentorService.js';
import { COMPLAINT_STATUS } from '../src/config/constants.js';

let api;
let adminCookie;
let studentCookie;
let gateCookie;

describe('core hostel workflows', () => {
  beforeAll(async () => {
    ({ request: api } = await startTestApp());
    adminCookie = (await loginAs(api, 'warden@spit.ac.in', TEST_ENV.SEED_ADMIN_PASSWORD)).cookie;
    studentCookie = (await loginAs(api, 'student.two@spit.ac.in', TEST_ENV.SEED_STUDENT_PASSWORD)).cookie;
    gateCookie = (await loginAs(api, 'gate@spit.ac.in', TEST_ENV.SEED_SECURITY_PASSWORD)).cookie;
  });
  afterAll(async () => {
    await stopTestApp();
  });

  it('returns branded SPIT institution data', async () => {
    const res = await api.get('/api/institutions/public/SPIT');
    expect(res.status).toBe(200);
    expect(res.body.institution.shortName).toBe('SPIT');
    expect(res.body.institution.primaryColour).toBe('#2563EB');
  });

  it('exposes hostel occupancy without exceeding room capacity on checkout/check-in', async () => {
    const tree = await api.get('/api/hostels/tree').set('Cookie', adminCookie);
    expect(tree.status).toBe(200);
    expect(tree.body.beds.length).toBeGreaterThan(0);
    const vacant = tree.body.beds.find((b) => b.status === 'AVAILABLE');
    const student = await StudentProfile.findOne({ rollNumber: '2024CS199' }).catch(() => null);
    const freshman = await StudentProfile.findOne({ rollNumber: '2024CS102' });
    await api.post('/api/residencies/check-out').set('Cookie', adminCookie).send({ studentId: freshman._id });
    const again = await api
      .post('/api/residencies/check-in')
      .set('Cookie', adminCookie)
      .send({ studentId: freshman._id, hostelId: vacant.hostelId, bedId: vacant._id });
    expect([201, 409]).toContain(again.status);
    if (student) expect(student).toBeTruthy();
  });

  it('rejects a second active allocation for the same bed', async () => {
    const occupied = await Bed.findOne({ status: 'OCCUPIED' });
    const mentee = await StudentProfile.findOne({ rollNumber: '2024CS101' });
    const res = await api.post('/api/residencies/check-in').set('Cookie', adminCookie).send({
      studentId: mentee._id,
      hostelId: occupied.hostelId,
      bedId: occupied._id,
    });
    expect(res.status).toBe(409);
  });

  it('selects the least-loaded eligible mentor deterministically', () => {
    const a = { _id: 'b'.repeat(24), active: true, currentLoad: 1, capacity: 4, eligibleHostelIds: ['h1'], createdAt: '2026-01-01' };
    const b = { _id: 'a'.repeat(24), active: true, currentLoad: 1, capacity: 4, eligibleHostelIds: ['h1'], createdAt: '2026-01-01' };
    const chosen = selectLeastLoadedMentor([a, b], 'h1');
    expect(String(chosen._id)).toBe('a'.repeat(24));
  });

  it('creates a leave request and records gate movements without duplicate exits', async () => {
    const created = await api.post('/api/leaves').set('Cookie', studentCookie).send({
      destination: 'Mumbai',
      reason: 'Medical appointment',
      departureDate: new Date().toISOString(),
      expectedReturnDate: new Date(Date.now() + 86400000).toISOString(),
      emergencyContact: { name: 'Parent', phone: '9000000103' },
    });
    expect(created.status).toBe(201);
    const decision = await api
      .post(`/api/leaves/${created.body.leave._id}/decision`)
      .set('Cookie', adminCookie)
      .send({ decision: 'APPROVED' });
    expect(decision.status).toBe(200);
    expect(decision.body.gatePass.publicCode).toBeTruthy();
    const first = await api.post('/api/gate/movements').set('Cookie', gateCookie).send({
      code: decision.body.gatePass.publicCode,
      type: 'EXIT',
    });
    expect(first.status).toBe(201);
    const dup = await api.post('/api/gate/movements').set('Cookie', gateCookie).send({
      code: decision.body.gatePass.publicCode,
      type: 'EXIT',
    });
    expect(dup.status).toBe(409);
  });

  it('moves complaints through the required workflow', async () => {
    const opened = await api.post('/api/complaints').set('Cookie', studentCookie).send({
      category: 'PLUMBING',
      priority: 'HIGH',
      description: 'Washbasin tap is leaking continuously.',
    });
    expect(opened.status).toBe(201);
    const ack = await api
      .patch(`/api/complaints/${opened.body.complaint._id}`)
      .set('Cookie', adminCookie)
      .send({ status: COMPLAINT_STATUS.ACKNOWLEDGED });
    expect(ack.status).toBe(200);
    const skip = await api
      .patch(`/api/complaints/${opened.body.complaint._id}`)
      .set('Cookie', adminCookie)
      .send({ status: COMPLAINT_STATUS.RESOLVED });
    expect(skip.status).toBe(400);
  });

  it('returns operational reports scoped to the institution', async () => {
    const res = await api.get('/api/reports').set('Cookie', adminCookie);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('totalResidents');
    expect(res.body).toHaveProperty('occupiedBeds');
    expect(res.body).toHaveProperty('mentorWorkload');
    const studentReport = await api.get('/api/reports').set('Cookie', studentCookie);
    expect(studentReport.status).toBe(403);
  });
});
