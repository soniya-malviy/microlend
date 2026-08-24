const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const creditController = require('../controllers/creditController');

const router = express.Router();

router.post('/score', authMiddleware, creditController.score);

module.exports = router;
