const User = require('../models/User');
const Meeting = require('../models/Meeting');
const Message = require('../models/Message');
const File = require('../models/File');

// @desc    Get Admin Panel metrics & history
// @route   GET /api/admin/stats
// @access  Private/Admin
exports.getDashboardStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalMeetings = await Meeting.countDocuments();
    const totalMessages = await Message.countDocuments();
    const totalFiles = await File.countDocuments();

    const activeMeetingsCount = await Meeting.countDocuments({ status: 'active' });

    // Recent registrations
    const recentUsers = await User.find()
      .select('name email role status createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    // Recent meetings
    const recentMeetings = await Meeting.find()
      .populate('host', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    // System metrics summary
    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalMeetings,
        totalMessages,
        totalFiles,
        activeMeetings: activeMeetingsCount
      },
      recentUsers,
      recentMeetings
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users list
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: users.length, users });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user status / suspension
// @route   PUT /api/admin/users/:id/status
// @access  Private/Admin
exports.updateUserStatus = async (req, res, next) => {
  try {
    const { status, role } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Prevent suspending self
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot modify your own administrative status' });
    }

    if (status) user.status = status;
    if (role) user.role = role;

    await user.save();

    res.status(200).json({ success: true, message: 'User configuration updated', user });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all meetings list
// @route   GET /api/admin/meetings
// @access  Private/Admin
exports.getAllMeetings = async (req, res, next) => {
  try {
    const meetings = await Meeting.find()
      .populate('host', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: meetings.length, meetings });
  } catch (error) {
    next(error);
  }
};
