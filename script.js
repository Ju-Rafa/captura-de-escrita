let dadosTeste1 = [];
let dadosTeste2 = [];

let tentativasTeste1 = [];
let tentativasTeste2 = [];

let penLiftsTeste1Array = [];
let penLiftsTeste2Array = [];

let desenhando = false;
let ultimaAmostra = null;
let tempoInicial = null;
let penLifts = 0;
let paciente = {};
let testeAtual = 1;

let pontosTemplate1 = null;
let pontosTemplate2 = null;

// template
function getPontosTemplate() {
  return testeAtual === 1 ? pontosTemplate1 : pontosTemplate2;
}

function setPontosTemplate(pontos) {
  if (testeAtual === 1) pontosTemplate1 = pontos;
  else pontosTemplate2 = pontos;
}

function extrairPontosTemplate(img, w, h) {
  const offscreen = document.createElement('canvas');
  offscreen.width = w;
  offscreen.height = h;
  const ctx = offscreen.getContext('2d');
  ctx.drawImage(img, 0, 0, w, h);

  const pixels = ctx.getImageData(0, 0, w, h).data;
  const pontos = [];

  for (let y = 0; y < h; y += 3) {
    for (let x = 0; x < w; x += 3) {
      const i = (y * w + x) * 4;
      const brilho = (pixels[i] + pixels[i+1] + pixels[i+2]) / 3;

      if (brilho < 200) {
        pontos.push({ x, y });
      }
    }
  }

  return pontos;
}

// distancia
function distanciaMinima(px, py, pontosRef) {
  let min = Infinity;
  for (const p of pontosRef) {
    const dx = px - p.x;
    const dy = py - p.y;
    const d = dx*dx + dy*dy;
    if (d < min) min = d;
  }
  return Math.sqrt(min);
}

// testes
function iniciarTeste() {
  paciente = {
    nome: nome.value,
    idade: idade.value,
    sexo: sexo.value,
    mao: mao.value,
    diagnostico: diagnostico.value,
    obs: obs.value
  };

  telaCadastro.style.display = "none";
  telaCaptura1.style.display = "block";

  testeAtual = 1;
  resetarEstado();
  iniciarCanvas();
}

function proximoTeste() {
  salvarTentativa();

  telaCaptura1.style.display = "none";
  telaCaptura2.style.display = "block";

  testeAtual = 2;
  resetarEstado();
  iniciarCanvas();
}

function refazerTeste() {
  salvarTentativa();
  limparTudo();
}

// salvar tentativa
function salvarTentativa() {
  if (testeAtual === 1 && dadosTeste1.length) {
    tentativasTeste1.push([...dadosTeste1]);
    penLiftsTeste1Array.push(penLifts);
  }

  if (testeAtual === 2 && dadosTeste2.length) {
    tentativasTeste2.push([...dadosTeste2]);
    penLiftsTeste2Array.push(penLifts);
  }
}

// canvas
function getCanvas() {
  return testeAtual === 1 ? area1 : area2;
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
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.globalAlpha = 0.4;
    ctx.drawImage(img,0,0,canvas.width,canvas.height);
    ctx.globalAlpha = 1;

    const pontos = extrairPontosTemplate(img, canvas.width, canvas.height);
    setPontosTemplate(pontos);
  };

  canvas.onpointerdown = e => { desenhando = true; registrar(e); };
  canvas.onpointermove = e => { if(desenhando){ desenhar(e,ctx); registrar(e);} };
  canvas.onpointerup = () => { desenhando=false; ultimaAmostra=null; penLifts++; };
}

// desenho
function desenhar(e, ctx) {
  ctx.beginPath();
  ctx.arc(e.offsetX, e.offsetY, 2, 0, Math.PI*2);
  ctx.fill();
}

// registro
function registrar(e) {
  const dados = getDados();
  const pontosRef = getPontosTemplate();
  const agora = performance.now();

  if (!tempoInicial) tempoInicial = agora;

  let vel = 0;
  if (ultimaAmostra) {
    const dx = e.offsetX - ultimaAmostra.x;
    const dy = e.offsetY - ultimaAmostra.y;
    const dt = (agora - ultimaAmostra.t)/1000;
    if (dt > 0) vel = Math.sqrt(dx*dx+dy*dy)/dt;
  }

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

  ultimaAmostra = { x:e.offsetX, y:e.offsetY, t:agora };
  atualizar();
}

// atualizar os status
function atualizar() {
  const dados = getDados();
  if (!dados.length) return;

  let somaVel=0,somaPress=0,somaDesvio=0,maxDesvio=0;

  dados.forEach(d=>{
    somaVel+=d.velocidade;
    somaPress+=d.pressao;
    somaDesvio+=d.desvio;
    if(d.desvio>maxDesvio) maxDesvio=d.desvio;
  });

  const velMedia = somaVel/dados.length;
  const pressMedia = somaPress/dados.length;
  const desvioMedio = somaDesvio/dados.length;
  const tempo = (dados[dados.length-1].tempo-tempoInicial)/1000;

  document.getElementById("tempo"+testeAtual).innerText = tempo.toFixed(2);
  document.getElementById("velMedia"+testeAtual).innerText = velMedia.toFixed(2);
  document.getElementById("pressMedia"+testeAtual).innerText = pressMedia.toFixed(2);
  document.getElementById("totalPontos"+testeAtual).innerText = dados.length;
  document.getElementById("penLifts"+testeAtual).innerText = penLifts;
  document.getElementById("desvioMedio"+testeAtual).innerText = desvioMedio.toFixed(2);
  document.getElementById("desvioMax"+testeAtual).innerText = maxDesvio.toFixed(2);
}

// limpar
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

// resumo dos dados (valores médios e etc)
function calcularResumo(dados) {
  if (!dados.length) return {tempo:0,velMedia:0,pressMedia:0,totalPontos:0,desvioMedio:0,desvioMax:0};

  let somaVel=0,somaPress=0,somaDesvio=0,maxDesvio=0;

  dados.forEach(d=>{
    somaVel+=d.velocidade;
    somaPress+=d.pressao;
    somaDesvio+=d.desvio;
    if(d.desvio>maxDesvio) maxDesvio=d.desvio;
  });

  return {
    tempo: ((dados[dados.length-1].tempo-dados[0].tempo)/1000).toFixed(2),
    velMedia:(somaVel/dados.length).toFixed(2),
    pressMedia:(somaPress/dados.length).toFixed(4),
    totalPontos:dados.length,
    desvioMedio:(somaDesvio/dados.length).toFixed(2),
    desvioMax:maxDesvio.toFixed(2)
  };
}

// excel
function baixarExcel() {
  const wb = XLSX.utils.book_new();

  // resumo
  let resumo = [
    ["SISTEMA DE AVALIAÇÃO GRAFOMOTORA"],
    [],
    ["DADOS DO PACIENTE"],
    ["Nome", paciente.nome],
    ["Idade", paciente.idade],
    ["Sexo", paciente.sexo],
    ["Mão Dominante", paciente.mao],
    ["Diagnóstico", paciente.diagnostico],
    ["Observações", paciente.obs],
    [],
    ["RESULTADOS POR TENTATIVA"],
    ["Teste","Tentativa","Tempo (s)","Vel Média","Press Média","Total Pontos","Pen Lifts","Desvio Médio","Desvio Máx"]
  ];

  // TESTE 1
  tentativasTeste1.forEach((dados, i) => {
    const r = calcularResumo(dados);
    resumo.push([
      "Teste 1",
      i + 1,
      r.tempo,
      r.velMedia,
      r.pressMedia,
      r.totalPontos,
      penLiftsTeste1Array[i] || 0,
      r.desvioMedio,
      r.desvioMax
    ]);
  });

  // TESTE 2
  tentativasTeste2.forEach((dados, i) => {
    const r = calcularResumo(dados);
    resumo.push([
      "Teste 2",
      i + 1,
      r.tempo,
      r.velMedia,
      r.pressMedia,
      r.totalPontos,
      penLiftsTeste2Array[i] || 0,
      r.desvioMedio,
      r.desvioMax
    ]);
  });

  const wsResumo = XLSX.utils.aoa_to_sheet(resumo);
  wsResumo['!cols'] = Array(9).fill({ wch: 18 });
  XLSX.utils.book_append_sheet(wb, wsResumo, "Resumo");


  // dados brutos das tentativas
  function criarSheet(dados, nome) {
    const rows = [["Ponto","Tempo (ms)","X","Y","Pressão","Velocidade","Desvio"]];
    
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
    ws['!cols'] = [{ wch: 8 }, { wch: 14 }, { wch: 8 }, { wch: 8 }, { wch: 10 }, { wch: 18 }, { wch: 22 }];
    XLSX.utils.book_append_sheet(wb, ws, nome);
  }

  // Abas para cada tentativa do Teste 1
  tentativasTeste1.forEach((dados, i) => {
    criarSheet(dados, `T1_Tentativa_${i+1}`);
  });

  // Abas para cada tentativa do Teste 2
  tentativasTeste2.forEach((dados, i) => {
    criarSheet(dados, `T2_Tentativa_${i+1}`);
  });

  // DOWNLOAD
  const nomeSanitizado = (paciente.nome || 'paciente').replace(/[\\/:*?"<>|]/g, '_');
  XLSX.writeFile(wb, `avaliacao_${nomeSanitizado}.xlsx`);
}