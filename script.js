let dados = [];
let desenhando = false;
let ultimaAmostra = null;
let ultimaVelocidade = 0;
let paciente = {};
let tempoInicial = null;
let penLifts = 0;


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
}


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


function desenhar(e, ctx) {
  const x = e.offsetX;
  const y = e.offsetY;
  const pressure = e.pressure || 0;

  ctx.fillStyle = "black";
  ctx.beginPath();
  ctx.arc(x, y, 2 + pressure * 2, 0, Math.PI * 2);
  ctx.fill();
}


function registrarAmostra(e) {
  const agora = performance.now();

  if (!tempoInicial) {
    tempoInicial = agora;
  }

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


// BAIXAR CSV
function baixarCSV() {

  // se não tiver dados (deu erro)
  if (dados.length === 0) {
    alert("Nenhum dado registrado!");
    return;
  }

  let csv = "";

  // dados do paciente
  csv += `Nome: ${paciente.nome}\n`;
  csv += `Idade: ${paciente.idade}\n`;
  csv += `Sexo: ${paciente.sexo}\n`;
  csv += `Mão dominante: ${paciente.mao}\n`;
  csv += `Diagnóstico: ${paciente.diagnostico}\n`;
  csv += `Observações: ${paciente.obs}\n\n`;

  // CALCULA MÉDIAS CORRETAMENTE
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

  // médias no csv (deu erro antes)
  csv += `Tempo Total: ${tempoTotal.toFixed(2)} s\n`;
  csv += `Velocidade Média: ${velMedia.toFixed(2)}\n`;
  csv += `Pressão Média: ${pressMedia.toFixed(2)}\n`;
  csv += `Total de Pontos: ${totalPontos}\n`;
  csv += `Pen Lifts: ${penLifts}\n\n`;

  csv += "tempo,x,y,pressao,tiltX,tiltY,velocidade,aceleracao\n";

  dados.forEach(d => {
    csv += `${d.tempo},${d.x},${d.y},${d.pressao},${d.tiltX},${d.tiltY},${d.velocidade},${d.aceleracao}\n`;
  });

  // corrige erros nos acentos
  const blob = new Blob(
    ["\uFEFF" + csv],
    { type: "text/csv;charset=utf-8;" }
  );

  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "avaliacao_paciente.csv";
  a.click();
}

function baixarImagem() {

  const canvas = document.getElementById("area");

  // caso não tenha desenho (deu erro antes, é uma proteção)
  if (dados.length === 0) {
    alert("Nenhum desenho para salvar!");
    return;
  }

  // canvas para imagem PNG
  const imagem = canvas.toDataURL("image/png");

  // link para download
  const link = document.createElement("a");
  link.href = imagem;

  // Nome do arquivo da imagem (teste)
  link.download = `desenho_${paciente.nome || "paciente"}.png`;

  link.click();
}

function limparTudo() {
  dados = [];
  ultimaAmostra = null;
  ultimaVelocidade = 0;
  tempoInicial = null;
  penLifts = 0;

  const canvas = document.getElementById("area");
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  document.getElementById("tempo").innerText = "0";
  document.getElementById("velMedia").innerText = "0";
  document.getElementById("pressMedia").innerText = "0";
  document.getElementById("totalPontos").innerText = "0";
  document.getElementById("penLifts").innerText = "0";
}