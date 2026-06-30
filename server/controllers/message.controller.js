const Message = require('../models/Message');

// @desc    Get all messages for a specific meeting room
// @route   GET /api/messages/:meetingId
// @access  Private
exports.getMessagesByMeeting = async (req, res, next) => {
  try {
    const { meetingId } = req.params;

    const messages = await Message.find({ meeting: meetingId })
      .populate('sender', 'name email avatar')
      .populate('file')
      .sort({ createdAt: 1 });

    res.status(200).json({ success: true, count: messages.length, messages });
  } catch (error) {
    next(error);
  }
};
