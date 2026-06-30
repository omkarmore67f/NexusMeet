const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema(
  {
    originalName: {
      type: String,
      required: true
    },
    fileName: {
      type: String,
      required: true
    },
    path: {
      type: String,
      required: true // Cloudinary URL or local server relative upload path
    },
    mimeType: {
      type: String
    },
    size: {
      type: Number // Size in bytes
    },
    uploader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    meeting: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Meeting',
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Indexes
fileSchema.index({ meeting: 1 });
fileSchema.index({ uploader: 1 });

module.exports = mongoose.model('File', fileSchema);
