require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const kycRoutes = require('./routes/kyc');
const creditRoutes = require('./routes/credit');
const loanRoutes = require('./routes/loans');
const webhookRoutes = require('./routes/webhooks');
const authMiddleware = require('./middleware/authMiddleware');
const { startJobs } = require('./jobs/loanJobs');

const app = express();
const PORT = process.env.PORT || 3000;

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is not set');
  process.exit(1);
}

app.use(cors());

// Raw body required for HMAC signature verification
app.use('/webhooks', express.raw({ type: 'application/json' }), webhookRoutes);
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/kyc', kycRoutes);
app.use('/credit', creditRoutes);
app.use('/loans', loanRoutes);
app.use(express.static(path.join(__dirname, 'public')));

// Example protected route — confirms JWT middleware attaches req.user
app.get('/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

app.listen(PORT, () => {
  console.log(`MicroLend API listening on port ${PORT}`);
  startJobs();
});
