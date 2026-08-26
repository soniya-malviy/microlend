const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const SALT_ROUNDS = 12;
const JWT_EXPIRES_IN = '7d';
const DEMO_EMAIL = 'recruiter@microlend.demo';
const DEMO_PASSWORD = 'Demo@12345';
const DEMO_NAME = 'Recruiter Demo';
const DEMO_PHONE = '9999999999';

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

// POST /auth/signup
async function signup(req, res) {
  try {
    const { name, email, password, phone } = req.body || {};

    if (
      !isNonEmptyString(name) ||
      !isNonEmptyString(email) ||
      !isNonEmptyString(password) ||
      !isNonEmptyString(phone)
    ) {
      return res.status(400).json({
        error: 'name, email, password, and phone are required',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await User.findByEmail(normalizedEmail);
    if (existing) {
      return res.status(409).json({ error: 'Email is already registered' });
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password_hash,
      phone: phone.trim(),
    });

    const token = signToken(user);

    return res.status(201).json({
      message: 'User created',
      token,
      expiresIn: JWT_EXPIRES_IN,
      user: User.toPublicUser(user),
    });
  } catch (err) {
    // Unique constraint on email (race with the pre-check above)
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Email is already registered' });
    }
    console.error('signup error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// POST /auth/login
async function login(req, res) {
  try {
    const { email, password } = req.body || {};

    if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const user = await User.findByEmail(email.trim().toLowerCase());
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatches) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    let sessionUser = user;
    if (user.email === DEMO_EMAIL) {
      sessionUser = await provisionDemoUser();
    }

    const token = signToken(sessionUser);

    return res.json({
      message: 'Login successful',
      token,
      expiresIn: JWT_EXPIRES_IN,
      user: User.toPublicUser(sessionUser),
    });
  } catch (err) {
    console.error('login error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function provisionDemoUser() {
  const password_hash = await bcrypt.hash(DEMO_PASSWORD, SALT_ROUNDS);
  let user = await User.findByEmail(DEMO_EMAIL);
  if (!user) {
    user = await User.create({
      name: DEMO_NAME,
      email: DEMO_EMAIL,
      password_hash,
      phone: DEMO_PHONE,
    });
  }
  return User.resetSandbox(user.id, {
    name: DEMO_NAME,
    phone: DEMO_PHONE,
    password_hash,
  });
}

// POST /auth/demo — wipes the sandbox account so recruiters always see an empty console
async function demo(req, res) {
  try {
    const user = await provisionDemoUser();
    const token = signToken(user);
    return res.json({
      message: 'Demo session ready',
      token,
      expiresIn: JWT_EXPIRES_IN,
      user: User.toPublicUser(user),
    });
  } catch (err) {
    console.error('demo login error:', err);
    return res.status(500).json({ error: 'Could not start demo session' });
  }
}

module.exports = { signup, login, demo };
