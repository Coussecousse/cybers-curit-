const { userDB } = require('../database');

// Page d'inscription
exports.showRegister = (req, res) => {
  res.render('register', { error: null });
};

// Traitement inscription
exports.register = (req, res) => {
  let { username, email, password, confirmPassword } = req.body;

  // Validation des champs requis
  if (!username || !email || !password || !confirmPassword) {
    return res.render('register', { error: 'Tous les champs sont requis' });
  }

  // Nettoyer et valider le nom d'utilisateur
  username = username.trim();
  if (username.length < 3 || username.length > 30) {
    return res.render('register', { error: 'Le nom d\'utilisateur doit contenir entre 3 et 30 caractères' });
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return res.render('register', { error: 'Le nom d\'utilisateur ne peut contenir que des lettres, chiffres, tirets et underscores' });
  }

  // Nettoyer et valider l'email
  email = email.trim().toLowerCase();
  if (email.length > 100) {
    return res.render('register', { error: 'L\'email est trop long' });
  }
  const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
  if (!emailRegex.test(email)) {
    return res.render('register', { error: 'Format d\'email invalide' });
  }

  // Valider la correspondance des mots de passe
  if (password !== confirmPassword) {
    return res.render('register', { error: 'Les mots de passe ne correspondent pas' });
  }

  // Validation robuste du mot de passe
  if (password.length < 8) {
    return res.render('register', { error: 'Le mot de passe doit contenir au moins 8 caractères' });
  }
  if (password.length > 128) {
    return res.render('register', { error: 'Le mot de passe est trop long (maximum 128 caractères)' });
  }
  if (!/[a-z]/.test(password)) {
    return res.render('register', { error: 'Le mot de passe doit contenir au moins une minuscule' });
  }
  if (!/[A-Z]/.test(password)) {
    return res.render('register', { error: 'Le mot de passe doit contenir au moins une majuscule' });
  }
  if (!/\d/.test(password)) {
    return res.render('register', { error: 'Le mot de passe doit contenir au moins un chiffre' });
  }
  if (!/[@$!%*?&#]/.test(password)) {
    return res.render('register', { error: 'Le mot de passe doit contenir au moins un caractère spécial (@$!%*?&#)' });
  }

  // Vérifier les mots de passe communs (liste de base)
  const commonPasswords = ['password', 'Password1!', 'Admin123!', '12345678', 'Azerty123!'];
  if (commonPasswords.some(common => password.toLowerCase().includes(common.toLowerCase()))) {
    return res.render('register', { error: 'Ce mot de passe est trop commun, veuillez en choisir un autre' });
  }

  // Vérifier si l'utilisateur existe déjà
  if (userDB.findByUsername(username)) {
    return res.render('register', { error: 'Ce nom d\'utilisateur existe déjà' });
  }

  if (userDB.findByEmail(email)) {
    return res.render('register', { error: 'Cet email est déjà utilisé' });
  }

  try {
    userDB.create(username, email, password);
    res.redirect('/login?registered=true');
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    res.render('register', { error: 'Erreur lors de l\'inscription. Veuillez réessayer.' });
  }
};

// Page de connexion
exports.showLogin = (req, res) => {
  const message = req.query.registered ? 'Inscription réussie ! Vous pouvez maintenant vous connecter.' : null;
  res.render('login', { error: null, message });
};

// Traitement connexion
exports.login = (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.render('login', { error: 'Tous les champs sont requis', message: null });
  }

  const user = userDB.findByUsername(username);

  if (!user || !userDB.verifyPassword(password, user.password)) {
    return res.render('login', { error: 'Identifiants incorrects', message: null });
  }

  // Authentification réussie
  req.session.userId = user.id;
  req.session.username = user.username;
  
  // Si le 2FA est activé, rediriger vers la page de vérification
  if (user.two_factor_enabled) {
    req.session.twoFactorVerified = false;
    return res.redirect('/verify-2fa');
  }

  // Sinon, accès direct au dashboard
  res.redirect('/dashboard');
};

// Déconnexion
exports.logout = (req, res) => {
  req.session.destroy();
  res.redirect('/login');
};
