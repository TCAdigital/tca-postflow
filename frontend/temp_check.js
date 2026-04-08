
// ─── CONFIG ────────────────────────────────────────────────────────────
const API = window.location.hostname === 'localhost'
  ? 'http://localhost:3001/api'
  : '/api'; // em produção backend e frontend no mesmo domínio

// ─── STATE ─────────────────────────────────────────────────────────────
let user = null;
let token = localStorage.getItem('tca_token') || null;
let slides = [];
let curSl = 0;
let history = JSON.parse(localStorage.getItem('tca_history') || '[]');
let genStep = 1;
let selN = 5, selIO = 0, selF = 0, selC = -1;
let genImageMode = 'none';

const cfg = {
  bgType: 'none', solidColor: '#0f0520',
  gradDir: 'to bottom', gradC1: '#0f0520', gradC2: '#1a0050',
  gridOn: false, gridType: 'none', gridColor: '#ffffff',
  titleColor: '#ffffff', subColor: '#cccccc',
  ctaOn: false, ctaText: 'Saiba mais →', ctaStyle: 'solid', ctaColor: '#7c3aed', ctaAlign: 'left',
  logoOn: false, logoPos: 'top', logoAlign: 'left', logoSize: 28,
  paddingH: 30, paddingV: 40, margin: 24, textAlign: 'center', textPos: 'center',
  overlayOp: 80, overlayType: 'gradient'
};

const PALETTE = ['#ffffff','#a78bfa','#7c3aed','#eab308','#ef4444','#22c55e','#3b82f6','#f97316','#ec4899','#000000'];
const SOLID_PRESETS = ['#000000','#0f0520','#051020','#021508','#150005','#1a1a1a','#1e1b4b','#0c4a6e','#14532d','#450a0a','#431407','#1c1917'];
const GRAD_PRESETS = [['#0f0520','#1a0050'],['#051020','#0c4a6e'],['#021508','#14532d'],['#150005','#450a0a'],['#000000','#1e1b4b'],['#0a0a0a','#431407'],['#1a0030','#0a1a40'],['#001a10','#1a2000'],['#200010','#100020'],['#0d0d0d','#2a2a2a'],['#7c3aed','#0f0520'],['#1d4ed8','#0f0520']];
const FONTS = [{n:'Space',s:'Inter'},{n:'Playfair',s:'DM Sans'},{n:'Syne',s:'Outfit'},{n:'Oswald',s:'Inter'},{n:'Raleway',s:'Playfair'},{n:'Outfit',s:'Geist'}];
const IOPTS = [{i:'🚫',l:'Sem imagens'},{i:'🖼',l:'Só imagem de fundo'},{i:'⊞',l:'Só grade'},{i:'↕',l:'Intercalar'}];
const IOVALS = ['none','background','grid','both'];
const COLORS = ['#eab308','#ef4444','#3b82f6','#22c55e','#f97316','#a855f7','#ec4899','#06b6d4'];

// ─── AUTH ───────────────────────────────────────────────────────────────
async function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pass = document.getElementById('login-pass').value;
  const err = document.getElementById('login-err');
  const btn = document.getElementById('login-btn');
  if (!email || !pass) { showErr(err, 'Preencha e-mail e senha.'); return; }
  btn.textContent = 'Entrando...'; btn.disabled = true;
  try {
    const r = await fetch(`${API}/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass })
    });
    const d = await r.json();
    if (!r.ok) { showErr(err, d.error || 'Erro ao entrar.'); btn.textContent = 'Entrar'; btn.disabled = false; return; }
    loginSuccess(d.token, d.user);
  } catch { showErr(err, 'Sem conexão com o servidor.'); btn.textContent = 'Entrar'; btn.disabled = false; }
}

async function doGoogleLogin() {
  // Para testes: login rápido sem Google real
  toast('Login Google — integre com Firebase Auth ou Supabase em produção. Usando login de teste...');
  setTimeout(async () => {
    const r = await fetch(`${API}/auth/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'teste@tcapostflow.com', password: 'teste123', name: 'Usuário Teste' })
    }).catch(() => null);
    if (r && r.ok) { const d = await r.json(); loginSuccess(d.token, d.user); return; }
    // Se já existe, faz login
    const r2 = await fetch(`${API}/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'teste@tcapostflow.com', password: 'teste123' })
    }).catch(() => null);
    if (r2 && r2.ok) { const d = await r2.json(); loginSuccess(d.token, d.user); }
    else toast('Backend offline. Verifique se o servidor está rodando.', true);
  }, 800);
}

function showRegister() {
  document.getElementById('login-email').value = '';
  document.getElementById('login-pass').value = '';
  const err = document.getElementById('login-err');
  showErr(err, '');
  toast('Para criar conta: preencha e-mail/senha e clique em Entrar — a conta será criada automaticamente se não existir.');
  // simplificado: o register está no mesmo fluxo
  document.getElementById('login-btn').onclick = async function() {
    const email = document.getElementById('login-email').value.trim();
    const pass = document.getElementById('login-pass').value;
    if (!email || !pass) { showErr(err, 'Preencha e-mail e senha.'); return; }
    this.textContent = 'Criando conta...'; this.disabled = true;
    const r = await fetch(`${API}/auth/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass })
    }).catch(() => null);
    if (!r) { showErr(err, 'Sem conexão com o servidor.'); this.textContent = 'Criar conta'; this.disabled = false; return; }
    const d = await r.json();
    if (!r.ok) { showErr(err, d.error || 'Erro ao criar conta.'); this.textContent = 'Criar conta'; this.disabled = false; return; }
    loginSuccess(d.token, d.user);
  };
  document.getElementById('login-btn').textContent = 'Criar conta';
  document.getElementById('login-btn').disabled = false;
}

function loginSuccess(t, u) {
  token = t; user = u;
  localStorage.setItem('tca_token', t);
  document.getElementById('v-login').classList.remove('on');
  document.getElementById('main-nav').style.display = 'flex';
  const initials = u.name ? u.name.slice(0, 2).toUpperCase() : 'US';
  document.getElementById('nav-av').textContent = initials;
  goV('dash');
  updateStats();
  renderHistory();
  renderEditorSide();
  if (!slides.length) slides = [{ t: 'CLIQUE EM CRIAR COM IA', b: 'Use o botão acima para gerar seu primeiro carrossel.', defaultBg: '#0f0520' }];
  renderSlides();
}

function doLogout() {
  token = null; user = null;
  localStorage.removeItem('tca_token');
  ['dash','editor'].forEach(id => document.getElementById('v-'+id).classList.remove('on'));
  document.getElementById('main-nav').style.display = 'none';
  document.getElementById('v-login').classList.add('on');
  document.getElementById('login-btn').textContent = 'Entrar';
  document.getElementById('login-btn').onclick = doLogin;
  document.getElementById('login-btn').disabled = false;
}

async function checkAuth() {
  if (!token) return;
  try {
    const r = await fetch(`${API}/auth/me`, { headers: { Authorization: 'Bearer '+token } });
    if (r.ok) { const u = await r.json(); loginSuccess(token, u); }
    else { localStorage.removeItem('tca_token'); token = null; }
  } catch { /* backend offline, fica no login */ }
}

function showErr(el, msg) {
  el.textContent = msg;
  el.style.display = msg ? 'block' : 'none';
}

// ─── VIEWS ─────────────────────────────────────────────────────────────
function goV(v) {
  ['dash','editor'].forEach(id => {
    document.getElementById('v-'+id).classList.remove('on');
    const ni = document.getElementById('ni-'+id);
    if (ni) ni.classList.remove('on');
  });
  document.getElementById('v-'+v).classList.add('on');
  const ni = document.getElementById('ni-'+v);
  if (ni) ni.classList.add('on');
  if (v === 'editor') { renderEditorSide(); renderSlides(); }
}

// ─── GERAÇÃO ───────────────────────────────────────────────────────────
function openGenModal() { genStep = 1; renderGenModal(); document.getElementById('gen-modal').classList.add('on'); }
function closeGenModal() { document.getElementById('gen-modal').classList.remove('on'); }

function renderGenModal() {
  document.getElementById('md1').classList.toggle('on', genStep === 1);
  document.getElementById('md2').classList.toggle('on', genStep === 2);
  const c = document.getElementById('gen-modal-content');
  if (genStep === 1) {
    c.innerHTML = `
      <div class="mttl">Configurar IA</div>
      <div class="msub">Diga sobre o que é o conteúdo e como quer o carrossel</div>
      <span class="fl">Sobre o que é o conteúdo?</span>
      <textarea class="fta" id="gen-prompt" placeholder="Ex: Crie um carrossel sobre os 5 erros que impedem pequenas empresas de crescer no Instagram"></textarea>
      <span class="fl">Número de slides</span>
      <div class="ngrid">${[1,2,3,4,5,6,7,8,9,10].map(n=>`<button class="nb${n===selN?' on':''}" onclick="selN=${n};this.closest('.ngrid').querySelectorAll('.nb').forEach(b=>b.classList.remove('on'));this.classList.add('on')">${n}</button>`).join('')}</div>
      <span class="fl">Imagens no carrossel</span>
      <div class="iogrid">${IOPTS.map((o,i)=>`<div class="io${i===selIO?' on':''}" onclick="selIO=${i};genImageMode='${IOVALS[i]}';document.querySelectorAll('.io').forEach(x=>x.classList.remove('on'));this.classList.add('on')">${o.i} ${o.l}</div>`).join('')}</div>
      ${selIO>0?`<div class="tgrow2" style="margin-top:8px"><div class="tgm"></div><div><div style="font-size:12px;font-weight:500">Gerar imagens com IA</div><div style="font-size:10px;color:var(--mu2)">Imagens automáticas para cada slide — Pollinations AI (gratuito)</div></div></div>
      <span class="fl">Estilo das imagens (opcional)</span>
      <textarea class="fta" id="gen-img-style" style="min-height:44px" placeholder="Ex: fotografia editorial, tons neutros, sem pessoas..."></textarea>`:''}
      <div class="m-err" id="gen-err"></div>
      <div class="mf"><button class="mbk" onclick="closeGenModal()">Fechar</button><button class="mnx" onclick="goGenStep2()">Continuar →</button></div>`;
  } else {
    c.innerHTML = `
      <div class="mttl">Personalizar</div>
      <div class="msub">Identidade visual do carrossel</div>
      <span class="fl">@ do Instagram (opcional)</span>
      <div style="position:relative;margin-bottom:5px"><span style="position:absolute;left:9px;top:50%;transform:translateY(-50%);color:var(--mu2);font-size:12px">@</span><input id="gen-ig" style="width:100%;background:var(--bg3);border:1px solid var(--bd);border-radius:7px;padding:8px 9px 8px 26px;color:var(--tx);font-size:12px;outline:none" placeholder="seuarroba"></div>
      <span class="fl">Combinação de fontes</span>
      <div class="fgrid">${FONTS.map((f,i)=>`<div class="fo${i===selF?' on':''}" onclick="selF=${i};document.querySelectorAll('.fo').forEach(x=>x.classList.remove('on'));this.classList.add('on')"><div class="fo-n">${f.n}</div><div class="fo-s">${f.s}</div></div>`).join('')}</div>
      <span class="fl">Cor de destaque</span>
      <div class="crow">
        <div class="cdotlg nd${selC===-1?' on':''}" onclick="selC=-1;document.querySelectorAll('.cdotlg').forEach(x=>x.classList.remove('on'));this.classList.add('on')">N</div>
        ${COLORS.map((col,i)=>`<div class="cdotlg${i===selC?' on':''}" style="background:${col}" onclick="selC=${i};document.querySelectorAll('.cdotlg').forEach(x=>x.classList.remove('on'));this.classList.add('on')"></div>`).join('')}
      </div>
      <div class="m-err" id="gen-err2"></div>
      <div class="mf"><button class="mbk" onclick="genStep=1;renderGenModal()">‹ Voltar</button><button class="mnx" id="gen-btn" onclick="doGenerate()">⚙ Gerar carrossel</button></div>`;
  }
}

function goGenStep2() {
  const prompt = document.getElementById('gen-prompt')?.value?.trim();
  const err = document.getElementById('gen-err');
  if (!prompt || prompt.length < 10) { showErr(err, 'Descreva o conteúdo com pelo menos 10 caracteres.'); return; }
  genStep = 2; renderGenModal();
}

async function doGenerate() {
  const btn = document.getElementById('gen-btn');
  const err = document.getElementById('gen-err2');
  btn.textContent = 'Gerando...'; btn.disabled = true;

  // Pega prompt da sessão (armazenado antes de ir pro step 2)
  const promptEl = document.querySelector('#gen-modal-content #gen-prompt') || { value: lastPrompt };
  const prompt = lastPrompt || '';
  const ig = document.getElementById('gen-ig')?.value?.trim() || '';
  const imgStyle = document.getElementById('gen-img-style')?.value?.trim() || '';

  closeGenModal();

  // Anima progresso no dashboard
  const pb = document.getElementById('dash-progress');
  const pbFill = document.getElementById('dash-progress-fill');
  const pbSub = document.getElementById('dash-progress-sub');
  pb.classList.add('on');
  const msgs = ['Analisando o prompt...','Estruturando os slides...','Escrevendo títulos virais...','Criando subtítulos persuasivos...', genImageMode!=='none'?'Gerando imagens com IA...':'Aplicando estilo...','Finalizando carrossel...'];
  let pct = 0, mi = 0;
  const iv = setInterval(() => {
    pct += Math.random() * (genImageMode !== 'none' ? 8 : 18) + 4;
    if (pct > 92) pct = 92;
    pbFill.style.width = pct + '%';
    pbSub.textContent = msgs[Math.min(mi++, msgs.length - 1)];
  }, 500);

  try {
    const r = await fetch(`${API}/generate/carousel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ prompt, numSlides: selN, imageMode: genImageMode, imageStyle: imgStyle, instagram: ig, font: FONTS[selF].n, accentColor: selC >= 0 ? COLORS[selC] : '' })
    });
    const d = await r.json();
    clearInterval(iv);
    pbFill.style.width = '100%';

    if (!r.ok) {
      setTimeout(() => { pb.classList.remove('on'); toast(d.error || 'Erro ao gerar.', true); }, 500);
      return;
    }

    setTimeout(() => {
      pb.classList.remove('on');
      slides = d.carousel.slides.map(s => ({ t: s.title, b: s.body, defaultBg: '#0f0520', imageUrl: s.imageUrl || null }));
      curSl = 0;

      // Salva no histórico
      const h = { id: Date.now(), prompt, slides, createdAt: new Date().toISOString(), numSlides: slides.length };
      history.unshift(h);
      if (history.length > 50) history.pop();
      localStorage.setItem('tca_history', JSON.stringify(history));
      updateStats();
      renderHistory();

      goV('editor');
      toast('✦ Carrossel gerado com sucesso!');
    }, 600);

  } catch (e) {
    clearInterval(iv);
    pb.classList.remove('on');
    toast('Sem conexão com o backend. Verifique se o servidor está rodando.', true);
  }
}

let lastPrompt = '';
function goGenStep2() {
  const prompt = document.getElementById('gen-prompt')?.value?.trim();
  const err = document.getElementById('gen-err');
  if (!prompt || prompt.length < 10) { showErr(err, 'Descreva o conteúdo com pelo menos 10 caracteres.'); return; }
  lastPrompt = prompt;
  genStep = 2; renderGenModal();
}

// ─── LEGENDA ────────────────────────────────────────────────────────────
async function openCaptionModal() {
  document.getElementById('caption-modal').classList.add('on');
  document.getElementById('caption-text').textContent = 'Gerando legenda com IA...';
  document.getElementById('caption-hashtags').innerHTML = '';
  try {
    const r = await fetch(`${API}/generate/caption`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ slides: slides.map(s => ({ title: s.t, body: s.b })) })
    });
    const d = await r.json();
    if (r.ok && d.caption) {
      document.getElementById('caption-text').textContent = d.caption;
      document.getElementById('caption-hashtags').innerHTML = (d.hashtags || []).map(h => `<div class="ht">${h.startsWith('#') ? h : '#'+h}</div>`).join('');
    } else {
      document.getElementById('caption-text').textContent = 'Erro ao gerar legenda.';
    }
  } catch {
    document.getElementById('caption-text').textContent = 'Sem conexão com o backend.';
  }
}

function copyCaption() {
  const cap = document.getElementById('caption-text').textContent;
  const hts = Array.from(document.querySelectorAll('.ht')).map(h => h.textContent).join(' ');
  navigator.clipboard.writeText(cap + '\n\n' + hts).then(() => toast('Legenda copiada!'));
}

async function downloadZip() {
  const btn = document.getElementById('zip-btn');
  const oldText = btn.textContent;
  btn.textContent = 'Renderizando...'; btn.disabled = true;
  toast('Iniciando exportação do carrossel...');
  
  try {
    const zip = new JSZip();
    const area = document.getElementById('slides-area');
    const cards = area.querySelectorAll('.sf');
    
    for (let i = 0; i < cards.length; i++) {
      const canvas = await html2canvas(cards[i], {
        scale: 2, // 2x para melhor qualidade
        useCORS: true,
        backgroundColor: null
      });
      const data = canvas.toDataURL('image/png').split(',')[1];
      zip.file(`slide-${i+1}.png`, data, {base64: true});
    }
    
    const content = await zip.generateAsync({type:"blob"});
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = `carrossel-${Date.now()}.zip`;
    link.click();
    toast('✅ Download do ZIP concluído!');
  } catch (e) {
    console.error(e);
    toast('Erro ao gerar ZIP. Verifique permissões do navegador.', true);
  } finally {
    btn.textContent = oldText; btn.disabled = false;
  }
}

async function downloadCurrentSlide() {
  const area = document.getElementById('slides-area');
  const card = area.querySelectorAll('.sf')[curSl];
  if (!card) return;
  
  toast('Exportando slide...');
  try {
    const canvas = await html2canvas(card, { scale: 2, useCORS: true });
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `slide-${curSl+1}.png`;
    link.click();
    toast('✅ Download do slide concluído!');
  } catch (e) {
    toast('Erro ao exportar slide.', true);
  }
}

// ─── STATS & HISTORY ────────────────────────────────────────────────────
function updateStats() {
  const total = history.length;
  const totalSlides = history.reduce((a, h) => a + (h.numSlides || 0), 0);
  const today = history.filter(h => new Date(h.createdAt).toDateString() === new Date().toDateString()).length;
  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-slides').textContent = totalSlides;
  document.getElementById('stat-today').textContent = today;
  const week = history.filter(h => Date.now() - new Date(h.createdAt) < 7*24*60*60*1000).length;
  document.getElementById('stat-week').textContent = week > 0 ? `+${week} esta semana` : 'nenhum esta semana';
}

function renderHistory() {
  const row = document.getElementById('cc-row');
  if (!history.length) { row.innerHTML = '<div style="font-size:12px;color:var(--mu2);padding:20px 0">Nenhum carrossel gerado ainda. Clique em "Criar com IA" para começar.</div>'; return; }
  const COLORS_BG = [['#0f0030','#200060'],['#001a00','#003300'],['#001020','#002040'],['#150020','#280040'],['#0a0a1e','#1a0050'],['#020a14','#051428']];
  row.innerHTML = history.slice(0, 8).map((h, i) => {
    const [c1, c2] = COLORS_BG[i % COLORS_BG.length];
    const title = h.slides?.[0]?.t || h.prompt?.substring(0, 40).toUpperCase() || 'CARROSSEL';
    const ago = timeAgo(h.createdAt);
    return `<div class="ccard" onclick="loadHistory(${h.id})">
      <div class="cth" style="background:linear-gradient(150deg,${c1},${c2})">
        <div class="cth-chips"><span class="chip">⊞ Minimalista</span><span class="chip">${h.numSlides} slides</span></div>
        <div class="cth-title">${title}</div>
      </div>
      <div class="cbody">
        <div class="cb-t">${title}</div>
        <div class="cb-ago">${ago}</div>
        <div class="cb-prompt"><div class="cb-pl">Prompt usado</div><div class="cb-pt">${h.prompt}</div></div>
        <div class="cb-acts">
          <button class="cb-btn" onclick="event.stopPropagation();loadHistory(${h.id})">↗ Abrir</button>
          <button class="cb-btn" onclick="event.stopPropagation();deleteHistory(${h.id})">🗑</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

function loadHistory(id) {
  const h = history.find(x => x.id === id);
  if (!h) return;
  slides = h.slides.map(s => ({ t: s.t || s.title, b: s.b || s.body, defaultBg: '#0f0520', imageUrl: s.imageUrl || null }));
  curSl = 0;
  goV('editor');
}

function deleteHistory(id) {
  history = history.filter(h => h.id !== id);
  localStorage.setItem('tca_history', JSON.stringify(history));
  updateStats(); renderHistory();
}

function timeAgo(iso) {
  const d = Date.now() - new Date(iso);
  if (d < 60000) return 'agora mesmo';
  if (d < 3600000) return `${Math.floor(d/60000)}min atrás`;
  if (d < 86400000) return `${Math.floor(d/3600000)}h atrás`;
  return `${Math.floor(d/86400000)}d atrás`;
}

// ─── SLIDES ─────────────────────────────────────────────────────────────
function getGridCSS() {
  if (!cfg.gridOn || cfg.gridType === 'none') return '';
  const vgop = document.getElementById('vgop');
  const op = parseInt(vgop?.value || 10) / 100;
  const rgba = `rgba(255,255,255,${op})`;
  const p = { quad:`repeating-linear-gradient(${rgba} 0 1px,transparent 1px 20px),repeating-linear-gradient(90deg,${rgba} 0 1px,transparent 1px 20px)`, dot:`radial-gradient(circle,${rgba} 1px,transparent 1px)`, hz:`repeating-linear-gradient(${rgba} 0 1px,transparent 1px 18px)`, diag:`repeating-linear-gradient(45deg,${rgba} 0 1px,transparent 1px 16px)`, xd:`repeating-linear-gradient(45deg,${rgba} 0 1px,transparent 1px 12px),repeating-linear-gradient(-45deg,${rgba} 0 1px,transparent 1px 12px)` };
  return p[cfg.gridType] || '';
}
function getSlideBg(s) {
  if (cfg.bgType === 'solid') return cfg.solidColor;
  if (cfg.bgType === 'gradient') return `linear-gradient(${cfg.gradDir},${cfg.gradC1},${cfg.gradC2})`;
  return s.defaultBg || '#0f0520';
}
function getSlideHTML(s, i, active) {
  const ph = cfg.paddingH;
  const pv = cfg.paddingV;
  const mg = cfg.margin;
  const ls = cfg.logoSize;
  const gridCSS = getGridCSS();
  const bg = getSlideBg(s);
  const jcLogo = cfg.logoAlign==='center'?'center':cfg.logoAlign==='right'?'flex-end':'flex-start';
  const jcCTA = cfg.ctaAlign==='center'?'center':cfg.ctaAlign==='right'?'flex-end':'flex-start';
  const title = s.t;
  const sub = s.b;
  
  const logoHTML = cfg.logoOn ? `<div style="display:flex;justify-content:${jcLogo};padding:${mg/2}px ${mg}px;width:100%"><div style="height:${ls}px;padding:0 12px;background:rgba(255,255,255,.15);border-radius:6px;display:flex;align-items:center;font-size:${Math.max(10,Math.round(ls*.38))}px;font-weight:700;color:rgba(255,255,255,.9);letter-spacing:.05em">LOGO</div></div>` : '';
  const ctaHTML = cfg.ctaOn ? `<div style="display:flex;justify-content:${jcCTA};margin-top:14px"><div style="font-size:12px;padding:6px 14px;border-radius:6px;font-weight:700;background:${cfg.ctaStyle==='solid'?cfg.ctaColor:'transparent'};border:${cfg.ctaStyle==='outline'?'1px solid '+cfg.ctaColor:'none'};color:${cfg.ctaStyle==='outline'?cfg.ctaColor:'#fff'}">${cfg.ctaText}</div></div>` : '';
  const imgTag = s.imageUrl ? `<img class="s-img" src="${s.imageUrl}" onerror="this.style.display='none'">` : '';

  // Posicionamento do conteúdo
  let contentJC = 'center'; // Vertical
  if (cfg.textPos.includes('Sup')) contentJC = 'flex-start';
  if (cfg.textPos.includes('Inf')) contentJC = 'flex-end';
  if (cfg.textPos === 'center') contentJC = 'center';

  // Sombra Overlay
  const oOp = cfg.overlayOp / 100;
  let overlayCSS = 'none';
  if (cfg.overlayType === 'gradient') overlayCSS = `linear-gradient(to top, rgba(0,0,0,${oOp}) 0%, rgba(0,0,0,0) 70%)`;
  else if (cfg.overlayType === 'top') overlayCSS = `linear-gradient(to bottom, rgba(0,0,0,${oOp}) 0%, rgba(0,0,0,0) 40%), linear-gradient(to top, rgba(0,0,0,${oOp}) 0%, rgba(0,0,0,0) 40%)`;
  else if (cfg.overlayType === 'full') overlayCSS = `rgba(0,0,0,${oOp})`;

  return `<div class="sw${active?' on':''}" onclick="selSl(${i})">
    <div class="sf" style="background:${bg}">
      ${imgTag}
      ${gridCSS?`<div style="position:absolute;inset:0;background-image:${gridCSS};background-size:${cfg.gridType==='dot'?'16px 16px':'auto'};pointer-events:none;z-index:1"></div>`:''}
      ${overlayCSS !== 'none' ? `<div style="position:absolute;inset:0;background:${overlayCSS};pointer-events:none;z-index:2"></div>` : ''}
      <div style="position:absolute;top:0;left:0;right:0;z-index:4">${cfg.logoOn&&cfg.logoPos==='top'?logoHTML:''}</div>
      <div style="position:absolute;top:14px;left:18px;font-size:11px;color:rgba(255,255,255,.6);font-weight:500;z-index:4">@emp.wesleysilva</div>
      <div class="s-content" style="z-index:3; justify-content:${contentJC}">
        <div style="padding:${pv}px ${ph}px; margin:${mg/2}px; text-align:${cfg.textAlign}">
          <div class="s-ttl" style="color:${cfg.titleColor}">${title}</div>
          <div class="s-sub" style="color:${cfg.subColor}">${sub}</div>
          ${ctaHTML}
        </div>
      </div>
      <div style="position:absolute;bottom:0;left:0;right:0;z-index:4">
        ${cfg.logoOn&&cfg.logoPos==='bottom'?logoHTML:''}
        <div class="s-ft" style="padding:10px ${mg}px">
          <span style="font-size:10px;font-weight:500;color:rgba(255,255,255,.5)">TCA PostFlow</span>
          <div class="s-dots">${slides.map((_,j)=>`<div class="sd${j===i?' on':''}"></div>`).join('')}</div>
          <span style="font-size:10px;font-weight:500;color:rgba(255,255,255,.5)">arrasta →</span>
        </div>
      </div>
      <button class="s-del" onclick="event.stopPropagation();rmSl(${i})">✕</button>
    </div>
  </div>`;
}
function renderSlides() {
  const a = document.getElementById('slides-area'); if (!a) return;
  a.innerHTML = slides.map((s, i) => getSlideHTML(s, i, i === curSl)).join('');
  const ctr = document.getElementById('sl-ctr'); if (ctr) ctr.textContent = `Slide ${curSl+1} de ${slides.length}`;
  const zbtn = document.getElementById('zip-btn'); if (zbtn) zbtn.textContent = `⬇ ZIP (${slides.length})`;
  
  // Atualizar inputs da barra lateral se existirem
  const ttl = document.getElementById('ed-ttl'); if (ttl) ttl.value = slides[curSl]?.t || '';
  const sub = document.getElementById('ed-sub'); if (sub) sub.value = slides[curSl]?.b || '';
}
function updateSlides() { renderSlides(); }
function selSl(i) { curSl = i; renderSlides(); }
function prevSl() { if (curSl > 0) { curSl--; renderSlides(); } }
function nextSl() { if (curSl < slides.length - 1) { curSl++; renderSlides(); } }
function addSl() { slides.push({ t: 'NOVO SLIDE', b: 'Edite ou use a IA para gerar.', defaultBg: '#111' }); curSl = slides.length - 1; renderSlides(); }
function delSl() { if (slides.length > 1) { slides.splice(curSl, 1); curSl = Math.min(curSl, slides.length - 1); renderSlides(); } }
function rmSl(i) { if (slides.length > 1) { slides.splice(i, 1); curSl = Math.min(curSl, slides.length - 1); renderSlides(); } }

// ─── EDITOR SIDE ────────────────────────────────────────────────────────
function renderEditorSide() {
  const side = document.getElementById('ed-side'); if (!side) return;
  const SOLID_P = SOLID_PRESETS.map(c => `<div class="bg-swatch${cfg.solidColor===c?' on':''}" style="background:${c}" onclick="selectSolid('${c}')"></div>`).join('');
  const GRAD_P = GRAD_PRESETS.map(([c1,c2]) => `<div class="bg-swatch" style="background:linear-gradient(135deg,${c1},${c2})" onclick="selectGradPreset('${c1}','${c2}')"></div>`).join('');
  const PAL = PALETTE.map(c => `<div class="cdot" style="background:${c}" onclick="setCfgC('titleColor','${c}','title-prev','title-hex')"></div>`).join('');
  const PAL2 = PALETTE.map(c => `<div class="cdot" style="background:${c}" onclick="setCfgC('subColor','${c}','sub-prev','sub-hex')"></div>`).join('');
  const PAL3 = PALETTE.map(c => `<div class="cdot" style="background:${c}" onclick="setCfgC('ctaColor','${c}','cta-prev','cta-hex')"></div>`).join('');

  side.innerHTML = `
  <div class="sec"><div class="sec-hd" onclick="tog(this)"><span class="sec-lbl">Estilo</span><span class="sec-chev open">▾</span></div>
  <div class="sec-body open">
    <button class="eb on" id="e-min" onclick="this.classList.add('on');document.getElementById('e-pro').classList.remove('on')">Minimalista</button>
    <button class="eb" id="e-pro" onclick="this.classList.add('on');document.getElementById('e-min').classList.remove('on')">Profile</button>
  </div></div>
  <div class="sec"><div class="sec-hd" onclick="tog(this)"><span class="sec-lbl">Fundo do Slide</span><span class="sec-chev open">▾</span></div>
  <div class="sec-body open">
    <div class="e2"><button class="eh on" onclick="swBtn(this)">Escuro</button><button class="eh" onclick="swBtn(this)">Claro</button></div>
    <button class="eai" onclick="openGenModal()">✦ Gerar com IA ›</button>
  </div></div>
  <div class="sec"><div class="sec-hd" onclick="tog(this)"><span class="sec-lbl">Cor de Fundo</span><span class="sec-chev open">▾</span></div>
  <div class="sec-body open">
    <span class="sub-lbl" style="margin-top:0">Tipo</span>
    <div class="e3" style="margin-bottom:8px">
      <button class="eh${cfg.bgType==='none'?' on':''}" id="bg-none-btn" onclick="setBgType('none')">Nenhuma</button>
      <button class="eh${cfg.bgType==='solid'?' on':''}" id="bg-solid-btn" onclick="setBgType('solid')">Sólida</button>
      <button class="eh${cfg.bgType==='gradient'?' on':''}" id="bg-grad-btn" onclick="setBgType('gradient')">Degradê</button>
    </div>
    <div id="bg-solid-opts" style="display:${cfg.bgType==='solid'?'block':'none'}">
      <span class="sub-lbl">Presets</span><div class="bg-presets">${SOLID_P}</div>
      <span class="sub-lbl">Personalizada</span>
      <div class="color-row"><input class="color-hex" id="solid-hex" value="${cfg.solidColor}" oninput="setSolidCustom(this.value)"><div class="color-preview" id="solid-prev" style="background:${cfg.solidColor}" onclick="document.getElementById('solid-native').click()"></div><input type="color" id="solid-native" style="display:none;width:0;height:0;opacity:0" value="${cfg.solidColor}" oninput="setSolidFromNative(this.value)"></div>
    </div>
    <div id="bg-grad-opts" style="display:${cfg.bgType==='gradient'?'block':'none'}">
      <span class="sub-lbl">Direção</span>
      <div class="grad-dirs">
        <button class="gd${cfg.gradDir==='to bottom'?' on':''}" onclick="setGradDir('to bottom')">▼ Baixo</button>
        <button class="gd${cfg.gradDir==='to right'?' on':''}" onclick="setGradDir('to right')">▶ Dir.</button>
        <button class="gd${cfg.gradDir==='135deg'?' on':''}" onclick="setGradDir('135deg')">↘ Diag.</button>
        <button class="gd${cfg.gradDir==='45deg'?' on':''}" onclick="setGradDir('45deg')">↗ Diag.</button>
      </div>
      <span class="sub-lbl">Cor inicial</span>
      <div class="color-row"><input class="color-hex" id="grad-c1" value="${cfg.gradC1}" oninput="setGradColor(1,this.value)"><div class="color-preview" id="grad-p1" style="background:${cfg.gradC1}" onclick="document.getElementById('grad-n1').click()"></div><input type="color" id="grad-n1" style="display:none;width:0;height:0;opacity:0" value="${cfg.gradC1}" oninput="setGradFromNative(1,this.value)"></div>
      <span class="sub-lbl">Cor final</span>
      <div class="color-row"><input class="color-hex" id="grad-c2" value="${cfg.gradC2}" oninput="setGradColor(2,this.value)"><div class="color-preview" id="grad-p2" style="background:${cfg.gradC2}" onclick="document.getElementById('grad-n2').click()"></div><input type="color" id="grad-n2" style="display:none;width:0;height:0;opacity:0" value="${cfg.gradC2}" oninput="setGradFromNative(2,this.value)"></div>
      <span class="sub-lbl">Presets</span><div class="bg-presets">${GRAD_P}</div>
    </div>
  </div></div>
  <div class="sec"><div class="sec-hd" onclick="tog(this)"><span class="sec-lbl">Imagem de Fundo</span><span class="sec-chev">▾</span></div>
  <div class="sec-body">
    <div class="eup" onclick="toast('Upload de imagem — integre file input em produção')">Clique ou arraste<br><span style="font-size:9px">JPG, PNG, WebP</span></div>
    <button class="esm" onclick="generateSlideImage()">✦ Gerar imagem com IA</button>
    <div class="row" style="margin-top:6px"><span class="row-lbl">Posição X</span><span class="row-val" id="vx">50</span></div>
    <input type="range" class="sl" min="0" max="100" value="50" step="1" oninput="document.getElementById('vx').textContent=this.value">
    <div class="row"><span class="row-lbl">Posição Y</span><span class="row-val" id="vy">50</span></div>
    <input type="range" class="sl" min="0" max="100" value="50" step="1" oninput="document.getElementById('vy').textContent=this.value">
    <div class="row"><span class="row-lbl">Zoom %</span><span class="row-val" id="vz">175</span></div>
    <input type="range" class="sl" min="50" max="300" value="175" step="1" oninput="document.getElementById('vz').textContent=this.value">
  </div></div>
  <div class="sec"><div class="sec-hd" onclick="tog(this)"><span class="sec-lbl">Sombra / Overlay</span><span class="sec-chev">▾</span></div>
  <div class="sec-body">
    <select class="esel" onchange="cfg.overlayType=this.value;updateSlides()">
      <option value="gradient"${cfg.overlayType==='gradient'?' selected':''}>Degradê Inferior</option>
      <option value="top"${cfg.overlayType==='top'?' selected':''}>Topo Intenso (Duplo Degradê)</option>
      <option value="full"${cfg.overlayType==='full'?' selected':''}>Sólida Translúcida</option>
      <option value="none"${cfg.overlayType==='none'?' selected':''}>Nenhuma</option>
    </select>
    <div class="row"><span class="row-lbl">Opacidade</span><span class="row-val" id="vop">${cfg.overlayOp}</span></div>
    <input type="range" class="sl" min="0" max="100" value="${cfg.overlayOp}" step="1" oninput="cfg.overlayOp=parseInt(this.value);document.getElementById('vop').textContent=this.value;updateSlides()">
  </div></div>
  <div class="sec"><div class="sec-hd" onclick="tog(this)"><span class="sec-lbl">Grade de Fundo</span><span class="sec-chev">▾</span></div>
  <div class="sec-body">
    <div class="tg-row"><span class="tg-lbl">Exibir grade</span><div class="tg${cfg.gridOn?' on':''}" id="grid-tg" onclick="toggleGrid()"></div></div>
    <div id="grid-opts" style="display:${cfg.gridOn?'block':'none'}">
      <button class="eb${cfg.gridType==='none'?' on':''}" onclick="setGrid(this,'none')">Nenhuma</button>
      <button class="eb${cfg.gridType==='quad'?' on':''}" onclick="setGrid(this,'quad')">Grade (quadriculado)</button>
      <button class="eb${cfg.gridType==='dot'?' on':''}" onclick="setGrid(this,'dot')">Bolinhas</button>
      <button class="eb${cfg.gridType==='hz'?' on':''}" onclick="setGrid(this,'hz')">Linhas horizontais</button>
      <button class="eb${cfg.gridType==='diag'?' on':''}" onclick="setGrid(this,'diag')">Linhas diagonais</button>
      <button class="eb${cfg.gridType==='xd'?' on':''}" onclick="setGrid(this,'xd')">Xadrez diagonal</button>
      <span class="sub-lbl">Cor da grade</span>
      <div class="color-row"><input class="color-hex" id="grid-hex" value="${cfg.gridColor}" oninput="cfg.gridColor=this.value;document.getElementById('grid-prev').style.background=this.value;updateSlides()"><div class="color-preview" id="grid-prev" style="background:${cfg.gridColor}"></div></div>
      <div class="row"><span class="row-lbl">Opacidade</span><span class="row-val" id="vgop">10</span></div>
      <input type="range" class="sl" min="2" max="40" value="10" step="1" oninput="document.getElementById('vgop').textContent=this.value;updateSlides()">
    </div>
  </div></div>
  <div class="sec"><div class="sec-hd" onclick="tog(this)"><span class="sec-lbl">Título & Subtítulo</span><span class="sec-chev open">▾</span></div>
  <div class="sec-body open">
    <span class="sub-lbl" style="margin-top:0">Posição</span>
    <div class="lg9" id="pos-grid">
      <button class="lgb${cfg.textPos==='Sup. Esq.'?' on':''}" onclick="setPos('Sup. Esq.')">Sup. Esq.</button>
      <button class="lgb${cfg.textPos==='Sup. Cen.'?' on':''}" onclick="setPos('Sup. Cen.')">Sup. Cen.</button>
      <button class="lgb${cfg.textPos==='Sup. Dir.'?' on':''}" onclick="setPos('Sup. Dir.')">Sup. Dir.</button>
      <button class="lgb${cfg.textPos==='Mei. Esq.'?' on':''}" onclick="setPos('Mei. Esq.')">Mei. Esq.</button>
      <button class="lgb${cfg.textPos==='center'?' on':''}" onclick="setPos('center')">Meio</button>
      <button class="lgb${cfg.textPos==='Mei. Dir.'?' on':''}" onclick="setPos('Mei. Dir.')">Mei. Dir.</button>
      <button class="lgb${cfg.textPos==='Inf. Esq.'?' on':''}" onclick="setPos('Inf. Esq.')">Inf. Esq.</button>
      <button class="lgb${cfg.textPos==='Inf. Cen.'?' on':''}" onclick="setPos('Inf. Cen.')">Inf. Cen.</button>
      <button class="lgb${cfg.textPos==='Inf. Dir.'?' on':''}" onclick="setPos('Inf. Dir.')">Inf. Dir.</button>
    </div>
    <span class="sub-lbl">Alinhamento</span>
    <div class="e3" style="margin-bottom:8px">
      <button class="eh${cfg.textAlign==='left'?' on':''}" onclick="setAlign('left')">Esq.</button>
      <button class="eh${cfg.textAlign==='center'?' on':''}" onclick="setAlign('center')">Centro</button>
      <button class="eh${cfg.textAlign==='right'?' on':''}" onclick="setAlign('right')">Dir.</button>
    </div>
    <span class="sub-lbl">Respiro interno (px)</span>
    <div class="row"><span class="row-lbl">Padding horizontal</span><span class="row-val" id="vph">${cfg.paddingH}</span></div>
    <input type="range" class="sl" min="0" max="100" value="${cfg.paddingH}" step="1" oninput="cfg.paddingH=parseInt(this.value);document.getElementById('vph').textContent=this.value;updateSlides()">
    <div class="row"><span class="row-lbl">Padding vertical</span><span class="row-val" id="vpv">${cfg.paddingV}</span></div>
    <input type="range" class="sl" min="0" max="100" value="${cfg.paddingV}" step="1" oninput="cfg.paddingV=parseInt(this.value);document.getElementById('vpv').textContent=this.value;updateSlides()">
    <div class="row"><span class="row-lbl">Margem das bordas</span><span class="row-val" id="vmg">${cfg.margin}</span></div>
    <input type="range" class="sl" min="0" max="80" value="${cfg.margin}" step="1" oninput="cfg.margin=parseInt(this.value);document.getElementById('vmg').textContent=this.value;updateSlides()">
    <span class="sub-lbl">Cor do título</span>
    <div class="cpick">${PAL}</div>
    <div class="color-row"><input class="color-hex" id="title-hex" value="${cfg.titleColor}" oninput="setCfgC('titleColor',this.value,'title-prev',null)"><div class="color-preview" id="title-prev" style="background:${cfg.titleColor}" onclick="document.getElementById('title-native').click()"></div><input type="color" id="title-native" style="display:none;width:0;height:0;opacity:0" value="${cfg.titleColor}" oninput="setCfgC('titleColor',this.value,'title-prev','title-hex')"></div>
    <span class="sub-lbl">Cor do subtítulo</span>
    <div class="cpick">${PAL2}</div>
    <div class="color-row"><input class="color-hex" id="sub-hex" value="${cfg.subColor}" oninput="setCfgC('subColor',this.value,'sub-prev',null)"><div class="color-preview" id="sub-prev" style="background:${cfg.subColor}" onclick="document.getElementById('sub-native').click()"></div><input type="color" id="sub-native" style="display:none;width:0;height:0;opacity:0" value="${cfg.subColor}" oninput="setCfgC('subColor',this.value,'sub-prev','sub-hex')"></div>
    <span class="sub-lbl">Título</span>
    <textarea class="eta" rows="2" id="ed-ttl" oninput="slides[curSl].t=this.value;updateSlides()">${slides[curSl]?.t||''}</textarea>
    <span class="sub-lbl">Subtítulo</span>
    <textarea class="eta" rows="3" id="ed-sub" oninput="slides[curSl].b=this.value;updateSlides()">${slides[curSl]?.b||''}</textarea>
    <button class="eref" onclick="refineSlide()">✦ Refinar este slide com IA</button>
  </div></div>
  <div class="sec"><div class="sec-hd" onclick="tog(this)"><span class="sec-lbl">Botão CTA</span><span class="sec-chev open">▾</span></div>
  <div class="sec-body open">
    <div class="tg-row"><span class="tg-lbl">Exibir botão CTA</span><div class="tg${cfg.ctaOn?' on':''}" id="cta-toggle" onclick="toggleCTA()"></div></div>
    <div id="cta-opts" style="display:${cfg.ctaOn?'block':'none'}">
      <span class="sub-lbl">Texto</span><input class="einp" id="cta-text" value="${cfg.ctaText}" oninput="cfg.ctaText=this.value;updateSlides()">
      <span class="sub-lbl">Estilo</span>
      <div class="e2" style="margin-bottom:8px"><button class="eh${cfg.ctaStyle==='solid'?' on':''}" id="cta-solid" onclick="setCTAStyle('solid')">Preenchido</button><button class="eh${cfg.ctaStyle==='outline'?' on':''}" id="cta-outline" onclick="setCTAStyle('outline')">Contorno</button></div>
      <span class="sub-lbl">Cor</span>
      <div class="cpick">${PAL3}</div>
      <div class="color-row"><input class="color-hex" id="cta-hex" value="${cfg.ctaColor}" oninput="setCfgC('ctaColor',this.value,'cta-prev',null)"><div class="color-preview" id="cta-prev" style="background:${cfg.ctaColor}" onclick="document.getElementById('cta-native').click()"></div><input type="color" id="cta-native" style="display:none;width:0;height:0;opacity:0" value="${cfg.ctaColor}" oninput="setCfgC('ctaColor',this.value,'cta-prev','cta-hex')"></div>
      <span class="sub-lbl">Alinhamento</span>
      <div class="e3" style="margin-bottom:0"><button class="eh${cfg.ctaAlign==='left'?' on':''}" id="cta-al-l" onclick="setCTAAlign('left')">Esq.</button><button class="eh${cfg.ctaAlign==='center'?' on':''}" id="cta-al-c" onclick="setCTAAlign('center')">Centro</button><button class="eh${cfg.ctaAlign==='right'?' on':''}" id="cta-al-r" onclick="setCTAAlign('right')">Dir.</button></div>
    </div>
  </div></div>
  <div class="sec"><div class="sec-hd" onclick="tog(this)"><span class="sec-lbl">Logo da Empresa</span><span class="sec-chev open">▾</span></div>
  <div class="sec-body open">
    <div class="tg-row"><span class="tg-lbl">Exibir logo</span><div class="tg${cfg.logoOn?' on':''}" id="logo-toggle" onclick="toggleLogo()"></div></div>
    <div id="logo-opts" style="display:${cfg.logoOn?'block':'none'}">
      <div class="eup" onclick="toast('Upload de logo — integre file input em produção')">Enviar logo<br><span style="font-size:9px">PNG com fundo transparente</span></div>
      <span class="sub-lbl">Posição</span>
      <div class="e2" style="margin-bottom:6px"><button class="eh${cfg.logoPos==='top'?' on':''}" id="logo-top" onclick="setLogoPos('top')">Topo</button><button class="eh${cfg.logoPos==='bottom'?' on':''}" id="logo-bot" onclick="setLogoPos('bottom')">Rodapé</button></div>
      <span class="sub-lbl">Alinhamento</span>
      <div class="e3" style="margin-bottom:8px"><button class="eh${cfg.logoAlign==='left'?' on':''}" id="logo-al-l" onclick="setLogoAlign('left')">Esq.</button><button class="eh${cfg.logoAlign==='center'?' on':''}" id="logo-al-c" onclick="setLogoAlign('center')">Centro</button><button class="eh${cfg.logoAlign==='right'?' on':''}" id="logo-al-r" onclick="setLogoAlign('right')">Dir.</button></div>
      <div class="row"><span class="row-lbl">Tamanho</span><span class="row-val" id="vls">28</span></div>
      <input type="range" class="sl" min="12" max="56" value="28" step="1" oninput="document.getElementById('vls').textContent=this.value;updateSlides()">
    </div>
  </div></div>
  <div class="sec" style="border-bottom:none;padding:12px">
    <button class="edlbtn" onclick="downloadCurrentSlide()">⬇ Baixar Slide Atual</button>
  </div>`;

  document.querySelectorAll('#pos-grid .lgb').forEach(b => b.onclick = function () {
    document.querySelectorAll('#pos-grid .lgb').forEach(x => x.classList.remove('on'));
    this.classList.add('on');
  });
}

// ─── EDITOR CONTROLS ────────────────────────────────────────────────────
function tog(hd) { const b = hd.nextElementSibling, c = hd.querySelector('.sec-chev'); b.classList.toggle('open'); c.classList.toggle('open', b.classList.contains('open')); }
function swBtn(el) { el.parentElement.querySelectorAll('.eh').forEach(b => b.classList.remove('on')); el.classList.add('on'); }
function setBgType(t) {
  cfg.bgType = t;
  ['none','solid','gradient'].forEach(x => document.getElementById('bg-'+x+'-btn')?.classList.toggle('on', x===t));
  const so = document.getElementById('bg-solid-opts'), go = document.getElementById('bg-grad-opts');
  if (so) so.style.display = t==='solid'?'block':'none';
  if (go) go.style.display = t==='gradient'?'block':'none';
  updateSlides();
}
function selectSolid(c) { cfg.solidColor=c; const h=document.getElementById('solid-hex'),p=document.getElementById('solid-prev'); if(h)h.value=c; if(p)p.style.background=c; updateSlides(); }
function setSolidCustom(v) { cfg.solidColor=v; const p=document.getElementById('solid-prev'); if(p)p.style.background=v; updateSlides(); }
function setSolidFromNative(v) { cfg.solidColor=v; const h=document.getElementById('solid-hex'),p=document.getElementById('solid-prev'); if(h)h.value=v; if(p)p.style.background=v; updateSlides(); }
function setPos(p) { cfg.textPos = p; document.querySelectorAll('#pos-grid .lgb').forEach(b => b.classList.toggle('on', b.textContent === (p==='center'?'Meio':p))); updateSlides(); }
function setAlign(a) { cfg.textAlign = a; const map={left:'Esq.',center:'Centro',right:'Dir.'}; document.querySelectorAll('.e3 button').forEach(b => { if(['Esq.','Centro','Dir.'].includes(b.textContent)) b.classList.toggle('on', b.textContent === map[a]); }); updateSlides(); }
async function generateSlideImage() {
  const prompt = document.getElementById('ed-ttl')?.value || slides[curSl].t;
  toast('Gerando imagem com IA para este slide...');
  const seed = Math.floor(Math.random() * 999999);
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt + ', high quality, digital art, instagram post')}?width=1080&height=1350&seed=${seed}&model=flux&nologo=true`;
  slides[curSl].imageUrl = url;
  updateSlides();
  toast('✅ Imagem gerada!');
}
function setCTAStyle(s) { cfg.ctaStyle=s; document.getElementById('cta-solid')?.classList.toggle('on',s==='solid'); document.getElementById('cta-outline')?.classList.toggle('on',s==='outline'); updateSlides(); }
function setCTAAlign(a) { cfg.ctaAlign=a; ['l','c','r'].forEach(x=>document.getElementById('cta-al-'+x)?.classList.remove('on')); document.getElementById('cta-al-'+a[0])?.classList.add('on'); updateSlides(); }
function toggleLogo() { cfg.logoOn=!cfg.logoOn; const t=document.getElementById('logo-toggle'),o=document.getElementById('logo-opts'); if(t)t.classList.toggle('on',cfg.logoOn); if(o)o.style.display=cfg.logoOn?'block':'none'; updateSlides(); }
function setLogoPos(p) { cfg.logoPos=p; document.getElementById('logo-top')?.classList.toggle('on',p==='top'); document.getElementById('logo-bot')?.classList.toggle('on',p==='bottom'); updateSlides(); }
function setLogoAlign(a) { cfg.logoAlign=a; ['l','c','r'].forEach(x=>document.getElementById('logo-al-'+x)?.classList.remove('on')); document.getElementById('logo-al-'+a[0])?.classList.add('on'); updateSlides(); }

async function refineSlide() {
  const title = document.getElementById('ed-ttl')?.value;
  const body = document.getElementById('ed-sub')?.value;
  const instruction = prompt('O que deseja refinar neste slide? (ex: deixe mais curto, mais persuasivo, mais direto)');
  if (!instruction) return;
  toast('Refinando slide com IA...');
  try {
    const r = await fetch(`${API}/generate/refine-slide`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer '+token },
      body: JSON.stringify({ title, body, instruction })
    });
    const d = await r.json();
    if (r.ok && d.title) {
      slides[curSl].t = d.title; slides[curSl].b = d.body;
      const ttl = document.getElementById('ed-ttl'); if(ttl) ttl.value = d.title;
      const sub = document.getElementById('ed-sub'); if(sub) sub.value = d.body;
      updateSlides(); toast('Slide refinado!');
    } else toast(d.error || 'Erro ao refinar.', true);
  } catch { toast('Sem conexão com o backend.', true); }
}

// ─── TOAST ─────────────────────────────────────────────────────────────
function toast(msg, err = false) {
  const t = document.getElementById('toast-el');
  t.textContent = msg; t.className = 'toast' + (err ? ' err' : '');
  t.style.opacity = '1';
  setTimeout(() => t.style.opacity = '0', 3000);
}

// ─── INIT ───────────────────────────────────────────────────────────────
checkAuth();
