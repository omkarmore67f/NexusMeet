const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { uploadFile, downloadFile } = require('../controllers/file.controller');
const { protect } = require('../middleware/auth.middleware');
const { isCloudinaryConfigured, cloudinary } = require('../config/cloudinary');

// Create upload directory if not present
const uploadDir = path.resolve(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Local storage rule
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB upload threshold
});

// Middleware checking for Cloudinary upload
const processUpload = async (req, res, next) => {
  if (!req.file) return next();

  if (isCloudinaryConfigured()) {
    try {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'nexusmeet_attachments',
        resource_type: 'auto'
      });
      // Delete local temporary file
      fs.unlinkSync(req.file.path);
      // Inject details into req.file
      req.file.path = result.secure_url;
      req.file.filename = result.public_id;
      next();
    } catch (error) {
      console.error('[File Route] Cloudinary upload failed, falling back to local:', error.message);
      // Fallback to local file delivery
      next();
    }
  } else {
    // Keep local path
    next();
  }
};

router.post('/upload', protect, upload.single('file'), processUpload, uploadFile);
router.get('/download/:fileId', protect, downloadFile);

module.exports = router;
