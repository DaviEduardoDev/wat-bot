const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const mediaController = require('../controllers/mediaController');
const reportController = require('../controllers/reportController');

const config = require('../config/config');

// Configuration for Multer
const storageMedia = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, config.MEDIA_DIR)
    },
    filename: function (req, file, cb) {
        const telefone = req.query.telefone || 'unknown';
        const ext = path.extname(file.originalname);
        cb(null, `midia_${telefone}_${Date.now()}${ext}`);
    }
});
const templateController = require('../controllers/templateController');

// ... existing configuration ...
const uploadMedia = multer({
    storage: storageMedia,
    limits: { fileSize: 50 * 1024 * 1024 }
});

router.post('/upload-media', uploadMedia.single('file'), (req, res) => {
    // Access io from app
    const io = req.app.get('io');
    mediaController.handleUpload(req, res, io);
});

// Media Management
// router.get('/media', mediaController.listMedia); // Removed
// router.delete('/media/:filename', mediaController.deleteMedia); // Removed

// Template Management
router.get('/templates', templateController.listTemplates);
router.post('/templates', templateController.createTemplate);
router.delete('/templates/:id', templateController.deleteTemplate);

router.get('/stats', reportController.getStats);

module.exports = router;
