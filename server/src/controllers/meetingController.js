const crypto = require('crypto');
const Meeting = require('../models/Meeting');
const User = require('../models/User');

const POPULATE = [
  { path: 'organizer', select: 'name avatarUrl role' },
  { path: 'participant', select: 'name avatarUrl role' }
];

// POST /api/meetings
exports.createMeeting = async (req, res, next) => {
  try {
    const { participantId, title, description, startTime, endTime } = req.body;

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (!(start < end)) {
      return res.status(422).json({ success: false, message: 'End time must be after start time' });
    }
    if (start < new Date()) {
      return res.status(422).json({ success: false, message: 'Meetings cannot be scheduled in the past' });
    }
    if (participantId === req.user._id.toString()) {
      return res.status(422).json({ success: false, message: 'You cannot schedule a meeting with yourself' });
    }

    const participant = await User.findById(participantId);
    if (!participant) {
      return res.status(404).json({ success: false, message: 'Participant not found' });
    }

    // Conflict detection: neither party may be double-booked
    const conflicts = await Meeting.findConflicts([req.user._id, participant._id], start, end);
    if (conflicts.length > 0) {
      const mine = conflicts.some(
        (m) =>
          m.organizer.toString() === req.user._id.toString() ||
          m.participant.toString() === req.user._id.toString()
      );
      return res.status(409).json({
        success: false,
        message: mine
          ? 'You already have a meeting in that time slot'
          : `${participant.name} already has a meeting in that time slot`
      });
    }

    const meeting = await Meeting.create({
      organizer: req.user._id,
      participant: participant._id,
      title,
      description,
      startTime: start,
      endTime: end,
      roomId: crypto.randomBytes(12).toString('hex')
    });
    await meeting.populate(POPULATE);

    res.status(201).json({ success: true, data: { meeting } });
  } catch (err) {
    next(err);
  }
};

// GET /api/meetings?from=&to=&status=
exports.listMeetings = async (req, res, next) => {
  try {
    const filter = {
      $or: [{ organizer: req.user._id }, { participant: req.user._id }]
    };
    if (req.query.status) filter.status = req.query.status;
    if (req.query.from || req.query.to) {
      filter.startTime = {};
      if (req.query.from) filter.startTime.$gte = new Date(req.query.from);
      if (req.query.to) filter.startTime.$lte = new Date(req.query.to);
    }

    const meetings = await Meeting.find(filter).sort({ startTime: 1 }).populate(POPULATE);
    res.json({ success: true, data: { meetings } });
  } catch (err) {
    next(err);
  }
};

// PUT /api/meetings/:id/respond  { status: 'accepted' | 'rejected' }  (invitee only)
exports.respondToMeeting = async (req, res, next) => {
  try {
    const { status } = req.body;

    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }
    if (meeting.participant.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the invitee can respond' });
    }
    if (meeting.status !== 'pending') {
      return res.status(409).json({ success: false, message: `Meeting is already ${meeting.status}` });
    }

    if (status === 'accepted') {
      // Re-check conflicts: other meetings may have been accepted since the invite
      const conflicts = await Meeting.findConflicts(
        [meeting.organizer, meeting.participant],
        meeting.startTime,
        meeting.endTime,
        meeting._id
      );
      if (conflicts.some((m) => m.status === 'accepted')) {
        return res.status(409).json({
          success: false,
          message: 'This slot now conflicts with an accepted meeting'
        });
      }
    }

    meeting.status = status;
    await meeting.save();
    await meeting.populate(POPULATE);

    res.json({ success: true, data: { meeting } });
  } catch (err) {
    next(err);
  }
};

// PUT /api/meetings/:id/cancel  (organizer only)
exports.cancelMeeting = async (req, res, next) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }
    if (meeting.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the organizer can cancel' });
    }
    if (['cancelled', 'rejected'].includes(meeting.status)) {
      return res.status(409).json({ success: false, message: `Meeting is already ${meeting.status}` });
    }

    meeting.status = 'cancelled';
    await meeting.save();
    await meeting.populate(POPULATE);

    res.json({ success: true, data: { meeting } });
  } catch (err) {
    next(err);
  }
};
