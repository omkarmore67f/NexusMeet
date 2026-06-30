const express = require('express');
const router = express.Router();
const { createMeeting, getMeetingByCode, getMeetingHistory, endMeeting } = require('../controllers/meeting.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.post('/', createMeeting);
router.get('/code/:code', getMeetingByCode);
router.get('/history', getMeetingHistory);
router.put('/:id/end', endMeeting);

module.exports = router;
