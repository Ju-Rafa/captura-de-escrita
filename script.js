let dadosTeste1 = [];
let dadosTeste2 = [];
let desenhando = false;
let ultimaAmostra = null;
let tempoInicial = null;
let penLifts = 0;
let penLiftsTeste1 = 0;
let paciente = {};
let testeAtual = 1;

// Pontos do modelo extraídos da imagem de fundo
let pontosTemplate1 = null;
let pontosTemplate2 = null;

function getPontosTemplate() {
  return testeAtual === 1 ? pontosTemplate1 : pontosTemplate2;
}

function setPontosTemplate(pontos) {
  if (testeAtual === 1) pontosTemplate1 = pontos;
  else pontosTemplate2 = pontos;
}

// Lê os pixels escuros da imagem (a linha do modelo) e retorna como array de pontos
function extrairPontosTemplate(img, w, h) {
  const offscreen = document.createElement('canvas');
  offscreen.width = w;
  offscreen.height = h;
  const ctx = offscreen.getContext('2d');
  ctx.drawImage(img, 0, 0, w, h);

  const imageData = ctx.getImageData(0, 0, w, h);
  const pixels = imageData.data;
  const pontos = [];
  const passo = 3; // amostra a cada 3 pixels para performance

  for (let y = 0; y < h; y += passo) {
    for (let x = 0; x < w; x += passo) {
      const i = (y * w + x) * 4;
      const brilho = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
      if (brilho < 180) { // pixel mais escuro que o fundo = ponto do modelo
        pontos.push({ x, y });
      }
    }
  }

  return pontos;
}

// Retorna a distância mínima do ponto (px, py) até qualquer ponto do modelo
function distanciaMinima(px, py, pontosRef) {
  let minDistSq = Infinity;
  for (const ref of pontosRef) {
    const dx = px - ref.x;
    const dy = py - ref.y;
    const distSq = dx * dx + dy * dy;
    if (distSq < minDistSq) minDistSq = distSq;
  }
  return Math.sqrt(minDistSq);
}

function iniciarTeste() {
  paciente = {
    nome: document.getElementById("nome").value,
    idade: document.getElementById("idade").value,
    sexo: document.getElementById("sexo").value,
    mao: document.getElementById("mao").value,
    diagnostico: document.getElementById("diagnostico").value,
    obs: document.getElementById("obs").value
  };

  document.getElementById("telaCadastro").style.display = "none";
  document.getElementById("telaCaptura1").style.display = "block";

  testeAtual = 1;
  resetarEstado();
  iniciarCanvas();
}

function proximoTeste() {
  document.getElementById("telaCaptura1").style.display = "none";
  document.getElementById("telaCaptura2").style.display = "block";

  penLiftsTeste1 = penLifts; // salva pen lifts do teste 1 antes de resetar
  testeAtual = 2;
  resetarEstado();
  iniciarCanvas();
}

function getCanvas() {
  return document.getElementById(testeAtual === 1 ? "area1" : "area2");
}

function getDados() {
  return testeAtual === 1 ? dadosTeste1 : dadosTeste2;
}

function iniciarCanvas() {
  const canvas = getCanvas();
  const ctx = canvas.getContext("2d");

  canvas.width = 800;
  canvas.height = 500;

  const img = new Image();
  img.src = testeAtual === 1 ? "tracado1.jpg" : "tracado2.jpg";

  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.globalAlpha = 0.4;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1;

    // Extrai os pontos da linha do modelo após a imagem carregar
    const pontos = extrairPontosTemplate(img, canvas.width, canvas.height);
    setPontosTemplate(pontos);
  };

  canvas.onpointerdown = (e) => {
    desenhando = true;
    registrar(e);
  };

  canvas.onpointermove = (e) => {
    if (!desenhando) return;
    desenhar(e, ctx);
    registrar(e);
  };

  canvas.onpointerup = () => {
    desenhando = false;
    ultimaAmostra = null;
    penLifts++;
  };
}

function desenhar(e, ctx) {
  ctx.beginPath();
  ctx.arc(e.offsetX, e.offsetY, 2, 0, Math.PI * 2);
  ctx.fill();
}

function registrar(e) {
  const dados = getDados();
  const pontosRef = getPontosTemplate();
  const agora = performance.now();

  if (!tempoInicial) tempoInicial = agora;

  let vel = 0;

  if (ultimaAmostra) {
    const dx = e.offsetX - ultimaAmostra.x;
    const dy = e.offsetY - ultimaAmostra.y;
    const dt = (agora - ultimaAmostra.t) / 1000;

    if (dt > 0) vel = Math.sqrt(dx * dx + dy * dy) / dt;
  }

  // Calcula desvio do modelo para este ponto
  const desvio = (pontosRef && pontosRef.length)
    ? distanciaMinima(e.offsetX, e.offsetY, pontosRef)
    : 0;

  dados.push({
    tempo: agora,
    x: e.offsetX,
    y: e.offsetY,
    pressao: e.pressure || 0,
    velocidade: vel,
    desvio: desvio
  });

  ultimaAmostra = { x: e.offsetX, y: e.offsetY, t: agora };

  atualizar();
}

function atualizar() {
  const dados = getDados();
  if (!dados.length) return;

  let somaVel = 0;
  let somaPress = 0;
  let somaDesvio = 0;
  let maxDesvio = 0;

  dados.forEach(d => {
    somaVel += d.velocidade;
    somaPress += d.pressao;
    somaDesvio += d.desvio;
    if (d.desvio > maxDesvio) maxDesvio = d.desvio;
  });

  const velMedia = somaVel / dados.length;
  const pressMedia = somaPress / dados.length;
  const desvioMedio = somaDesvio / dados.length;
  const tempo = (dados[dados.length - 1].tempo - tempoInicial) / 1000;

  document.getElementById("tempo" + testeAtual).innerText = tempo.toFixed(2);
  document.getElementById("velMedia" + testeAtual).innerText = velMedia.toFixed(2);
  document.getElementById("pressMedia" + testeAtual).innerText = pressMedia.toFixed(2);
  document.getElementById("totalPontos" + testeAtual).innerText = dados.length;
  document.getElementById("penLifts" + testeAtual).innerText = penLifts;
  document.getElementById("desvioMedio" + testeAtual).innerText = desvioMedio.toFixed(2);
  document.getElementById("desvioMax" + testeAtual).innerText = maxDesvio.toFixed(2);
}

function limparTudo() {
  if (testeAtual === 1) dadosTeste1 = [];
  else dadosTeste2 = [];

  resetarEstado();
  iniciarCanvas();
}

function resetarEstado() {
  ultimaAmostra = null;
  tempoInicial = null;
  penLifts = 0;
}

function calcularResumo(dados) {
  if (!dados.length) return { tempo: 0, velMedia: 0, pressMedia: 0, totalPontos: 0, desvioMedio: 0, desvioMax: 0 };

  let somaVel = 0, somaPress = 0, somaDesvio = 0, maxDesvio = 0;
  dados.forEach(d => {
    somaVel += d.velocidade;
    somaPress += d.pressao;
    somaDesvio += d.desvio;
    if (d.desvio > maxDesvio) maxDesvio = d.desvio;
  });

  return {
    tempo:        parseFloat(((dados[dados.length - 1].tempo - dados[0].tempo) / 1000).toFixed(2)),
    velMedia:     parseFloat((somaVel / dados.length).toFixed(2)),
    pressMedia:   parseFloat((somaPress / dados.length).toFixed(4)),
    totalPontos:  dados.length,
    desvioMedio:  parseFloat((somaDesvio / dados.length).toFixed(2)),
    desvioMax:    parseFloat(maxDesvio.toFixed(2))
  };
}

function baixarExcel() {
  const wb = XLSX.utils.book_new();

  const r1 = calcularResumo(dadosTeste1);
  const r2 = calcularResumo(dadosTeste2);

  // ── Aba "Resumo" ──────────────────────────────────────────────────────────
  const resumoData = [
    ["SISTEMA DE AVALIAÇÃO GRAFOMOTORA"],
    [],
    ["DADOS DO PACIENTE"],
    ["Nome",            paciente.nome],
    ["Idade",           parseInt(paciente.idade) || paciente.idade],
    ["Sexo",            paciente.sexo],
    ["Mão Dominante",   paciente.mao],
    ["Diagnóstico",     paciente.diagnostico],
    ["Observações",     paciente.obs],
    [],
    ["RESULTADOS"],
    ["Métrica",                        "Teste 1",    "Teste 2"],
    ["Tempo Total (s)",                r1.tempo,     r2.tempo],
    ["Velocidade Média (px/s)",        r1.velMedia,  r2.velMedia],
    ["Pressão Média",                  r1.pressMedia,r2.pressMedia],
    ["Total de Pontos",                r1.totalPontos, r2.totalPontos],
    ["Pen Lifts",                      penLiftsTeste1, penLifts],
    ["Desvio Médio do Modelo (px)",    r1.desvioMedio, r2.desvioMedio],
    ["Desvio Máximo do Modelo (px)",   r1.desvioMax,   r2.desvioMax],
  ];

  const wsResumo = XLSX.utils.aoa_to_sheet(resumoData);
  wsResumo['!cols'] = [{ wch: 32 }, { wch: 16 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(wb, wsResumo, "Resumo");

  // ── Abas de dados brutos ──────────────────────────────────────────────────
  const headers = ["Ponto", "Tempo (ms)", "X (px)", "Y (px)", "Pressão", "Velocidade (px/s)", "Desvio do Modelo (px)"];
  const colWidths = [{ wch: 8 }, { wch: 14 }, { wch: 8 }, { wch: 8 }, { wch: 10 }, { wch: 18 }, { wch: 22 }];

  function criarSheet(dados) {
    const rows = [headers];
    dados.forEach((d, i) => {
      rows.push([
        i + 1,
        parseFloat(d.tempo.toFixed(2)),
        d.x,
        d.y,
        parseFloat(d.pressao.toFixed(4)),
        parseFloat(d.velocidade.toFixed(2)),
        parseFloat(d.desvio.toFixed(2))
      ]);
    });
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = colWidths;
    return ws;
  }

  XLSX.utils.book_append_sheet(wb, criarSheet(dadosTeste1), "Teste 1");
  XLSX.utils.book_append_sheet(wb, criarSheet(dadosTeste2), "Teste 2");

  const nomeSanitizado = (paciente.nome || 'paciente').replace(/[\\/:*?"<>|]/g, '_');
  XLSX.writeFile(wb, `avaliacao_${nomeSanitizado}.xlsx`);
}
