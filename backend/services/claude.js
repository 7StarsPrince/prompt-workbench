const Anthropic = require('@anthropic-ai/sdk');
const { get } = require('../db/init');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function chat(message, history = [], templateId = null, options = {}) {
  let systemPrompt = 'You are a helpful assistant. Reply in Chinese unless asked otherwise.';

  if (templateId) {
    const template = await get('SELECT system_prompt FROM templates WHERE id = ?', [templateId]);
    if (template) {
      systemPrompt = template.system_prompt;
    }
  }

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
