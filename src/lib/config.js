require('dotenv').config();

const config = {
<<<<<<< HEAD
    port: process.env.PORT || 3000,

    db: {
        dialect: "sqlite",
        storage: "./lms_final_database.sqlite"
    },
=======
  port: Number(process.env.PORT) || 3000,
  db: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'lms_final_database',
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  },
>>>>>>> origin/main
};

if (!config.jwt.secret || config.jwt.secret === 'your_secret_here') {
  console.warn('[config] WARNING: set a real JWT_SECRET in your .env file.');
  config.jwt.secret = config.jwt.secret || 'dev_only_insecure_secret';
}

module.exports = config;
