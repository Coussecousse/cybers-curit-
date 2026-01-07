const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');
const path = require('path');

const db = new Database(path.join(__dirname, 'auth.db'));

// Créer les tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    two_factor_enabled INTEGER DEFAULT 0,
    two_factor_secret TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS backup_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    code_hash TEXT NOT NULL,
    used INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);

// Fonctions pour les utilisateurs
const userDB = {
  create: (username, email, password) => {
    const hashedPassword = bcrypt.hashSync(password, 10);
    const stmt = db.prepare('INSERT INTO users (username, email, password) VALUES (?, ?, ?)');
    const info = stmt.run(username, email, hashedPassword);
    return info.lastInsertRowid;
  },

  findByUsername: (username) => {
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    return stmt.get(username);
  },

  findByEmail: (email) => {
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    return stmt.get(email);
  },

  findById: (id) => {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id);
  },

  enable2FA: (userId, secret) => {
    const stmt = db.prepare('UPDATE users SET two_factor_enabled = 1, two_factor_secret = ? WHERE id = ?');
    return stmt.run(secret, userId);
  },

  disable2FA: (userId) => {
    const stmt = db.prepare('UPDATE users SET two_factor_enabled = 0, two_factor_secret = NULL WHERE id = ?');
    return stmt.run(userId);
  },

  verifyPassword: (plainPassword, hashedPassword) => {
    return bcrypt.compareSync(plainPassword, hashedPassword);
  }
};

// Fonctions pour les codes de secours
const backupCodesDB = {
  create: (userId, codes) => {
    const stmt = db.prepare('INSERT INTO backup_codes (user_id, code_hash) VALUES (?, ?)');
    const insertMany = db.transaction((codes) => {
      for (const code of codes) {
        const hash = bcrypt.hashSync(code, 10);
        stmt.run(userId, hash);
      }
    });
    insertMany(codes);
  },

  getByUserId: (userId) => {
    const stmt = db.prepare('SELECT * FROM backup_codes WHERE user_id = ? AND used = 0');
    return stmt.all(userId);
  },

  verify: (userId, code) => {
    const codes = backupCodesDB.getByUserId(userId);
    for (const backupCode of codes) {
      if (bcrypt.compareSync(code, backupCode.code_hash)) {
        // Supprimer le code de la base de données
        const stmt = db.prepare('DELETE FROM backup_codes WHERE id = ?');
        stmt.run(backupCode.id);
        return true;
      }
    }
    return false;
  },

  deleteByUserId: (userId) => {
    const stmt = db.prepare('DELETE FROM backup_codes WHERE user_id = ?');
    return stmt.run(userId);
  }
};

module.exports = {
  db,
  userDB,
  backupCodesDB
};
