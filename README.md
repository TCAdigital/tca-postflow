# TCA PostFlow — Gerador de Carrosséis com IA

Sistema completo para geração automática de carrosséis para Instagram usando IA.

---

## Estrutura do projeto

```
tca-postflow/
├── frontend/
│   └── index.html          # App completo (single page, zero dependências)
└── backend/
    ├── server.js            # Servidor Express
    ├── package.json
    ├── .env.example         # Copie para .env e preencha
    ├── routes/
    │   ├── generate.js      # Rotas de geração (carrossel, legenda, refinar)
    │   └── auth.js          # Login e cadastro com JWT
    └── services/
        ├── gemini.js        # Geração de texto (Google Gemini 2.0 Flash)
        └── images.js        # Geração de imagens (Pollinations.ai — gratuito)
```

---

## Passo a passo para rodar localmente

### 1. Instalar Node.js
Baixe em: https://nodejs.org (versão 18 ou superior)

### 2. Obter a chave do Gemini (gratuita)
1. Acesse: https://aistudio.google.com/app/apikey
2. Clique em "Create API Key"
3. Copie a chave gerada

### 3. Configurar o backend
```bash
cd backend
cp .env.example .env
```
Abra o arquivo `.env` e preencha:
```
GEMINI_API_KEY=sua_chave_aqui
```

### 4. Instalar dependências e rodar
```bash
cd backend
npm install
npm run dev
```
O backend estará rodando em: http://localhost:3001

### 5. Abrir o frontend
Abra o arquivo `frontend/index.html` diretamente no navegador.
Ou use o Live Server do VS Code para melhor experiência.

---

## Como usar no sistema

1. Acesse o frontend e clique em **"Entrar com Google"** (login de teste)
2. No Dashboard, clique em **"Criar com IA"**
3. Digite o tema do carrossel (ex: "5 erros que impedem pequenos negócios de crescer")
4. Selecione o número de slides e tipo de imagem
5. Clique em "Continuar" → configure fonte e cor → "Gerar carrossel"
6. Os slides aparecerão no Editor para refinamento
7. Use o painel esquerdo para ajustar cores, fundo, CTA, logo, etc.
8. Clique em "Gerar Legenda" para criar a legenda do post com hashtags
9. Use "⬇ ZIP" para download (integrar html2canvas em produção)

---

## Deploy gratuito para testes

### Backend — Railway (gratuito)
1. Acesse: https://railway.app
2. Clique em "New Project" → "Deploy from GitHub Repo"
3. Suba a pasta `backend` no GitHub
4. Configure as variáveis de ambiente (GEMINI_API_KEY, JWT_SECRET, FRONTEND_URL)
5. Railway gera uma URL pública automaticamente

### Frontend — Netlify (gratuito)
1. Acesse: https://netlify.com
2. Arraste a pasta `frontend` para o painel do Netlify
3. Pronto — URL pública gerada em segundos

### Após deploy
Atualize no `frontend/index.html` a linha:
```javascript
const API = window.location.hostname === 'localhost'
  ? 'http://localhost:3001/api'
  : 'https://SUA-URL-DO-RAILWAY.railway.app/api';
```

---

## Tecnologias utilizadas

| Parte       | Tecnologia            | Custo        |
|-------------|----------------------|-------------|
| Frontend    | HTML/CSS/JS puro     | Gratuito    |
| Backend     | Node.js + Express    | Gratuito    |
| Texto IA    | Google Gemini 2.0 Flash | Gratuito (1.500 req/dia) |
| Imagens IA  | Pollinations.ai      | Gratuito (sem limite) |
| Auth        | JWT (memória)        | Gratuito    |
| Hospedagem  | Railway + Netlify    | Gratuito    |

**Custo total para testar: R$ 0,00**

---

## Próximos passos (produção)

- [ ] Substituir auth em memória por Supabase (banco de dados real)
- [ ] Integrar Stripe ou Pagar.me para pagamentos
- [ ] Adicionar export real de slides com html2canvas + JSZip
- [ ] Upload de imagens com Cloudinary ou Supabase Storage
- [ ] Login Google real com Firebase Auth
- [ ] Página de planos com checkout
- [ ] Painel de admin para gerenciar usuários

---

## Suporte
Em caso de dúvidas sobre instalação, abra uma issue ou entre em contato.
