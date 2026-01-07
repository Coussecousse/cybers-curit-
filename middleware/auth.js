const { userDB } = require('../database');

// Vérifier si connecté
const isAuthenticated = (req, res, next) => {
  if (req.session.userId) {
    return next();
  }
  res.redirect('/login');
};

// Vérifier si 2FA validé
const is2FAVerified = (req, res, next) => {
  const user = userDB.findById(req.session.userId);
  
  if (!user) {
    return res.redirect('/login');
  }

  // Si le 2FA n'est pas activé, continuer
  if (!user.two_factor_enabled) {
    return next();
  }

  // Si le 2FA est activé, vérifier s'il a été validé dans cette session
  if (req.session.twoFactorVerified) {
    return next();
  }

  // Rediriger vers la page de vérification 2FA
  res.redirect('/verify-2fa');
};

module.exports = {
  isAuthenticated,
  is2FAVerified
};
