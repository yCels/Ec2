const express = require('express');
const path = require('path');
const pool = require('./db');

const app = express();

// Nome desta cópia da aplicação (app1 / app2), definido no docker-compose.yml.
// Serve para ver o load balancer do Nginx alternando entre as instâncias.
const INSTANCE = process.env.INSTANCE || 'app';
app.use((req, res, next) => {
  res.set('X-Instance', INSTANCE);
  next();
});

// Health check: o Nginx/monitoramento consulta para saber se a instância está viva
app.get('/health', (req, res) => res.json({ status: 'ok', instance: INSTANCE }));

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Listar todas as tarefas
app.get('/api/tasks', async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM tasks ORDER BY id');
    res.json(rows);
  } catch (err) { next(err); }
});

// Buscar uma tarefa
app.get('/api/tasks/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM tasks WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Tarefa não encontrada' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// Criar tarefa
app.post('/api/tasks', async (req, res, next) => {
  try {
    const { title, description } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ error: 'O título é obrigatório' });
    const { rows } = await pool.query(
      'INSERT INTO tasks (title, description) VALUES ($1, $2) RETURNING *',
      [title.trim(), description || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

// Atualizar tarefa (campos enviados são alterados, os outros mantidos)
app.put('/api/tasks/:id', async (req, res, next) => {
  try {
    const { title, description, done } = req.body;
    if (title !== undefined && !String(title).trim()) {
      return res.status(400).json({ error: 'O título não pode ser vazio' });
    }
    const { rows } = await pool.query(
      `UPDATE tasks SET
         title       = COALESCE($1, title),
         description = COALESCE($2, description),
         done        = COALESCE($3, done),
         updated_at  = NOW()
       WHERE id = $4 RETURNING *`,
      [title?.trim() ?? null, description ?? null, done ?? null, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Tarefa não encontrada' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// Remover tarefa
app.delete('/api/tasks/:id', async (req, res, next) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM tasks WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Tarefa não encontrada' });
    res.status(204).end();
  } catch (err) { next(err); }
});

app.use((err, req, res, next) => {
  console.error(err);
  if (err.code === '22P02') return res.status(400).json({ error: 'ID inválido' });
  res.status(500).json({ error: 'Erro interno do servidor' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`[${INSTANCE}] Servidor rodando em http://localhost:${PORT}`));
