const express = require('express');
const router = express.Router();
const { run, get, all } = require('../db/init');
const { v4: uuidv4 } = require('uuid');
const embeddingService = require('../services/embedding');

router.get('/', async (req, res) => {
  try {
    const topics = await all(`
      SELECT 
        t.id, t.name, t.embedding, t.created_at, t.updated_at,
        COUNT(m.id) as message_count
      FROM topics t
      LEFT JOIN messages m ON t.id = m.topic_id
      GROUP BY t.id
      ORDER BY t.updated_at DESC
    `);
    res.json(topics.map(t => ({
      ...t,
      embedding: t.embedding ? JSON.parse(t.embedding) : null
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const topic = await get('SELECT * FROM topics WHERE id = ?', [req.params.id]);
    if (!topic) return res.status(404).json({ error: 'Topic not found' });

    const messages = await all(
      'SELECT * FROM messages WHERE topic_id = ? ORDER BY created_at ASC',
      [req.params.id]
    );
    res.json({ ...topic, messages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, message, autoGroup = true } = req.body;

    if (autoGroup && message) {
      const existingTopics = await all('SELECT * FROM topics');
      const embedding = await embeddingService.getEmbedding(message);

      for (const topic of existingTopics) {
        if (!topic.embedding) continue;
        const similarity = embeddingService.cosineSimilarity(
          embedding,
          JSON.parse(topic.embedding)
        );
        if (similarity > 0.82) {
          return res.json({ id: topic.id, name: topic.name, existing: true, similarity });
        }
      }
    }

    const id = uuidv4();
    let embedding = null;
    if (message) {
      const emb = await embeddingService.getEmbedding(message);
      embedding = JSON.stringify(emb);
    }

    await run('INSERT INTO topics (id, name, embedding) VALUES (?, ?, ?)', [id, name || '新话题', embedding]);
    res.status(201).json({ id, name: name || '新话题', existing: false });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const { name } = req.body;
    await run('UPDATE topics SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [name, req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await run('DELETE FROM topics WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id/export', async (req, res) => {
  try {
    const topic = await get('SELECT * FROM topics WHERE id = ?', [req.params.id]);
    if (!topic) return res.status(404).json({ error: 'Topic not found' });

    const messages = await all(
      `SELECT role, content, model, template_id, created_at FROM messages WHERE topic_id = ? ORDER BY created_at ASC`,
      [req.params.id]
    );

    const rows = messages.map((m, i) => ({
      序号: i + 1,
      角色: m.role === 'user' ? '用户' : m.role === 'assistant' ? 'AI' : '系统',
      模型: m.model || '',
      模板: m.template_id || '',
      内容: m.content,
      时间: m.created_at
    }));

    res.setHeader('Content-Disposition', `attachment; filename="topic_${req.params.id}.json"`);
    res.json({ topic: topic.name, messages: rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
