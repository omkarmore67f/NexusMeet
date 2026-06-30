const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema(
  {
    meeting: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Meeting',
      required: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['host', 'cohost', 'participant'],
      default: 'participant'
    },
    status: {
      type: String,
      enum: ['waiting', 'joined', 'left', 'rejected'],
      default: 'joined'
    },
    joinTime: {
      type: Date,
      default: Date.now
    },
    leaveTime: {
      type: Date
    },
    isMuted: {
      type: Boolean,
      default: false
    },
    isCameraOff: {
      type: Boolean,
      default: false
    },
    handRaised: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Indexes for speed query
participantSchema.index({ meeting: 1, user: 1 });
participantSchema.index({ user: 1 });

module.exports = mongoose.model('Participant', participantSchema);
