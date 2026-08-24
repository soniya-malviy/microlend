const express = require('express');
const webhookController = require('../controllers/webhookController');

const router = express.Router();

// Razorpay server-to-server callback — do not attach authMiddleware
router.post('/razorpay', webhookController.razorpay);

module.exports = router;
