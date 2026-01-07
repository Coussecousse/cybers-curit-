const rateLimit = require('express-rate-limit');

// Limiter pour les tentatives de connexion
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives max
  message: 'Trop de tentatives de connexion, réessayez dans 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

// Limiter pour l'inscription
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 3, // 3 inscriptions max par IP
  message: 'Trop de comptes créés, réessayez plus tard',
  standardHeaders: true,
  legacyHeaders: false,
});

// Limiter pour la vérification 2FA
const twoFactorLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 tentatives max
  message: 'Trop de tentatives de vérification, réessayez dans 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  loginLimiter,
  registerLimiter,
  twoFactorLimiter
};
