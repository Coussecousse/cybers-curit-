require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  sessionSecret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
  dbPath: process.env.DB_PATH || './auth.db',
  appName: process.env.APP_NAME || 'MonApplication',
  isDevelopment: process.env.NODE_ENV === 'development',
  session: {
    maxAge: 24 * 60 * 60 * 1000 // 24 heures
  }
};
