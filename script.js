let saldo = 0;
let produtos = [];
let editIndex = null;

// ===== Persistência =====
function salvarDados() {
  localStorage.setItem("produtos", JSON.stringify(produtos));
  localStorage.setItem("saldo", saldo);
}

function carregarDados() {
  const dadosProdutos = localStorage.getItem("produtos");
  const dadosSaldo = localStorage.getItem("saldo");

  if (dadosProdutos) {
    produtos = JSON.parse(dadosProdutos);
    atualizarTabela();
  }
  if (dadosSaldo) {
    saldo = parseFloat(dadosSaldo);
    atualizarSaldo();
  }
}

// ===== Toasts =====
function mostrarToast(mensagem, tipo = "sucesso") {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = `toast ${tipo}`;
  toast.textContent = mensagem;
  container.appendChild(toast);

  setTimeout(() => toast.classList.add("show"), 100);
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 500);
  }, 3000);
}

// ===== Orçamento =====
function definirOrcamento() {
  saldo = parseFloat(document.getElementById("orcamento").value) || 0;
  atualizarSaldo();
  salvarDados();
  mostrarToast("Orçamento definido!", "info");
}

function atualizarSaldo() {
  document.getElementById("saldo").innerText = `Saldo: R$${saldo.toFixed(2)}`;
}

// ===== Produtos =====
function adicionarProduto() {
  const nome = document.getElementById("nome").value;
  const marca = document.getElementById("marca").value;
  const valor = parseFloat(document.getElementById("valor").value);
  const quantidade = parseInt(document.getElementById("quantidade").value);

  if (!nome || !marca || !valor || !quantidade) {
    mostrarToast("Preencha todos os campos!", "erro");
    return;
  }

  const total = valor * quantidade;

  if (editIndex !== null) {
    const produtoAntigo = produtos[editIndex];
    saldo += produtoAntigo.total;
    saldo -= total;
    produtos[editIndex] = { nome, marca, valor, quantidade, total };
    atualizarTabela();
    editIndex = null;
    mostrarToast("Produto atualizado!", "info");
  } else {
    saldo -= total;
    produtos.push({ nome, marca, valor, quantidade, total });
    atualizarTabela();
    mostrarToast("Produto adicionado!", "sucesso");
  }

  atualizarSaldo();
  salvarDados();
  limparFormulario();
}

function atualizarTabela() {
  const tbody = document.querySelector("#tabelaProdutos tbody");
  tbody.innerHTML = "";

  produtos.forEach((produto, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${produto.nome}</td>
      <td>${produto.marca}</td>
      <td>R$${produto.valor.toFixed(2)}</td>
      <td>${produto.quantidade}</td>
      <td>R$${produto.total.toFixed(2)}</td>
      <td></td>
    `;

    const btnEditar = document.createElement("button");
    btnEditar.className = "btn btn-sm btn-warning me-2";
    btnEditar.textContent = "Editar";
    btnEditar.addEventListener("click", () => editarProduto(index));

    const btnExcluir = document.createElement("button");
    btnExcluir.className = "btn btn-sm btn-danger";
    btnExcluir.textContent = "Excluir";
    btnExcluir.addEventListener("click", () => excluirProduto(index));

    tr.lastElementChild.appendChild(btnEditar);
    tr.lastElementChild.appendChild(btnExcluir);

    tbody.appendChild(tr);
  });
}

function editarProduto(index) {
  const produto = produtos[index];
  document.getElementById("nome").value = produto.nome;
  document.getElementById("marca").value = produto.marca;
  document.getElementById("valor").value = produto.valor;
  document.getElementById("quantidade").value = produto.quantidade;
  editIndex = index;
}

function excluirProduto(index) {
  saldo += produtos[index].total;
  produtos.splice(index, 1);
  atualizarTabela();
  atualizarSaldo();
  salvarDados();
  mostrarToast("Produto excluído!", "erro");
}

function limparFormulario() {
  document.getElementById("nome").value = "";
  document.getElementById("marca").value = "";
  document.getElementById("valor").value = "";
  document.getElementById("quantidade").value = "";
}

// ===== Limpar Tudo =====
function limparTudo() {
  produtos = [];
  saldo = 0;
  atualizarTabela();
  atualizarSaldo();
  salvarDados();
  mostrarToast("Tudo limpo! Pronto para nova conta.", "info");
}

// ===== PDF =====
function gerarPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const mercantil = document.getElementById("mercantil").value || "Mercantil";
  const dataAtual = new Date().toLocaleDateString("pt-BR");

  doc.setFontSize(16);
  doc.text(`${mercantil} - ${dataAtual}`, 20, 20);

  const cabecalho = ["Produto", "Marca", "Valor (R$)", "Qtd", "Total (R$)"];
  const linhas = produtos.map(p => [
    p.nome,
    p.marca,
    `R$${p.valor.toFixed(2)}`,
    p.quantidade.toString(),
    `R$${p.total.toFixed(2)}`
  ]);

  doc.autoTable({
    head: [cabecalho],
    body: linhas,
    startY: 30,
    styles: { fontSize: 11, halign: "center" },
    headStyles: { fillColor: [0, 122, 255], textColor: 255 },
    alternateRowStyles: { fillColor: [240, 240, 240] }
  });

  let totalGeral = produtos.reduce((acc, p) => acc + p.total, 0);
  doc.setFontSize(12);
  doc.text(`Valor Total: R$${totalGeral.toFixed(2)}`, 20, doc.lastAutoTable.finalY + 15);

  doc.save("planilha_produtos.pdf");
}

// ===== Scanner =====
function iniciarScanner() {
  document.getElementById("scanner").style.display = "block";
  Quagga.init({
    inputStream: {
      type: "LiveStream",
      target: document.querySelector("#scanner-container"),
      constraints: { facingMode: "environment" }
    },
    decoder: { readers: ["code_128_reader", "ean_reader", "ean_8_reader"] }
  }, function(err) {
    if (err) {
      console.error(err);
      return;
    }
    Quagga.start();
  });

  Quagga.onDetected(function(data) {
    const codigo = data.codeResult.code;
    consultarProduto(codigo);
    pararScanner();
  });
}

function pararScanner() {
  Quagga.stop();
  document.getElementById("scanner").style.display = "none";
}

// ===== Consulta produto =====
async function consultarProduto(codigo) {
  try {
    const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${codigo}.json`);
    const data = await response.json();
    if (data.status === 1) {
      document.getElementById("nome").value = data.product.product_name || `Produto ${codigo}`;
      document.getElementById("marca").value = data.product.brands || "";
    } else {
      document.getElementById("nome").value = `Produto ${codigo}`;
      document.getElementById("marca").value = "";
    }
  } catch {
    document.getElementById("nome").value = `Produto ${codigo}`;
    document.getElementById("marca").value = "";
  }
}

// ===== Dark Mode =====
const btnDarkMode = document.getElementById("btnDarkMode");
const iconDarkMode = document.getElementById("iconDarkMode");

btnDarkMode.addEventListener("click", () => {
  document.body.classList.add("transition");
  document.body.classList.toggle("dark");
  iconDarkMode.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙";
  setTimeout(() => document.body.classList.remove("transition"), 400);
});

// ===== Liga os botões =====
document.getElementById("btnOrcamento").addEventListener("click", definirOrcamento);
document.getElementById("btnAdicionar").addEventListener("click", adicionarProduto);
document.getElementById("btnScanner").addEventListener("click", iniciarScanner);
document.getElementById("btnPararScanner").addEventListener("click", pararScanner);
document.getElementById("btnPDF").addEventListener("click", gerarPDF);
document.getElementById("btnLimpar").addEventListener("click", limparTudo);

// ===== Carregar dados ao iniciar =====
window.addEventListener("DOMContentLoaded", carregarDados);
