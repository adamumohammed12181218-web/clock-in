const express = require('express');
const router  = express.Router();
const { requireAuth } = require('../middleware/auth');
const {
  registerStudent,
  loginStudent,
  loginAdmin,
  getMe,
  registerAdmin
} = require('../controllers/authController');

// POST /api/auth/register          — Student self-registration (captures device)
router.post('/register', registerStudent);

// POST /api/auth/student/login     — Student login via Clock-In ID + device check
router.post('/student/login', loginStudent);

// POST /api/auth/admin/login       — Admin login via username + password only
router.post('/admin/login', loginAdmin);

// GET  /api/auth/me                — Get current user profile (requires token)
router.get('/me', requireAuth, getMe);

// POST /api/auth/admin/register    — Create first admin (one-time setup key)
router.post('/admin/register', registerAdmin);

module.exports = router;
