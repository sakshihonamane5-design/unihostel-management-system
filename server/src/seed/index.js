import bcrypt from 'bcryptjs';
import { loadEnv, getEnv, requireMongoUri } from '../config/env.js';
import { connectDb, disconnectDb } from '../db/connect.js';
import { Institution } from '../models/Institution.js';
import { User } from '../models/User.js';
import { StudentProfile } from '../models/StudentProfile.js';
import { Block, Floor, Hostel } from '../models/Hostel.js';
import { Bed, Room } from '../models/Room.js';
import { Allocation, Residency } from '../models/Residency.js';
import { MentorAssignment, MentorProfile } from '../models/Mentorship.js';
import { GatePass, LeaveRequest, Movement } from '../models/Leave.js';
import { Complaint } from '../models/Complaint.js';
import { Notice } from '../models/Notice.js';
import { MessEnrolment } from '../models/MessEnrolment.js';
import { hashToken, randomToken } from '../utils/tokens.js';
import {
  ACCOUNT_STATUS,
  ALLOCATION_STATUS,
  BED_STATUS,
  COMPLAINT_STATUS,
  LEAVE_STATUS,
  MESS_STATUS,
  MOVEMENT_TYPE,
  PRESENCE_STATUS,
  RESIDENCY_STATUS,
  ROLES,
} from '../config/constants.js';

loadEnv();

export const SPIT_INSTITUTION = {
  name: 'Sardar Patel Institute of Technology',
  shortName: 'SPIT',
  code: 'SPIT',
  allowedEmailDomains: ['spit.ac.in'],
  logoUrl: 'https://www.spit.ac.in/wp-content/uploads/2021/01/SPIT-logo.png',
  loginBannerUrl: 'https://www.spit.ac.in/wp-content/uploads/2023/01/spit-campus.jpg',
  primaryColour: '#2563EB',
  accentColour: '#0F766E',
  supportEmail: 'hostel@spit.ac.in',
  supportPhone: '+91-22-26707440',
  status: 'ACTIVE',
};

export async function seedSpit(env = getEnv()) {
  if (!env.SEED_ADMIN_PASSWORD || !env.SEED_STUDENT_PASSWORD || !env.SEED_MENTOR_PASSWORD || !env.SEED_SECURITY_PASSWORD) {
    throw new Error('Seed passwords must be provided via environment variables');
  }

  let institution = await Institution.findOne({ code: 'SPIT' });
  if (!institution) {
    institution = await Institution.create(SPIT_INSTITUTION);
  }

  async function upsertUser({ email, role, firstName, lastName, password, status = ACCOUNT_STATUS.ACTIVE }) {
    const passwordHash = await bcrypt.hash(password, 12);
    return User.findOneAndUpdate(
      { institutionId: institution._id, email },
      { $set: { role, firstName, lastName, passwordHash, status } },
      { new: true, upsert: true },
    );
  }

  const admin = await upsertUser({
    email: 'warden@spit.ac.in',
    role: ROLES.ADMIN,
    firstName: 'Hostel',
    lastName: 'Warden',
    password: env.SEED_ADMIN_PASSWORD,
  });
  const gate = await upsertUser({
    email: 'gate@spit.ac.in',
    role: ROLES.GATE_SECURITY,
    firstName: 'Gate',
    lastName: 'Officer',
    password: env.SEED_SECURITY_PASSWORD,
  });
  const mentorUser = await upsertUser({
    email: 'mentor.senior@spit.ac.in',
    role: ROLES.MENTOR,
    firstName: 'Aarav',
    lastName: 'Mehta',
    password: env.SEED_MENTOR_PASSWORD,
  });
  const studentOneUser = await upsertUser({
    email: 'student.one@spit.ac.in',
    role: ROLES.STUDENT,
    firstName: 'Isha',
    lastName: 'Kulkarni',
    password: env.SEED_STUDENT_PASSWORD,
  });
  const studentTwoUser = await upsertUser({
    email: 'student.two@spit.ac.in',
    role: ROLES.STUDENT,
    firstName: 'Rohan',
    lastName: 'Desai',
    password: env.SEED_STUDENT_PASSWORD,
  });

  async function upsertStudent(user, data) {
    return StudentProfile.findOneAndUpdate(
      { userId: user._id, institutionId: institution._id },
      { $set: data },
      { new: true, upsert: true },
    );
  }

  const mentorStudent = await upsertStudent(mentorUser, {
    rollNumber: '2022CS001',
    programme: 'B.Tech',
    department: 'Computer Science and Engineering',
    academicYear: '4',
    phone: '9000000001',
    emergencyContact: { name: 'Mehta Parent', phone: '9000000101', relation: 'Parent' },
    residencyStatus: RESIDENCY_STATUS.ACTIVE,
    presenceStatus: PRESENCE_STATUS.INSIDE,
  });
  const studentOne = await upsertStudent(studentOneUser, {
    rollNumber: '2024CS101',
    programme: 'B.Tech',
    department: 'Computer Science and Engineering',
    academicYear: '2',
    phone: '9000000002',
    emergencyContact: { name: 'Kulkarni Parent', phone: '9000000102', relation: 'Parent' },
    residencyStatus: RESIDENCY_STATUS.ACTIVE,
    presenceStatus: PRESENCE_STATUS.OUTSIDE,
  });
  const studentTwo = await upsertStudent(studentTwoUser, {
    rollNumber: '2024CS102',
    programme: 'B.Tech',
    department: 'Computer Science and Engineering',
    academicYear: '2',
    phone: '9000000003',
    emergencyContact: { name: 'Desai Parent', phone: '9000000103', relation: 'Parent' },
    residencyStatus: RESIDENCY_STATUS.ACTIVE,
    presenceStatus: PRESENCE_STATUS.INSIDE,
    allergyConsented: true,
    allergyNote: 'Peanuts — emergency contact must be informed',
  });

  const hostel = await Hostel.findOneAndUpdate(
    { institutionId: institution._id, code: 'BH-A' },
    { $set: { name: 'Boys Hostel A', description: 'SPIT demonstration hostel', status: 'ACTIVE' } },
    { new: true, upsert: true },
  );
  const block = await Block.findOneAndUpdate(
    { hostelId: hostel._id, code: 'A' },
    { $set: { name: 'Block A', institutionId: institution._id } },
    { new: true, upsert: true },
  );
  const floor = await Floor.findOneAndUpdate(
    { blockId: block._id, number: 1 },
    { $set: { name: 'First Floor', institutionId: institution._id } },
    { new: true, upsert: true },
  );
  const room1 = await Room.findOneAndUpdate(
    { floorId: floor._id, number: '101' },
    { $set: { type: 'DOUBLE', capacity: 2, hostelId: hostel._id, institutionId: institution._id } },
    { new: true, upsert: true },
  );
  const room2 = await Room.findOneAndUpdate(
    { floorId: floor._id, number: '102' },
    { $set: { type: 'DOUBLE', capacity: 2, hostelId: hostel._id, institutionId: institution._id } },
    { new: true, upsert: true },
  );

  async function upsertBed(room, code, occupant) {
    return Bed.findOneAndUpdate(
      { roomId: room._id, code },
      {
        $set: {
          institutionId: institution._id,
          hostelId: hostel._id,
          occupantId: occupant?._id || null,
          status: occupant ? BED_STATUS.OCCUPIED : BED_STATUS.AVAILABLE,
        },
      },
      { new: true, upsert: true },
    );
  }

  const bed1 = await upsertBed(room1, '101-A', mentorStudent);
  const bed2 = await upsertBed(room1, '101-B', studentOne);
  const bed3 = await upsertBed(room2, '102-A', studentTwo);
  await upsertBed(room2, '102-B', null);

  async function upsertResidency(student, bed) {
    const residency = await Residency.findOneAndUpdate(
      { studentId: student._id, status: 'ACTIVE' },
      { $set: { institutionId: institution._id, hostelId: hostel._id, checkInAt: new Date('2026-07-01') } },
      { new: true, upsert: true },
    );
    await Allocation.findOneAndUpdate(
      { studentId: student._id, status: ALLOCATION_STATUS.ACTIVE },
      {
        $set: {
          institutionId: institution._id,
          residencyId: residency._id,
          hostelId: hostel._id,
          roomId: bed.roomId,
          bedId: bed._id,
          allocatedAt: new Date('2026-07-01'),
        },
      },
      { new: true, upsert: true },
    );
    return residency;
  }

  await upsertResidency(mentorStudent, bed1);
  await upsertResidency(studentOne, bed2);
  await upsertResidency(studentTwo, bed3);

  const mentor = await MentorProfile.findOneAndUpdate(
    { userId: mentorUser._id },
    {
      $set: {
        institutionId: institution._id,
        studentId: mentorStudent._id,
        capacity: 6,
        currentLoad: 2,
        eligibleHostelIds: [hostel._id],
        active: true,
      },
    },
    { new: true, upsert: true },
  );
  for (const mentee of [studentOne, studentTwo]) {
    await MentorAssignment.findOneAndUpdate(
      { menteeId: mentee._id, status: 'ACTIVE' },
      { $set: { institutionId: institution._id, mentorId: mentor._id, hostelId: hostel._id } },
      { new: true, upsert: true },
    );
  }

  const leave = await LeaveRequest.findOneAndUpdate(
    { studentId: studentOne._id, destination: 'Pune' },
    {
      $set: {
        institutionId: institution._id,
        reason: 'Family visit',
        departureDate: new Date(),
        expectedReturnDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        emergencyContact: { name: 'Kulkarni Parent', phone: '9000000102' },
        status: LEAVE_STATUS.APPROVED,
        approvalHistory: [{ action: 'APPROVED', actorId: admin._id, note: 'Seed approval', at: new Date() }],
        actualDeparture: new Date(),
        lateReturn: false,
      },
    },
    { new: true, upsert: true },
  );
  const publicCode = 'SPITGATE01';
  await GatePass.findOneAndUpdate(
    { publicCode },
    {
      $set: {
        institutionId: institution._id,
        studentId: studentOne._id,
        leaveRequestId: leave._id,
        tokenHash: hashToken(randomToken()),
        qrPayload: JSON.stringify({
          kind: 'UNIHOSTEL_GATE_PASS',
          code: publicCode,
          institutionId: String(institution._id),
          studentId: String(studentOne._id),
        }),
        validFrom: new Date(Date.now() - 60 * 60 * 1000),
        validUntil: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        status: 'ACTIVE',
      },
    },
    { new: true, upsert: true },
  );
  await Movement.findOneAndUpdate(
    { studentId: studentOne._id, type: MOVEMENT_TYPE.EXIT },
    {
      $set: {
        institutionId: institution._id,
        verifiedBy: gate._id,
        occurredAt: new Date(),
        note: 'Seeded exit',
      },
    },
    { new: true, upsert: true },
  );

  await Complaint.findOneAndUpdate(
    { studentId: studentTwo._id, category: 'ELECTRICAL' },
    {
      $set: {
        institutionId: institution._id,
        hostelId: hostel._id,
        priority: 'MEDIUM',
        description: 'Tube light in room 102 is flickering.',
        status: COMPLAINT_STATUS.ACKNOWLEDGED,
        timeline: [
          { status: COMPLAINT_STATUS.OPEN, actorId: studentTwoUser._id, note: 'Opened', at: new Date() },
          { status: COMPLAINT_STATUS.ACKNOWLEDGED, actorId: admin._id, note: 'Assigned to electrician', at: new Date() },
        ],
      },
    },
    { new: true, upsert: true },
  );

  await Notice.findOneAndUpdate(
    { institutionId: institution._id, title: 'Hostel orientation' },
    {
      $set: {
        body: 'Welcome to SPIT hostel. Quiet hours begin at 11:00 PM.',
        scope: 'INSTITUTION',
        important: true,
        createdBy: admin._id,
        expiresAt: new Date('2027-01-01'),
      },
    },
    { new: true, upsert: true },
  );

  await MessEnrolment.findOneAndUpdate(
    { studentId: studentOne._id, status: MESS_STATUS.ENROLLED },
    {
      $set: {
        institutionId: institution._id,
        messName: 'SPIT Central Mess',
        plan: 'Full board',
        startDate: new Date('2026-07-01'),
      },
    },
    { new: true, upsert: true },
  );

  return { institution, admin, gate, mentorUser, studentOneUser, studentTwoUser };
}

const runningDirect = process.argv[1] && /seed[/\\]index\.js$/.test(process.argv[1]);
if (runningDirect) {
  const env = getEnv();
  await connectDb(requireMongoUri(env));
  await seedSpit(env);
  console.log('SPIT demonstration data seeded.');
  await disconnectDb();
}
