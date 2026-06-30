const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    meeting: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Meeting',
      required: true
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    messageType: {
      type: String,
      enum: ['text', 'file'],
      default: 'text'
    },
    text: {
      type: String,
      trim: true
    },
    file: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'File'
    }
  },
  {
    timestamps: true
  }
);

// Indexes
messageSchema.index({ meeting: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);
