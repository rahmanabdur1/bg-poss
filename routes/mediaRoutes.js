// routes/mediaRoutes.js
const express = require('express');
const router = express.Router();
const mediaController = require('../controllers/mediaController');

router.post('/super-new-library', mediaController.uploadMedia);
router.get('/super-new-library-list', mediaController.getAllMedia);
router.put('/super-new-library/:id', mediaController.updateMedia);
router.delete('/super-new-library/:id', mediaController.deleteMedia);

module.exports = router;
