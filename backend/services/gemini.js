const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

// Gera os slides a partir do prompt do usuário
async function generateSlides(prompt, numSlides) {
  const systemPrompt = `Você é um especialista em criação de conteúdo viral para Instagram.
Crie um carrossel de ${numSlides} slides sobre: "${prompt}".

REGRAS OBRIGATÓRIAS:
- Slide 1: gancho poderoso (título impactante que pare o scroll)
- Slides 2 a ${numSlides - 1}: desenvolvimento com valor real
- Slide final: CTA claro e direto

Responda APENAS com JSON válido, sem markdown, sem texto antes ou depois:
{
  "slides": [
    {
      "title": "TÍTULO EM CAIXA ALTA (máx 6 palavras)",
      "body": "Subtítulo explicativo e persuasivo (máx 30 palavras)",
      "hook": true
    }
  ]
}`;

  try {
    const result = await model.generateContent(systemPrompt);
    const text = result.response.text().trim();
    console.log('Gemini raw response:', text);

    // Remove possível markdown residual
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    if (!parsed.slides || !Array.isArray(parsed.slides)) {
      throw new Error('Resposta inválida do Gemini: campo slides ausente');
    }
    return parsed.slides.slice(0, numSlides);
  } catch (err) {
    console.error('ERRO DETALHADO GEMINI:', err);
    throw err;
  }
}

// Gera legenda + hashtags para o post
async function generateCaption(slides, niche) {
  const slideSummary = slides.map((s, i) => `Slide ${i + 1}: ${s.title}`).join('\n');

  const prompt = `Crie uma legenda para Instagram persuasiva e com CTA para este carrossel.
Nicho: ${niche || 'marketing digital'}
Slides:
${slideSummary}

Responda APENAS com JSON:
{
  "caption": "texto completo da legenda",
  "hashtags": ["hashtag1","hashtag2","hashtag3"]
}`;

  const result = await model.generateContent(prompt);
  const clean = result.response.text().trim().replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}

// Refina um slide específico
async function refineSlide(title, body, instruction) {
  const prompt = `Refine este slide de carrossel Instagram.
Título atual: "${title}"
Corpo atual: "${body}"
Instrução: "${instruction}"

Responda APENAS com JSON:
{
  "title": "novo título",
  "body": "novo corpo"
}`;

  const result = await model.generateContent(prompt);
  const clean = result.response.text().trim().replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}

module.exports = { generateSlides, generateCaption, refineSlide };
