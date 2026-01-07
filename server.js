const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const config = require('./config/config');
const routes = require('./routes');

const app = express();

// Configuration
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Configuration de session
app.use(session({
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, // Mettre à true en production avec HTTPS
    maxAge: config.session.maxAge
  }
}));

// Routes
app.use('/', routes);

// Démarrer le serveur
app.listen(config.port, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${config.port}`);
  console.log(`📊 Environnement: ${config.isDevelopment ? 'Development' : 'Production'}`);
});
