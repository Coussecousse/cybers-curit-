const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const twoFactorController = require('../controllers/twoFactorController');
const profileController = require('../controllers/profileController');
const { isAuthenticated, is2FAVerified } = require('../middleware/auth');
const { loginLimiter, registerLimiter, twoFactorLimiter } = require('../middleware/rateLimiter');

// Routes publiques
router.get('/', (req, res) => {
  if (req.session.userId) {
    return res.redirect('/dashboard');
  }
  res.redirect('/login');
});

// Routes d'authentification
router.get('/register', authController.showRegister);
router.post('/register', registerLimiter, authController.register);
router.get('/login', authController.showLogin);
router.post('/login', loginLimiter, authController.login);
router.get('/logout', authController.logout);

// Routes de vérification 2FA
router.get('/verify-2fa', isAuthenticated, twoFactorController.showVerify);
router.post('/verify-2fa', isAuthenticated, twoFactorLimiter, twoFactorController.verify);

// Routes protégées
router.get('/dashboard', isAuthenticated, is2FAVerified, profileController.dashboard);
router.get('/profile', isAuthenticated, is2FAVerified, profileController.profile);

// Routes de gestion 2FA
router.post('/profile/enable-2fa', isAuthenticated, is2FAVerified, twoFactorController.enable);
router.post('/profile/validate-2fa', isAuthenticated, is2FAVerified, twoFactorController.validate);
router.post('/profile/disable-2fa', isAuthenticated, is2FAVerified, twoFactorController.disable);

module.exports = router;
