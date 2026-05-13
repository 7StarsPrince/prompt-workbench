const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const llmRoutes = require('./routes/llm');
const topicRoutes = require('./routes/topics');
const templateRoutes = require('./routes/templates');
const { initDb } = require('./db/init');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize database
initDb();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/llm', llmRoutes);
app.use('/api/topics', topicRoutes);
app.use('/api/templates', templateRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`🖖 Prompt Workbench API running on port ${PORT}`);
});
