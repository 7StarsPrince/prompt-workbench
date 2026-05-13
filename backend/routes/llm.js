const express = require('express');
const router = express.Router();
const claudeService = require('../services/claude');
const openclawService = require('../services/openclaw');
const { run } = require('../db/init');
const { v4: uuidv4 } = require('uuid');

// Unified LLM chat endpoint
router.post('/chat', async (req, res) => {
  try {
    const { message, model = 'claude', topicId, templateId, history = [] } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    let response;
    const startTime = Date.now();

    switch (model) {
      case 'claude':
        response = await claudeService.chat(message, history, templateId);
        break;
      case 'openclaw':
        response = await openclawService.chat(message, history, templateId);
        break;
      case 'code':
        response = await claudeService.chat(message, history, templateId, { maxTokens: 4096 });
        break;
      default:
        return res.status(400).json({ error: `Unsupported model: ${model}` });
    }

    const latency = Date.now() - startTime;

    if (topicId) {
      const now = new Date().toISOString();
      await run(
        `INSERT INTO messages (id, topic_id, role, content, model, template_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [uuidv4(), topicId, 'user', message, model, templateId || null, now]
      );
      await run(
        `INSERT INTO messages (id, topic_id, role, content, model, template_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [uuidv4(), topicId, 'assistant', response.content, model, templateId || null, now]
      );
    }

    res.json({
      content: response.content,
      model,
      latencyMs: latency,
      usage: response.usage || null,
      topicId: topicId || null
    });

  } catch (error) {
    console.error('LLM chat error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/models', (req, res) => {
  res.json([
    { id: 'claude', name: 'Claude', description: '通用对话与深度分析' },
    { id: 'code', name: 'Claude (Code)', description: '代码生成与调试优化' },
    { id: 'openclaw', name: 'OpenClaw', description: 'OpenClaw Agent集成' }
  ]);
});

module.exports = router;
