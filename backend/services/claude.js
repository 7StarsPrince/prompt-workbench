const Anthropic = require('@anthropic-ai/sdk');
const { getDb } = require('../db/init');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function chat(message, history = [], templateId = null, options = {}) {
  let systemPrompt = 'You are a helpful assistant. Reply in Chinese unless asked otherwise.';

  // Load template if specified
  if (templateId) {
    const db = getDb();
    const template = db.prepare('SELECT system_prompt FROM templates WHERE id = ?').get(templateId);
    if (template) {
      systemPrompt = template.system_prompt;
    }
  }

  // Convert history to Anthropic format
  const messages = history.map(h => ({
    role: h.role,
    content: h.content
  }));
  messages.push({ role: 'user', content: message });

  const response = await anthropic.messages.create({
    model: 'claude-3-sonnet-20240229',
    max_tokens: options.maxTokens || 2048,
    system: systemPrompt,
    messages
  });

  return {
    content: response.content[0].text,
    usage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens
    }
  };
}

module.exports = { chat };
