require('dotenv').config();

const config = {
  port: Number(process.env.PORT) || 3000,
  db: {
    dialect: "sqlite",
    storage: "./lms_final_database.sqlite"
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback_secret_key',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  },
};

module.exports = config;