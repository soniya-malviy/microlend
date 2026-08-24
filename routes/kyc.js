const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const kycController = require('../controllers/kycController');

const router = express.Router();

router.post('/verify', authMiddleware, kycController.verify);

module.exports = router;
