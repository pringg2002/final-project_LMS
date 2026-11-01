require("dotenv").config();

const config = {
    port: process.env.PORT || 3000,

    db: {
        dialect: "sqlite",
        storage: "./lms_final_database.sqlite"
    },
};

module.exports = config;