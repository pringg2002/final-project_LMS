const sqlite3 = require("sqlite3").verbose();
const path = require("path");

<<<<<<< HEAD
// Connect to the local SQLite file
const dbPath = path.resolve(__dirname, "../lms_final_database.sqlite");
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Error opening SQLite database", err.message);
    } else {
        console.log("Connected to the SQLite database.");
    }
=======
const pool = mysql.createPool({
    host: config.db.host,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
    waitForConnections: true,
    connectionLimit: 10,
    namedPlaceholders: false,
>>>>>>> origin/main
});

// Wrapper to mimic mysql2 pool.query so existing code works without changes
const pool = {
    query: (sql, params = []) => {
        return new Promise((resolve, reject) => {
            const trimmedSql = sql.trim().toLowerCase();
            if (trimmedSql.startsWith("select")) {
                db.all(sql, params, (err, rows) => {
                    if (err) reject(err);
                    else resolve([rows]); // matches mysql2 [rows, fields] format
                });
            } else {
                db.run(sql, params, function (err) {
                    if (err) reject(err);
                    else resolve([{ insertId: this.lastID, affectedRows: this.changes }]);
                });
            }
        });
    }
};

module.exports = pool;