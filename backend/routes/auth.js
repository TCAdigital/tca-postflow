const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Em produção, substituir por banco de dados real (Supabase/PostgreSQL)
// Por ora: usuários em memória para testes
const users = new Map();

router.post('/register', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email e senha obrigatórios.' });
  if (users.has(email)) return res.status(409).json({ error: 'Email já cadastrado.' });

  const hash = await bcrypt.hash(password, 10);
  const user = { id: Date.now().toString(), email, name: name || email, hash, plan: 'free', createdAt: new Date() };
  users.set(email, user);

  const token = jwt.sign({ id: user.id, email, plan: user.plan }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });
  return res.json({ success: true, token, user: { id: user.id, email, name: user.name, plan: user.plan } });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = users.get(email);
  if (!user) return res.status(401).json({ error: 'Email ou senha incorretos.' });

  const valid = await bcrypt.compare(password, user.hash);
  if (!valid) return res.status(401).json({ error: 'Email ou senha incorretos.' });

  const token = jwt.sign({ id: user.id, email, plan: user.plan }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });
  return res.json({ success: true, token, user: { id: user.id, email, name: user.name, plan: user.plan } });
});

router.get('/me', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Token não enviado.' });
  try {
    const payload = jwt.verify(auth.replace('Bearer ', ''), process.env.JWT_SECRET || 'dev-secret');
    const user = users.get(payload.email);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });
    return res.json({ id: user.id, email: user.email, name: user.name, plan: user.plan });
  } catch {
    return res.status(401).json({ error: 'Token inválido.' });
  }
});

module.exports = router;
