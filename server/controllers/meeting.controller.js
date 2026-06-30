const Meeting = require('../models/Meeting');
const Participant = require('../models/Participant');

// Helper to generate a code in the format: xxx-xxxx-xxx
const generateMeetingCode = () => {
  const segment1 = Math.random().toString(36).substring(2, 5);
  const segment2 = Math.random().toString(36).substring(2, 6);
  const segment3 = Math.random().toString(36).substring(2, 5);
  return `${segment1}-${segment2}-${segment3}`.toLowerCase();
};

// @desc    Create / Schedule a meeting
// @route   POST /api/meetings
// @access  Private
exports.createMeeting = async (req, res, next) => {
  try {
    const { title, description, startTime, settings } = req.body;

    let meetingCode;
    let isUnique = false;
    let attempts = 0;

    // Retry loop to ensure unique meeting codes
    while (!isUnique && attempts < 10) {
      meetingCode = generateMeetingCode();
      const existing = await Meeting.findOne({ meetingCode });
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    const meeting = await Meeting.create({
      title: title || 'Quick Meeting',
      description,
      meetingCode,
      host: req.user.id,
      startTime: startTime || new Date(),
      status: startTime ? 'scheduled' : 'active',
      settings: settings || {}
    });

    // Create participant record for the host
    await Participant.create({
      meeting: meeting._id,
      user: req.user.id,
      role: 'host',
      status: 'joined',
      joinTime: new Date()
    });

    res.status(201).json({ success: true, meeting });
  } catch (error) {
    next(error);
  }
};

// @desc    Get meeting details by code
// @route   GET /api/meetings/code/:code
// @access  Private
exports.getMeetingByCode = async (req, res, next) => {
  try {
    const { code } = req.params;
    const meeting = await Meeting.findOne({ meetingCode: code.toLowerCase(), status: { $ne: 'ended' } })
      .populate('host', 'name email avatar');

    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Active meeting not found with this code' });
    }

    res.status(200).json({ success: true, meeting });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user's meeting history
// @route   GET /api/meetings/history
// @access  Private
exports.getMeetingHistory = async (req, res, next) => {
  try {
    // Find all meetings where the user participated or hosted
    const participantRecords = await Participant.find({ user: req.user.id });
    const meetingIds = participantRecords.map((p) => p.meeting);

    const meetings = await Meeting.find({
      $or: [
        { host: req.user.id },
        { _id: { $in: meetingIds } }
      ]
    })
      .populate('host', 'name email avatar')
      .sort({ startTime: -1 });

    res.status(200).json({ success: true, meetings });
  } catch (error) {
    next(error);
  }
};

// @desc    End active meeting
// @route   PUT /api/meetings/:id/end
// @access  Private
exports.endMeeting = async (req, res, next) => {
  try {
    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }

    // Only host can end
    if (meeting.host.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only the host can end this meeting' });
    }

    meeting.status = 'ended';
    meeting.endTime = new Date();
    await meeting.save();

    // Set participant leave times
    await Participant.updateMany(
      { meeting: meeting._id, status: 'joined' },
      { status: 'left', leaveTime: new Date() }
    );

    res.status(200).json({ success: true, message: 'Meeting ended successfully', meeting });
  } catch (error) {
    next(error);
  }
};
