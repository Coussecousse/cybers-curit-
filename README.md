# Système d'authentification avec 2FA

Projet d'authentification avec double authentification (2FA) en Node.js.   
Permet de créer un compte, se connecter et activer la double authentification avec un QR code.

## Fonctionnalités

- Inscription et connexion
- Mots de passe hashés avec bcrypt
- Double authentification avec QR code
- Codes de secours pour le 2FA (10 codes par utilisateur)
- Base de données SQLite

## Structure du projet

```
├── config/          - Configuration
├── controllers/     - Logique de l'application
├── middleware/      - Middleware d'authentification
├── routes/          - Routes de l'app
├── views/           - Pages HTML (EJS)
├── public/          - CSS
├── database.js      - Base de données
└── server.js        - Serveur principal
```

## Installation

Il faut Node.js installé sur votre machine.

### 1. Télécharger le projet

Cloner ou télécharger le projet, puis ouvrir un terminal dans le dossier.

### 2. Installer les packages

```bash
npm install
```

### 3. Configuration

Copier le fichier `.env.example` en `.env` :
```bash
cp .env.example .env
```

Générer un secret pour les sessions :
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Ouvrir le fichier `.env` et coller le secret généré à la place de `votre_secret_de_session_ici`.

### 4. Lancer l'application

```bash
npm start
```

Aller sur http://localhost:3000

## Utilisation

1. Créer un compte
2. Se connecter
3. Dans le profil, activer le 2FA
4. Scanner le QR code avec Google Authenticator ou une autre app
5. Sauvegarder les codes de secours
6. Se déconnecter et reconnecter pour tester le 2FA

## Technologies

- Node.js + Express
- SQLite (better-sqlite3)
- bcrypt pour les mots de passe
- otplib et qrcode pour le 2FA
- EJS pour les vues
- express-session

## Sécurité

- Mots de passe hashés avec bcrypt
- Codes de secours hashés
- Protection contre les injections SQL
- Validation des données côté serveur
- Sessions avec express-session

## Base de données

La base de données SQLite contient 2 tables :

**users** : stocke les comptes utilisateurs
**backup_codes** : stocke les codes de secours du 2FA
