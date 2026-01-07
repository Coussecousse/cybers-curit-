const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'auth.db'));

console.log('\n========================================');
console.log('📊 CONTENU DE LA BASE DE DONNÉES');
console.log('========================================\n');

// Afficher tous les utilisateurs
console.log('👥 UTILISATEURS:');
console.log('─────────────────────────────────────────');
const users = db.prepare('SELECT * FROM users').all();
users.forEach(user => {
  console.log(`\nID: ${user.id}`);
  console.log(`Username: ${user.username}`);
  console.log(`Email: ${user.email}`);
  console.log(`2FA activé: ${user.two_factor_enabled ? 'Oui ✓' : 'Non ✗'}`);
  console.log(`2FA secret: ${user.two_factor_secret ? user.two_factor_secret.substring(0, 10) + '...' : 'N/A'}`);
  console.log(`Créé le: ${user.created_at}`);
  console.log('─────────────────────────────────────────');
});

console.log(`\nTotal: ${users.length} utilisateur(s)\n`);

// Afficher tous les codes de secours
console.log('🔑 CODES DE SECOURS:');
console.log('─────────────────────────────────────────');
const backupCodes = db.prepare(`
  SELECT bc.*, u.username 
  FROM backup_codes bc 
  LEFT JOIN users u ON bc.user_id = u.id
`).all();

if (backupCodes.length > 0) {
  backupCodes.forEach(code => {
    console.log(`\nID: ${code.id}`);
    console.log(`Utilisateur: ${code.username}`);
    console.log(`Hash: ${code.code_hash.substring(0, 20)}...`);
    console.log(`Utilisé: ${code.used ? 'Oui ✓' : 'Non ✗'}`);
    console.log(`Créé le: ${code.created_at}`);
    console.log('─────────────────────────────────────────');
  });
  console.log(`\nTotal: ${backupCodes.length} code(s) de secours\n`);
} else {
  console.log('Aucun code de secours\n');
}

// Statistiques
console.log('📈 STATISTIQUES:');
console.log('─────────────────────────────────────────');
const stats = db.prepare(`
  SELECT 
    COUNT(*) as total_users,
    SUM(two_factor_enabled) as users_with_2fa,
    (SELECT COUNT(*) FROM backup_codes WHERE used = 0) as unused_codes,
    (SELECT COUNT(*) FROM backup_codes WHERE used = 1) as used_codes
  FROM users
`).get();

console.log(`Utilisateurs totaux: ${stats.total_users}`);
console.log(`Utilisateurs avec 2FA: ${stats.users_with_2fa}`);
console.log(`Codes de secours non utilisés: ${stats.unused_codes}`);
console.log(`Codes de secours utilisés: ${stats.used_codes}`);
console.log('─────────────────────────────────────────\n');

db.close();
