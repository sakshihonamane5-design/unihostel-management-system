import { z } from 'zod';
import { BED_STATUS, ROOM_TYPES } from '../config/constants.js';
import { Block, Floor, Hostel } from '../models/Hostel.js';
import { Bed, Room } from '../models/Room.js';
import { Allocation } from '../models/Residency.js';
import { HttpError } from '../utils/http.js';

export async function occupancyForRoom(roomId) {
  return Allocation.countDocuments({ roomId, status: 'ACTIVE' });
}

export async function createHostel(req, res) {
  const body = z.object({ name: z.string().min(1), code: z.string().min(1), description: z.string().optional() }).parse(req.body);
  const hostel = await Hostel.create({ ...body, code: body.code.toUpperCase(), institutionId: req.user.institutionId });
  res.status(201).json({ hostel });
}

export async function listHostels(req, res) {
  const hostels = await Hostel.find({ institutionId: req.user.institutionId }).sort({ name: 1 });
  res.json({ hostels });
}

export async function createBlock(req, res) {
  const body = z.object({ hostelId: z.string(), name: z.string().min(1), code: z.string().min(1) }).parse(req.body);
  const hostel = await Hostel.findOne({ _id: body.hostelId, institutionId: req.user.institutionId });
  if (!hostel) throw new HttpError(404, 'Hostel not found');
  const block = await Block.create({ ...body, institutionId: req.user.institutionId });
  res.status(201).json({ block });
}

export async function createFloor(req, res) {
  const body = z.object({ blockId: z.string(), number: z.number().int(), name: z.string().min(1) }).parse(req.body);
  const block = await Block.findOne({ _id: body.blockId, institutionId: req.user.institutionId });
  if (!block) throw new HttpError(404, 'Block not found');
  const floor = await Floor.create({ ...body, institutionId: req.user.institutionId });
  res.status(201).json({ floor });
}

export async function createRoom(req, res) {
  const body = z
    .object({
      floorId: z.string(),
      number: z.string().min(1),
      type: z.enum(ROOM_TYPES),
      capacity: z.number().int().positive(),
    })
    .parse(req.body);
  const floor = await Floor.findOne({ _id: body.floorId, institutionId: req.user.institutionId }).lean();
  if (!floor) throw new HttpError(404, 'Floor not found');
  const block = await Block.findById(floor.blockId);
  const room = await Room.create({
    ...body,
    institutionId: req.user.institutionId,
    hostelId: block.hostelId,
  });
  res.status(201).json({ room });
}

export async function createBed(req, res) {
  const body = z.object({ roomId: z.string(), code: z.string().min(1) }).parse(req.body);
  const room = await Room.findOne({ _id: body.roomId, institutionId: req.user.institutionId });
  if (!room) throw new HttpError(404, 'Room not found');
  const existing = await Bed.countDocuments({ roomId: room._id });
  if (existing >= room.capacity) throw new HttpError(400, 'Room already has beds equal to its capacity');
  const bed = await Bed.create({
    institutionId: req.user.institutionId,
    hostelId: room.hostelId,
    roomId: room._id,
    code: body.code,
    status: BED_STATUS.AVAILABLE,
  });
  res.status(201).json({ bed });
}

export async function hostelTree(req, res) {
  const institutionId = req.user.institutionId;
  const hostels = await Hostel.find({ institutionId }).lean();
  const blocks = await Block.find({ institutionId }).lean();
  const floors = await Floor.find({ institutionId }).lean();
  const rooms = await Room.find({ institutionId }).lean();
  const beds = await Bed.find({ institutionId }).lean();
  const occupancy = await Promise.all(
    rooms.map(async (room) => {
      const occupied = await occupancyForRoom(room._id);
      return { ...room, occupied, vacant: room.capacity - occupied };
    }),
  );
  res.json({ hostels, blocks, floors, rooms: occupancy, beds });
}
