const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const express = require('express');
const cors = require('cors');
const config = require('./lib/config');
const db = require('./db');
const routes = require('./routes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(
  cors(
    config.corsOrigins.length
      ? { origin: config.corsOrigins }
      : undefined
  )
);

app.use(express.json());

const publicPath = path.join(__dirname, '..', 'public');

app.get('/', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

app.use(express.static(publicPath));
app.use('/api', routes);
app.use('/api', notFound);
app.use(errorHandler);

if (require.main === module) {
  const useHttps = Boolean(
    config.https.keyPath && config.https.certPath
  );

  let server;
  if (useHttps) {
    server = https.createServer(
      {
        key: fs.readFileSync(config.https.keyPath),
        cert: fs.readFileSync(config.https.certPath),
      },
      app
    );
  } else {
    server = http.createServer(app);
  }

  db.query('SELECT 1')
    .then(() => {
      console.log(
        `[db] Connected to ${config.db.database} on ${config.db.host}:${config.db.port}`
      );
    })
    .catch((err) => {
      console.error('[db] Connection FAILED:', err.message);
    })
    .finally(() => {
      server.listen(config.port, () => {
        console.log(
          `Server running at ${
            useHttps ? 'https' : 'http'
          }://localhost:${config.port}`
        );
      });
    });
}

module.exports = app;