const path = require('path');
const express = require('express');
const cors = require('cors');
const config = require('./lib/config');
const db = require('./db');
const routes = require('./routes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/', (req, res) => {
  res.send('Learning Module System Server is working!');
});

app.use('/api', routes);

app.use('/api', notFound);
app.use(errorHandler);

if (require.main === module) {
  db.query('SELECT 1')
    .then(() => console.log(`[db] Connected to ${config.db.database}`))
    .catch((err) => console.error('[db] Connection FAILED:', err.message))
    .finally(() => {
      app.listen(config.port, () => console.log(`Server running at http://localhost:${config.port}`));
    });
}

module.exports = app;