const express = require('express');
const router = express.Router();
const { run, get, all } = require('../db/init');
const { v4: uuidv4 } = require('uuid');
const openclaw = require('../services/openclaw');
const claudeCode = require('../services/claudeCode');
const embeddingService = require('../services/embedding');

const agents = {
  openclaw: { name: 'OpenClaw', description: '本地 OpenClaw Gateway', service: openclaw },
  'claude-code': { name: 'Claude Code', description: '本地 Claude Code CLI', service: claudeCode }
};

// List available local agents
router.get('/', async (req, res) => {
  const results = [];
  for (const [id, agent] of Object.entries(agents)) {
    const available = await agent.service.isAvailable();
    results.push({ id, name: agent.name, description: agent.description, available });
  }
  res.json(results);
});

// Stream chat with agent (SSE)
router.post('/:agentId/chat', async (req, res) => {
  const { agentId } = req.params;
  const { message, topicId, templateId, history = [] } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const agent = agents[agentId];
  if (!agent) {
    return res.status(404).json({ error: `Agent not found: ${agentId}` });
  }

  const available = await agent.service.isAvailable();
  if (!available) {
    return res.status(503).json({ error: `${agent.name} is not available locally` });
  }

  // Set up SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  let fullResponse = '';

  try {
    // Auto-create or find topic
    let finalTopicId = topicId;
    if (!finalTopicId) {
      const existingTopics = await all('SELECT * FROM topics');
      const embedding = await embeddingService.getEmbedding(message);

      for (const topic of existingTopics) {
        if (!topic.embedding) continue;
        const similarity = embeddingService.cosineSimilarity(
          embedding,
          JSON.parse(topic.embedding)
        );
        if (similarity > 0.82) {
          finalTopicId = topic.id;
          break;
        }
      }

      if (!finalTopicId) {
        finalTopicId = uuidv4();
        await run(
          'INSERT INTO topics (id, name, embedding) VALUES (?, ?, ?)',
          [finalTopicId, message.slice(0, 30) + '...', JSON.stringify(embedding)]
        );
      }
    }

    // Stream response from agent
    await agent.service.chatStream(message, history, (chunk) => {
      fullResponse += chunk;
      res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`);
    });

    // Store messages
    const now = new Date().toISOString();
    await run(
      `INSERT INTO messages (id, topic_id, role, content, model, template_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [uuidv4(), finalTopicId, 'user', message, agentId, templateId || null, now]
    );
    await run(
      `INSERT INTO messages (id, topic_id, role, content, model, template_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [uuidv4(), finalTopicId, 'assistant', fullResponse, agentId, templateId || null, now]
    );

    res.write(`data: ${JSON.stringify({ type: 'done', topicId: finalTopicId })}\n\n`);
    res.end();

  } catch (error) {
    console.error('Agent chat error:', error);
    res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
    res.end();
  }
});

module.exports = router;
