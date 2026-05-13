const express = require('express');
const router = express.Router();
const { getDb } = require('../db/init');
const { v4: uuidv4 } = require('uuid');

// List all templates
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const templates = db.prepare('SELECT * FROM templates ORDER BY created_at DESC').all();
    res.json(templates.map(t => ({
      ...t,
      variables: t.variables ? JSON.parse(t.variables) : []
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single template
router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const template = db.prepare('SELECT * FROM templates WHERE id = ?').get(req.params.id);
    if (!template) return res.status(404).json({ error: 'Template not found' });
    res.json({
      ...template,
      variables: template.variables ? JSON.parse(template.variables) : []
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create template
router.post('/', (req, res) => {
  try {
    const { name, description, systemPrompt, variables, example } = req.body;
    const id = uuidv4();
    const db = getDb();
    db.prepare(
      'INSERT INTO templates (id, name, description, system_prompt, variables, example) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, name, description || '', systemPrompt, JSON.stringify(variables || []), example || '');
    res.status(201).json({ id, name });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update template
router.patch('/:id', (req, res) => {
  try {
    const { name, description, systemPrompt, variables, example } = req.body;
    const db = getDb();
    db.prepare(
      'UPDATE templates SET name = ?, description = ?, system_prompt = ?, variables = ?, example = ? WHERE id = ?'
    ).run(name, description, systemPrompt, JSON.stringify(variables || []), example, req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete template
router.delete('/:id', (req, res) => {
  try {
    const db = getDb();
    db.prepare('DELETE FROM templates WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
