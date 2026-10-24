require("dotenv").config();

const config = {
    port: process.env.PORT || 3000,

    db: {
        host: process.env.DB_HOST || "localhost",
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "",
        database: process.env.DB_NAME || "lms_final_database"
    },

    jwt: {
        secret: process.env.JWT_SECRET || "learning_module_system_secret"
    }
};

module.exports = config;