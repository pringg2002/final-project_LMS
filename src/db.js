const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Connect to the local SQLite file in the root directory
const dbPath = path.resolve(__dirname, "../lms_final_database.sqlite");
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Error opening SQLite database", err.message);
    } else {
        console.log("Connected to the SQLite database.");
    }
});

// Wrapper to mimic mysql2 pool.query so existing code works without changes
const pool = {
    query: (sql, params = []) => {
        return new Promise((resolve, reject) => {
            const trimmedSql = sql.trim().toLowerCase();
            if (trimmedSql.startsWith("select")) {
                db.all(sql, params, (err, rows) => {
                    if (err) reject(err);
                    else resolve([rows]);
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