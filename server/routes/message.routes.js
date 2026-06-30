const express = require('express');
const router = express.Router();
const { getMessagesByMeeting } = require('../controllers/message.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/:meetingId', protect, getMessagesByMeeting);

module.exports = router;
