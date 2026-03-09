require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDB } = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check endpoint (no DB required)
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// API Routes
app.use('/api/trips', require('./routes/trips'));
app.use('/api', require('./routes/info'));

// Serve React frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

// Start server immediately so healthcheck passes, then init DB
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  initDB()
    .then(() => console.log('Database ready'))
    .catch((err) => {
      console.error('Failed to initialize database:', err);
      process.exit(1);
    });
});
