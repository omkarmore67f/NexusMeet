const File = require('../models/File');
const Message = require('../models/Message');
const path = require('path');
const fs = require('fs');

// @desc    Upload file attachment for meeting
// @route   POST /api/files/upload
// @access  Private
exports.uploadFile = async (req, res, next) => {
  try {
    const { meetingId } = req.body;
    if (!meetingId) {
      return res.status(400).json({ success: false, message: 'Meeting ID is required' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // Determine path based on Cloudinary upload or local Multer upload
    const filePath = req.file.path || req.file.secure_url; 

    // Create file record
    const newFile = await File.create({
      originalName: req.file.originalname,
      fileName: req.file.filename || req.file.originalname,
      path: filePath,
      mimeType: req.file.mimetype,
      size: req.file.size,
      uploader: req.user.id,
      meeting: meetingId
    });

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      file: newFile
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Download / Get local uploaded file
// @route   GET /api/files/download/:fileId
// @access  Private
exports.downloadFile = async (req, res, next) => {
  try {
    const file = await File.findById(req.params.fileId);
    if (!file) {
      return res.status(404).json({ success: false, message: 'File record not found' });
    }

    // If Cloudinary url, redirect to it
    if (file.path.startsWith('http')) {
      return res.redirect(file.path);
    }

    // Local file delivery
    // Note: Local paths are saved in server/uploads/
    const absolutePath = path.resolve(__dirname, '..', 'uploads', file.fileName);

    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ success: false, message: 'Physical file not found on disk' });
    }

    res.download(absolutePath, file.originalName);
  } catch (error) {
    next(error);
  }
};
