const mongoose = require('mongoose');

const whiteboardSchema = new mongoose.Schema(
  {
    meeting: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Meeting',
      required: true,
      unique: true
    },
    elements: {
      type: Array,
      default: [] // Array of drawing element objects: { id, type, points, color, size, text, x, y, width, height }
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Whiteboard', whiteboardSchema);
