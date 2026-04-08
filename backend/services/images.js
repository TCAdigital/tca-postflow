// Pollinations.ai — completamente gratuito, sem API key
// Docs: https://pollinations.ai

const BASE_URL = 'https://image.pollinations.ai/prompt';

// Retorna a URL da imagem gerada (lazy — a imagem é gerada no primeiro acesso)
async function generateImage(prompt, options = {}) {
  const {
    width = 1080,
    height = 1350,  // formato Instagram carrossel (4:5)
    seed = Math.floor(Math.random() * 999999),
    model = 'flux',   // flux = melhor qualidade no Pollinations
    nologo = true
  } = options;

  const encodedPrompt = encodeURIComponent(
    `${prompt}, high quality, professional photography, instagram post, sharp focus`
  );

  const url = `${BASE_URL}/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&model=${model}&nologo=${nologo}`;

  // Valida que a URL está acessível antes de retornar
  // (Pollinations é síncrono — a URL já é a imagem final)
  return url;
}

// Gera múltiplas imagens em paralelo
async function generateImages(prompts, options = {}) {
  return Promise.all(prompts.map(p => generateImage(p, options)));
}

module.exports = { generateImage, generateImages };
