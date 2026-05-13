const axios = require('axios');
const { getDb } = require('../db/init');

const OPENCLAW_BASE_URL = process.env.OPENCLAW_URL || 'http://localhost:8080';

async function chat(message, history = [], templateId = null) {
  let systemPrompt = null;

  if (templateId) {
    const db = getDb();
    const template = db.prepare('SELECT system_prompt FROM templates WHERE id = ?').get(templateId);
    if (template) {
      systemPrompt = template.system_prompt;
    }
  }

  // OpenClaw API placeholder - adjust to actual endpoint
  const response = await axios.post(`${OPENCLAW_BASE_URL}/api/v1/chat`, {
    message,
    history,
    systemPrompt,
    model: 'default'
  }, {
    headers: {
      'Authorization': `Bearer ${process.env.OPENCLAW_API_KEY || ''}`,
      'Content-Type': 'application/json'
    },
    timeout: 60000
  });

  return {
    content: response.data.reply || response.data.content || 'No response',
    usage: response.data.usage || null
  };
}

module.exports = { chat };
