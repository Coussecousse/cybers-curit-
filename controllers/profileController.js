const { userDB } = require('../database');

// Dashboard
exports.dashboard = (req, res) => {
  const user = userDB.findById(req.session.userId);
  res.render('dashboard', { user });
};

// Profil
exports.profile = (req, res) => {
  const user = userDB.findById(req.session.userId);
  res.render('profile', { 
    user, 
    qrCode: null, 
    backupCodes: null, 
    error: null, 
    success: null, 
    showDisable2FAForm: false 
  });
};

module.exports = exports;
