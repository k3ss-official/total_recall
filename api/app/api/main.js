const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

// Import API routes
const chatgptAuthRoutes = require('./endpoints/chatgpt_auth');
const conversationsRoutes = require('./endpoints/conversations');
const processingRoutes = require('./endpoints/processing');
const injectionRoutes = require('./endpoints/injection');

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// API routes
app.use('/api/auth', chatgptAuthRoutes);
app.use('/api/conversations', conversationsRoutes);
app.use('/api/processing', processingRoutes);
app.use('/api/injection', injectionRoutes);

// Serve static frontend files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../frontend/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/build', 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

module.exports = app;
