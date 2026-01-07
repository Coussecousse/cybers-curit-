const crypto = require('crypto');
const { authenticator } = require('otplib');
const QRCode = require('qrcode');
const { userDB, backupCodesDB } = require('../database');
const config = require('../config/config');

// Page vérification 2FA
exports.showVerify = (req, res) => {
  const user = userDB.findById(req.session.userId);
  
  if (!user.two_factor_enabled) {
    return res.redirect('/dashboard');
  }

  if (req.session.twoFactorVerified) {
    return res.redirect('/dashboard');
  }

  res.render('verify-2fa', { error: null });
};

// Vérifier le code 2FA
exports.verify = (req, res) => {
  const { code } = req.body;
  const user = userDB.findById(req.session.userId);

  if (!user.two_factor_enabled) {
    return res.redirect('/dashboard');
  }

  // Vérifier le code OTP
  const isValid = authenticator.verify({
    token: code,
    secret: user.two_factor_secret
  });

  if (isValid) {
    req.session.twoFactorVerified = true;
    return res.redirect('/dashboard');
  }

  // Vérifier si c'est un code de secours
  if (backupCodesDB.verify(user.id, code)) {
    req.session.twoFactorVerified = true;
    return res.redirect('/dashboard');
  }

  res.render('verify-2fa', { error: 'Code invalide' });
};

// Générer le QR code pour activer le 2FA
exports.enable = async (req, res) => {
  const user = userDB.findById(req.session.userId);

  if (user.two_factor_enabled) {
    return res.render('profile', { 
      user, 
      qrCode: null, 
      backupCodes: null, 
      error: 'Le 2FA est déjà activé', 
      success: null,
      showDisable2FAForm: false
    });
  }

  // Générer un secret
  const secret = authenticator.generateSecret();
  
  // Générer l'URL pour le QR code
  const otpauthUrl = authenticator.keyuri(user.username, config.appName, secret);
  
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);
    
    // Stocker temporairement le secret dans la session
    req.session.tempSecret = secret;
    
    res.render('profile', { 
      user, 
      qrCode: qrCodeDataUrl, 
      secret: secret,
      backupCodes: null, 
      error: null, 
      success: null,
      showDisable2FAForm: false
    });
  } catch (error) {
    res.render('profile', { 
      user, 
      qrCode: null, 
      backupCodes: null, 
      error: 'Erreur lors de la génération du QR code', 
      success: null,
      showDisable2FAForm: false
    });
  }
};

// Valider et activer le 2FA
exports.validate = (req, res) => {
  const { code } = req.body;
  const user = userDB.findById(req.session.userId);
  const secret = req.session.tempSecret;

  if (!secret) {
    return res.render('profile', { 
      user, 
      qrCode: null, 
      backupCodes: null, 
      error: 'Session expirée. Veuillez recommencer.', 
      success: null,
      showDisable2FAForm: false
    });
  }

  // Vérifier le code OTP
  const isValid = authenticator.verify({
    token: code,
    secret: secret
  });

  if (!isValid) {
    return res.render('profile', { 
      user, 
      qrCode: null, 
      backupCodes: null, 
      error: 'Code invalide. Veuillez réessayer.', 
      success: null,
      showDisable2FAForm: false
    });
  }

  // Activer le 2FA
  userDB.enable2FA(user.id, secret);
  
  // Générer des codes de secours cryptographiquement sécurisés
  const backupCodes = generateBackupCodes(10);
  
  // Sauvegarder les empreintes des codes de secours
  backupCodesDB.create(user.id, backupCodes);
  
  // Nettoyer le secret temporaire
  delete req.session.tempSecret;
  
  // Mettre à jour l'utilisateur
  const updatedUser = userDB.findById(req.session.userId);
  
  res.render('profile', { 
    user: updatedUser, 
    qrCode: null, 
    backupCodes: backupCodes, 
    error: null, 
    success: 'Double authentification activée avec succès !',
    showDisable2FAForm: false
  });
};

// Désactiver le 2FA
exports.disable = (req, res) => {
  const { code } = req.body;
  const user = userDB.findById(req.session.userId);
  
  // Vérifier que le code a été fourni
  if (!code) {
    return res.render('profile', { 
      user, 
      qrCode: null, 
      backupCodes: null, 
      error: 'Veuillez entrer votre code de vérification pour désactiver le 2FA', 
      success: null,
      showDisable2FAForm: true
    });
  }
  
  // Vérifier le code OTP
  const isValid = authenticator.verify({
    token: code,
    secret: user.two_factor_secret
  });
  
  // Si le code OTP n'est pas valide, vérifier si c'est un code de secours
  const isBackupValid = !isValid && backupCodesDB.verify(user.id, code);
  
  if (!isValid && !isBackupValid) {
    return res.render('profile', { 
      user, 
      qrCode: null, 
      backupCodes: null, 
      error: 'Code invalide. Veuillez réessayer.', 
      success: null,
      showDisable2FAForm: true
    });
  }
  
  // Code valide, désactiver le 2FA
  userDB.disable2FA(user.id);
  backupCodesDB.deleteByUserId(user.id);
  
  const updatedUser = userDB.findById(req.session.userId);
  
  res.render('profile', { 
    user: updatedUser, 
    qrCode: null, 
    backupCodes: null, 
    error: null, 
    success: 'Double authentification désactivée avec succès',
    showDisable2FAForm: false
  });
};

// Générer codes de secours
function generateBackupCodes(count) {
  const codes = [];
  for (let i = 0; i < count; i++) {
    let code = '';
    while (code.length < 20) {
      const bytes = crypto.randomBytes(20);
      const chars = bytes.toString('base64')
        .replace(/[^A-Z0-9]/gi, '')
        .toUpperCase();
      code += chars;
    }
    codes.push(code.substring(0, 20));
  }
  return codes;
}

module.exports = exports;
