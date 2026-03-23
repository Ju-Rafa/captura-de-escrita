// script.js

// Variáveis principais
let dados = [];
let desenhando = false;
let ultimaAmostra = null;
let ultimaVelocidade = 0;
let paciente = {};
let tempoInicial = null;
let penLifts = 0;

// Fundo pontilhado
let fundoAtivo = false;
const imagemFundo = new Image();
imagemFundo.src = "imagem pontilhada.jpg";

// Iniciar teste
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
  document.getElementById("telaCaptura").style.display = "block";

  iniciarCanvas();
  redesenharCanvas(); // garante que o fundo apareça na inicialização
}

// Configuração do canvas
function iniciarCanvas() {
  const canvas = document.getElementById("area");
  const ctx = canvas.getContext("2d");

  canvas.width = 800;
  canvas.height = 500;

  canvas.addEventListener("pointerdown", (e) => {
    desenhando = true;
    registrarAmostra(e);
  });

  canvas.addEventListener("pointermove", (e) => {
    if (!desenhando) return;
    desenhar(e, ctx);
    registrarAmostra(e);
  });

  canvas.addEventListener("pointerup", () => {
    desenhando = false;
    ultimaAmostra = null;
    ultimaVelocidade = 0;
    penLifts++;
  });
}

// Desenhar um ponto
function desenhar(e, ctx) {
  const x = e.offsetX;
  const y = e.offsetY;
  const pressure = e.pressure || 0;

  ctx.fillStyle = "black";
  ctx.beginPath();
  ctx.arc(x, y, 2 + pressure * 2, 0, Math.PI * 2);
  ctx.fill();
}

// Registrar amostras
function registrarAmostra(e) {
  const agora = performance.now();
  if (!tempoInicial) tempoInicial = agora;

  let velocidade = 0;
  let aceleracao = 0;

  if (ultimaAmostra) {
    const dx = e.offsetX - ultimaAmostra.x;
    const dy = e.offsetY - ultimaAmostra.y;
    const dt = (agora - ultimaAmostra.t) / 1000;

    velocidade = Math.sqrt(dx * dx + dy * dy) / dt;
    aceleracao = dt > 0 ? (velocidade - ultimaVelocidade) / dt : 0;
  }

  ultimaVelocidade = velocidade;

  const amostra = {
    tempo: agora,
    x: e.offsetX,
    y: e.offsetY,
    pressao: e.pressure || 0,
    tiltX: e.tiltX || 0,
    tiltY: e.tiltY || 0,
    velocidade: velocidade,
    aceleracao: aceleracao
  };

  dados.push(amostra);
  ultimaAmostra = { x: amostra.x, y: amostra.y, t: amostra.tempo };
  atualizarEstatisticas();
}

// Atualizar estatísticas
function atualizarEstatisticas() {
  if (dados.length === 0) return;

  let somaVel = 0;
  let somaPress = 0;

  dados.forEach(d => {
    somaVel += d.velocidade;
    somaPress += d.pressao;
  });

  const velMedia = somaVel / dados.length;
  const pressMedia = somaPress / dados.length;
  const tempoTotal = (dados[dados.length - 1].tempo - tempoInicial) / 1000;

  document.getElementById("tempo").innerText = tempoTotal.toFixed(2);
  document.getElementById("velMedia").innerText = velMedia.toFixed(2);
  document.getElementById("pressMedia").innerText = pressMedia.toFixed(2);
  document.getElementById("totalPontos").innerText = dados.length;
  document.getElementById("penLifts").innerText = penLifts;
}

// Baixar CSV
function baixarCSV() {
  if (dados.length === 0) {
    alert("Nenhum dado registrado!");
    return;
  }

  let csv = `Nome: ${paciente.nome}\nIdade: ${paciente.idade}\nSexo: ${paciente.sexo}\nMão dominante: ${paciente.mao}\nDiagnóstico: ${paciente.diagnostico}\nObservações: ${paciente.obs}\n\n`;

  let somaVel = 0;
  let somaPress = 0;

  dados.forEach(d => {
    somaVel += d.velocidade;
    somaPress += d.pressao;
  });

  const velMedia = somaVel / dados.length;
  const pressMedia = somaPress / dados.length;
  const tempoTotal = (dados[dados.length - 1].tempo - tempoInicial) / 1000;
  const totalPontos = dados.length;

  csv += `Tempo Total: ${tempoTotal.toFixed(2)} s\nVelocidade Média: ${velMedia.toFixed(2)}\nPressão Média: ${pressMedia.toFixed(2)}\nTotal de Pontos: ${totalPontos}\nPen Lifts: ${penLifts}\n\n`;

  csv += "tempo,x,y,pressao,tiltX,tiltY,velocidade,aceleracao\n";
  dados.forEach(d => {
    csv += `${d.tempo},${d.x},${d.y},${d.pressao},${d.tiltX},${d.tiltY},${d.velocidade},${d.aceleracao}\n`;
  });

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "avaliacao_paciente.csv";
  a.click();
}

// Baixar imagem
function baixarImagem() {
  if (dados.length === 0) {
    alert("Nenhum desenho para salvar!");
    return;
  }

  const canvas = document.getElementById("area");
  const imagem = canvas.toDataURL("image/png");
  const link = document.createElement("a");
  link.href = imagem;
  link.download = `desenho_${paciente.nome || "paciente"}.png`;
  link.click();
}

// Limpar tudo
function limparTudo() {
  dados = [];
  ultimaAmostra = null;
  ultimaVelocidade = 0;
  tempoInicial = null;
  penLifts = 0;

  const canvas = document.getElementById("area");
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  atualizarEstatisticas();

  // redesenha apenas o fundo se estiver ativo
  if (fundoAtivo) {
    ctx.drawImage(imagemFundo, 0, 0, canvas.width, canvas.height);
  }
}

// Alternar fundo pontilhado sem apagar desenho
function alternarFundo() {
  const canvas = document.getElementById("area");
  const ctx = canvas.getContext("2d");
  fundoAtivo = !fundoAtivo;
  redesenharCanvas();
}

// Redesenha canvas inteiro (fundo + todos os pontos)
function redesenharCanvas() {
  const canvas = document.getElementById("area");
  const ctx = canvas.getContext("2d");

  // Limpa
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Fundo
  if (fundoAtivo) {
    ctx.drawImage(imagemFundo, 0, 0, canvas.width, canvas.height);
  }

  // Redesenha todos os pontos
  dados.forEach(ponto => {
    ctx.beginPath();
    ctx.arc(ponto.x, ponto.y, 2 + ponto.pressao * 2, 0, Math.PI * 2);
    ctx.fillStyle = "black";
    ctx.fill();
  });
}