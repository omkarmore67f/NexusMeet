const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Meeting title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    meetingCode: {
      type: String,
      required: [true, 'Meeting code is required'],
      unique: true,
      trim: true,
      lowercase: true
    },
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['scheduled', 'active', 'ended'],
      default: 'scheduled'
    },
    startTime: {
      type: Date,
      required: true,
      default: Date.now
    },
    endTime: {
      type: Date
    },
    settings: {
      isMutedByDefault: {
        type: Boolean,
        default: false
      },
      isCameraOffByDefault: {
        type: Boolean,
        default: false
      },
      requireWaitingRoom: {
        type: Boolean,
        default: false
      }
    }
  },
  {
    timestamps: true
  }
);

// Indexes
meetingSchema.index({ host: 1 });
meetingSchema.index({ startTime: -1 });

module.exports = mongoose.model('Meeting', meetingSchema);
