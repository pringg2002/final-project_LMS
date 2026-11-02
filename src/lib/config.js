require('dotenv').config();

const config = {
<<<<<<< HEAD
  port: process.env.PORT || 3000,
=======
  port: Number(process.env.PORT) || 3000,
>>>>>>> origin/main
  db: {
    dialect: "sqlite",
    storage: "./lms_final_database.sqlite"
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback_secret_key',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
<<<<<<< HEAD
  }
=======
  },
>>>>>>> origin/main
};

module.exports = config;