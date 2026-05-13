const express = require('express');
const router = express.Router();
const { run, get, all } = require('../db/init');
const { v4: uuidv4 } = require('uuid');

router.get('/', async (req, res) => {
  try {
    const templates = await all('SELECT * FROM templates ORDER BY created_at DESC');
    res.json(templates.map(t => ({
      ...t,
      variables: t.variables ? JSON.parse(t.variables) : []
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const template = await get('SELECT * FROM templates WHERE id = ?', [req.params.id]);
    if (!template) return res.status(404).json({ error: 'Template not found' });
    res.json({
      ...template,
      variables: template.variables ? JSON.parse(template.variables) : []
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, description, systemPrompt, variables, example } = req.body;
    const id = uuidv4();
    await run(
      'INSERT INTO templates (id, name, description, system_prompt, variables, example) VALUES (?, ?, ?, ?, ?, ?)',
      [id, name, description || '', systemPrompt, JSON.stringify(variables || []), example || '']
    );
    res.status(201).json({ id, name });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const { name, description, systemPrompt, variables, example } = req.body;
    await run(
      'UPDATE templates SET name = ?, description = ?, system_prompt = ?, variables = ?, example = ? WHERE id = ?',
      [name, description, systemPrompt, JSON.stringify(variables || []), example, req.params.id]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await run('DELETE FROM templates WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
