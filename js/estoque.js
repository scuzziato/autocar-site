/* ===== Página de estoque: filtros + busca + ordenação ===== */
// (helpers em comum.js)

let TODOS = [];
let filtro = "Todos";
let busca = "";
let ordem = "recentes";

// Lê ?cat= da URL para já abrir filtrado
const params = new URLSearchParams(location.search);
const catInicial = params.get("cat");

// Filtro de categorias (sidebar) --------------------------
function montaChips(){
  const box = document.getElementById("chips");
  const cats = ["Todos", ...C.CATEGORIAS];
  box.innerHTML = "";
  cats.forEach(cat=>{
    const b = document.createElement("button");
    b.className = "chip"+(cat===filtro?" on":"");
    b.textContent = cat;
    b.onclick = ()=>{ filtro=cat; montaChips(); render(); atualizaTitulo(); };
    box.appendChild(b);
  });
}

function atualizaTitulo(){
  const t = document.getElementById("estoque-titulo");
  if(t) t.textContent = filtro==="Todos" ? "Todos os veículos" : filtro;
}

// Render --------------------------------------------------
function render(){
  const grade = document.getElementById("grade");
  const vazio = document.getElementById("vazio");

  // 1) filtro por categoria (agora array: categorias)
  let lista = filtro==="Todos"
    ? TODOS.slice()
    : TODOS.filter(c => Array.isArray(c.categorias) && c.categorias.includes(filtro));

  // 2) busca por texto
  if(busca.trim()){
    const q = busca.trim().toLowerCase();
    lista = lista.filter(c=>{
      const alvo = [c.titulo, c.marca, c.modelo].filter(Boolean).join(" ").toLowerCase();
      return alvo.includes(q);
    });
  }

  // contador
  const cont = document.getElementById("estoque-cont");
  if(cont) cont.textContent = lista.length + (lista.length===1?" veículo":" veículos");

  if(lista.length===0){
    grade.innerHTML=""; vazio.classList.remove("oculto"); return;
  }
  vazio.classList.add("oculto");

  // 3) ordenação
  const preco = v => v==null ? Infinity : v;
  const ano   = c => c.ano_mod || c.ano_fab || 0;
  lista.sort((a,b)=>{
    if(a.vendido !== b.vendido) return a.vendido - b.vendido;
    switch(ordem){
      case "preco-asc":  return preco(a.preco) - preco(b.preco);
      case "preco-desc": return (b.preco||0) - (a.preco||0);
      case "ano-desc":   return ano(b) - ano(a);
      case "ano-asc":    return ano(a) - ano(b);
      default:
        return (b.destaque-a.destaque) ||
               (new Date(b.criado_em) - new Date(a.criado_em));
    }
  });

  grade.innerHTML = lista.map(cardHTML).join("");
}

// Liga controles (busca com BOTÃO + ordenação) ------------
function ligaControles(){
  const txt = document.getElementById("busca-txt");
  const btn = document.getElementById("busca-btn");
  const ord = document.getElementById("ordena");

  const aplicaBusca = ()=>{ busca = txt ? txt.value : ""; render(); };

  if(btn) btn.addEventListener("click", aplicaBusca);
  // Enter também busca
  if(txt) txt.addEventListener("keydown", e=>{ if(e.key==="Enter") aplicaBusca(); });
  if(ord) ord.addEventListener("change", e=>{ ordem = e.target.value; render(); });
}

// Carrega do Supabase -------------------------------------
async function carrega(){
  const { data, error } = await sb
    .from("carros").select("*")
    .eq("ativo", true)
    .order("criado_em",{ascending:false});
  if(error){ console.error(error);
    document.getElementById("vazio").classList.remove("oculto"); return; }
  TODOS = data || [];
  render();
}

// Init ----------------------------------------------------
preencheLoja();
ligaMenu();
// aplica categoria vinda da URL, se válida
if(catInicial && C.CATEGORIAS.includes(catInicial)) filtro = catInicial;
montaChips();
atualizaTitulo();
ligaControles();
carrega();
