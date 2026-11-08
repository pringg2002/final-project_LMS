const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const config = {
  port: Number(process.env.PORT) || 3000,
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'lms_final_database',
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  },
  corsOrigins: (process.env.CORS_ORIGIN || '').split(',').map((s) => s.trim()).filter(Boolean),
  https: {
    keyPath: process.env.SSL_KEY_PATH || '',
    certPath: process.env.SSL_CERT_PATH || '',
  },
};

const weakSecret = !config.jwt.secret || config.jwt.secret === 'your_secret_here';
if (weakSecret) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set to a long random value when NODE_ENV=production');
  }
  console.warn('[config] WARNING: set a real JWT_SECRET in your .env file.');
  config.jwt.secret = config.jwt.secret || 'dev_only_insecure_secret';
}

module.exports = config;