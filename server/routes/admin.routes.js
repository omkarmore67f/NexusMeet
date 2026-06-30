const express = require('express');
const router = express.Router();
const { getDashboardStats, getAllUsers, updateUserStatus, getAllMeetings } = require('../controllers/admin.controller');
const { protect, admin } = require('../middleware/auth.middleware');

router.use(protect);
router.use(admin);

router.get('/stats', getDashboardStats);
router.get('/users', getAllUsers);
router.put('/users/:id/status', updateUserStatus);
router.get('/meetings', getAllMeetings);

module.exports = router;
