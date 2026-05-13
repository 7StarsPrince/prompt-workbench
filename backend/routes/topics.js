const express = require('express');
const router = express.Router();
const { getDb } = require('../db/init');
const { v4: uuidv4 } = require('uuid');
const embeddingService = require('../services/embedding');

// List all topics with message count
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const topics = db.prepare(`
      SELECT 
        t.id, t.name, t.embedding, t.created_at, t.updated_at,
        COUNT(m.id) as message_count
      FROM topics t
      LEFT JOIN messages m ON t.id = m.topic_id
      GROUP BY t.id
      ORDER BY t.updated_at DESC
    `).all();

    res.json(topics.map(t => ({
      ...t,
      embedding: t.embedding ? JSON.parse(t.embedding) : null
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single topic with messages
router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const topic = db.prepare('SELECT * FROM topics WHERE id = ?').get(req.params.id);
    if (!topic) return res.status(404).json({ error: 'Topic not found' });

    const messages = db.prepare(
      'SELECT * FROM messages WHERE topic_id = ? ORDER BY created_at ASC'
    ).all(req.params.id);

    res.json({ ...topic, messages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create or auto-group topic
router.post('/', async (req, res) => {
  try {
    const { name, message, autoGroup = true } = req.body;
    const db = getDb();

    // Auto-group: find similar existing topic
    if (autoGroup && message) {
      const existingTopics = db.prepare('SELECT * FROM topics').all();
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

    // Create new topic
    const id = uuidv4();
    let embedding = null;
    if (message) {
      const emb = await embeddingService.getEmbedding(message);
      embedding = JSON.stringify(emb);
    }

    db.prepare('INSERT INTO topics (id, name, embedding) VALUES (?, ?, ?)')
      .run(id, name || '新话题', embedding);

    res.status(201).json({ id, name: name || '新话题', existing: false });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update topic name
router.patch('/:id', (req, res) => {
  try {
    const { name } = req.body;
    const db = getDb();
    db.prepare('UPDATE topics SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(name, req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete topic
router.delete('/:id', (req, res) => {
  try {
    const db = getDb();
    db.prepare('DELETE FROM topics WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export topic messages to Excel-compatible JSON
router.get('/:id/export', (req, res) => {
  try {
    const db = getDb();
    const topic = db.prepare('SELECT * FROM topics WHERE id = ?').get(req.params.id);
    if (!topic) return res.status(404).json({ error: 'Topic not found' });

    const messages = db.prepare(
      `SELECT role, content, model, template_id, created_at 
       FROM messages WHERE topic_id = ? ORDER BY created_at ASC`
    ).all(req.params.id);

    // Format for Excel export
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
