const express = require('express');
const router = express.Router();
const geminiService = require('../services/gemini');
const imageService = require('../services/images');

// POST /api/generate/carousel
router.post('/carousel', async (req, res) => {
  try {
    console.log('REQUISIÇÃO RECEBIDA:', JSON.stringify(req.body));
    const {
      prompt,
      numSlides = 5,
      imageMode = 'none', // 'none' | 'background' | 'grid' | 'both'
      imageStyle = '',
      instagram = '',
      font = 'Space',
      accentColor = ''
    } = req.body;

    if (!prompt || prompt.trim().length < 10) {
      return res.status(400).json({ error: 'Prompt muito curto. Descreva melhor o conteúdo.' });
    }

    // 1. Gerar estrutura de slides com Gemini
    const slides = await geminiService.generateSlides(prompt, numSlides);

    // 2. Gerar imagens se solicitado
    if (imageMode !== 'none') {
      for (let i = 0; i < slides.length; i++) {
        const shouldGenImage = imageMode === 'grid'
          ? i % 2 === 0
          : true;

        if (shouldGenImage) {
          const imgPrompt = `${imageStyle || 'cinematic, dark, moody, professional'}, related to: ${slides[i].title}`;
          slides[i].imageUrl = await imageService.generateImage(imgPrompt);
        }
      }
    }

    return res.json({
      success: true,
      carousel: {
        slides,
        meta: { instagram, font, accentColor, imageMode }
      }
    });

  } catch (err) {
    console.error('Erro na geração:', err);
    return res.status(500).json({ error: 'Erro ao gerar carrossel. Tente novamente.' });
  }
});

// POST /api/generate/caption
router.post('/caption', async (req, res) => {
  try {
    const { slides, niche = '' } = req.body;
    if (!slides?.length) return res.status(400).json({ error: 'Nenhum slide enviado.' });

    const captionData = await geminiService.generateCaption(slides, niche);
    return res.json({ success: true, caption: captionData.caption, hashtags: captionData.hashtags });
  } catch (err) {
    console.error('Erro na legenda:', err);
    return res.status(500).json({ error: 'Erro ao gerar legenda.' });
  }
});

// POST /api/generate/refine-slide
router.post('/refine-slide', async (req, res) => {
  try {
    const { title, body, instruction } = req.body;
    if (!title || !instruction) return res.status(400).json({ error: 'Dados incompletos.' });

    const refined = await geminiService.refineSlide(title, body, instruction);
    return res.json({ success: true, ...refined });
  } catch (err) {
    console.error('Erro no refinamento:', err);
    return res.status(500).json({ error: 'Erro ao refinar slide.' });
  }
});

module.exports = router;
