const User = require('../models/User');

// @desc    Update user profile details
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { name, email, password, avatar } = req.body;

    if (name) user.name = name;
    if (email) {
      // Check if email already taken
      const emailTaken = await User.findOne({ email, _id: { $ne: req.user.id } });
      if (emailTaken) {
        return res.status(400).json({ success: false, message: 'Email is already taken by another account' });
      }
      user.email = email;
    }
    if (avatar !== undefined) user.avatar = avatar;
    if (password) user.password = password; // Will be hashed in pre-save model hook

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};
