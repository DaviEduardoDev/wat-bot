const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const verifyToken = require('../middleware/authMiddleware');

// Login Route
router.post('/login', adminController.login);

// Page Route (Public/Check handled by JS)
router.get('/', adminController.serveAdminPage);

// Protected API Routes
router.get('/stats', verifyToken, adminController.getAdminStats);
router.get('/logs', verifyToken, adminController.getSystemLogs); // System Logs
router.post('/action', verifyToken, (req, res) => {
    const io = req.app.get('io');
    adminController.performAdminAction(req, res, io);
});
router.get('/media/:filename', verifyToken, adminController.serveMedia);

module.exports = router;
