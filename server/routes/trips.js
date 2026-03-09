const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// Get all trips
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM trips ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single trip with tasks and packing items
router.get('/:id', async (req, res) => {
  try {
    const trip = await pool.query('SELECT * FROM trips WHERE id = $1', [req.params.id]);
    if (trip.rows.length === 0) return res.status(404).json({ error: 'Trip not found' });

    const tasks = await pool.query(
      'SELECT * FROM tasks WHERE trip_id = $1 ORDER BY due_date ASC NULLS LAST, created_at ASC',
      [req.params.id]
    );
    const packing = await pool.query(
      'SELECT * FROM packing_items WHERE trip_id = $1 ORDER BY created_at ASC',
      [req.params.id]
    );

    res.json({
      ...trip.rows[0],
      tasks: tasks.rows,
      packingItems: packing.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create trip
router.post('/', async (req, res) => {
  const { destination, country, start_date, end_date } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO trips (destination, country, start_date, end_date) VALUES ($1, $2, $3, $4) RETURNING *',
      [destination, country || null, start_date || null, end_date || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update trip
router.put('/:id', async (req, res) => {
  const { destination, country, start_date, end_date } = req.body;
  try {
    const result = await pool.query(
      'UPDATE trips SET destination=$1, country=$2, start_date=$3, end_date=$4, updated_at=NOW() WHERE id=$5 RETURNING *',
      [destination, country || null, start_date || null, end_date || null, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete trip
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM trips WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- TASKS ---
router.post('/:id/tasks', async (req, res) => {
  const { text, due_date } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO tasks (trip_id, text, due_date) VALUES ($1, $2, $3) RETURNING *',
      [req.params.id, text, due_date || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/tasks/:taskId', async (req, res) => {
  const { text, due_date, completed } = req.body;
  try {
    const result = await pool.query(
      'UPDATE tasks SET text=COALESCE($1,text), due_date=COALESCE($2,due_date), completed=COALESCE($3,completed) WHERE id=$4 AND trip_id=$5 RETURNING *',
      [text, due_date, completed, req.params.taskId, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id/tasks/:taskId', async (req, res) => {
  try {
    await pool.query('DELETE FROM tasks WHERE id=$1 AND trip_id=$2', [req.params.taskId, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- PACKING ITEMS ---
router.post('/:id/packing', async (req, res) => {
  const { text } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO packing_items (trip_id, text) VALUES ($1, $2) RETURNING *',
      [req.params.id, text]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/packing/:itemId', async (req, res) => {
  const { text, checked } = req.body;
  try {
    const result = await pool.query(
      'UPDATE packing_items SET text=COALESCE($1,text), checked=COALESCE($2,checked) WHERE id=$3 AND trip_id=$4 RETURNING *',
      [text, checked, req.params.itemId, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id/packing/:itemId', async (req, res) => {
  try {
    await pool.query('DELETE FROM packing_items WHERE id=$1 AND trip_id=$2', [req.params.itemId, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- COPY CHECKLISTS FROM ANOTHER TRIP ---
router.post('/:id/copy-from/:sourceId', async (req, res) => {
  const { copyTasks, copyPacking } = req.body;
  const targetId = req.params.id;
  const sourceId = req.params.sourceId;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (copyTasks) {
      const tasks = await client.query(
        'SELECT text, due_date FROM tasks WHERE trip_id = $1',
        [sourceId]
      );
      for (const task of tasks.rows) {
        await client.query(
          'INSERT INTO tasks (trip_id, text, due_date) VALUES ($1, $2, $3)',
          [targetId, task.text, task.due_date]
        );
      }
    }

    if (copyPacking) {
      const items = await client.query(
        'SELECT text FROM packing_items WHERE trip_id = $1',
        [sourceId]
      );
      for (const item of items.rows) {
        await client.query(
          'INSERT INTO packing_items (trip_id, text) VALUES ($1, $2)',
          [targetId, item.text]
        );
      }
    }

    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;
