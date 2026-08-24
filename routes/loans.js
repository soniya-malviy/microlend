const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const loanController = require('../controllers/loanController');

const router = express.Router();

router.post('/disburse', authMiddleware, loanController.disburse);
router.get('/', authMiddleware, loanController.list);
router.get('/:id', authMiddleware, loanController.getById);

module.exports = router;
