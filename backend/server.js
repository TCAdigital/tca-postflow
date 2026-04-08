const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const generateRoute = require('./routes/generate');
const authRoute = require('./routes/auth');

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json({ limit: '10mb' }));

// Rate limit: 20 gerações por hora por IP
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { error: 'Muitas requisições. Tente novamente em 1 hora.' }
});
app.use('/api/generate', limiter);

app.use('/api/auth', authRoute);
app.use('/api/generate', generateRoute);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`TCA PostFlow backend rodando na porta ${PORT}`));
