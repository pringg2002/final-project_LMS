const path = require("path");
const express = require("express");
const cors = require("cors");
const config = require("./lib/config");
const db = require("./db");
const routes = require("./routes");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

app.use("/api", routes);

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Learning Module System is running'
  });
});

app.use("/api", notFound);
app.use(errorHandler);

if (require.main === module) {
  db.query("SELECT 1")
    .then(() => console.log(`Connected to ${config.db.database}`))
    .catch((err) => console.error("Learning Module System Connection FAILED:", err.message))
    .finally(() => {
      app.listen(config.port, () =>
        console.log(`Server running at http://localhost:${config.port}`)
      );
    });
}

module.exports = app;