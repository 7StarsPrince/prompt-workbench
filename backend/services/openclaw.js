const axios = require('axios');
const { get } = require('../db/init');

const OPENCLAW_BASE_URL = process.env.OPENCLAW_URL || 'http://localhost:8080';

async function chat(message, history = [], templateId = null) {
  let systemPrompt = null;

  if (templateId) {
    const template = await get('SELECT system_prompt FROM templates WHERE id = ?', [templateId]);
    if (template) {
      systemPrompt = template.system_prompt;
    }
  }

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
