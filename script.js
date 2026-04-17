let dadosTeste1 = [];
let dadosTeste2 = [];
let desenhando = false;
let ultimaAmostra = null;
let tempoInicial = null;
let penLifts = 0;
let paciente = {};
let testeAtual = 1;

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
  const agora = performance.now();

  if (!tempoInicial) tempoInicial = agora;

  let vel = 0;

  if (ultimaAmostra) {
    const dx = e.offsetX - ultimaAmostra.x;
    const dy = e.offsetY - ultimaAmostra.y;
    const dt = (agora - ultimaAmostra.t) / 1000;

    if (dt > 0) vel = Math.sqrt(dx * dx + dy * dy) / dt;
  }

  dados.push({
    tempo: agora,
    x: e.offsetX,
    y: e.offsetY,
    pressao: e.pressure || 0,
    velocidade: vel
  });

  ultimaAmostra = { x: e.offsetX, y: e.offsetY, t: agora };

  atualizar();
}

function atualizar() {
  const dados = getDados();
  if (!dados.length) return;

  let somaVel = 0;
  let somaPress = 0;

  dados.forEach(d => {
    somaVel += d.velocidade;
    somaPress += d.pressao;
  });

  const velMedia = somaVel / dados.length;
  const pressMedia = somaPress / dados.length;
  const tempo = (dados[dados.length - 1].tempo - tempoInicial) / 1000;

  document.getElementById("tempo" + testeAtual).innerText = tempo.toFixed(2);
  document.getElementById("velMedia" + testeAtual).innerText = velMedia.toFixed(2);
  document.getElementById("pressMedia" + testeAtual).innerText = pressMedia.toFixed(2);
  document.getElementById("totalPontos" + testeAtual).innerText = dados.length;
  document.getElementById("penLifts" + testeAtual).innerText = penLifts;
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

function baixarCSV() {
  let csv = `Nome: ${paciente.nome}
Idade: ${paciente.idade}
Sexo: ${paciente.sexo}
Mão: ${paciente.mao}
Diagnóstico: ${paciente.diagnostico}
Observações: ${paciente.obs}

`;

  csv += "t1,x1,y1,press1,vel1,,,t2,x2,y2,press2,vel2\n";

  const max = Math.max(dadosTeste1.length, dadosTeste2.length);

  for (let i = 0; i < max; i++) {
    let l = "";

    if (dadosTeste1[i]) {
      const d = dadosTeste1[i];
      l += `${d.tempo},${d.x},${d.y},${d.pressao},${d.velocidade}`;
    } else l += ",,,,,";

    l += ",,,";

    if (dadosTeste2[i]) {
      const d = dadosTeste2[i];
      l += `${d.tempo},${d.x},${d.y},${d.pressao},${d.velocidade}`;
    } else l += ",,,,,";

    csv += l + "\n";
  }

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "resultado.csv";
  a.click();
}