/* ===== Site público — home ===== */
const C = window.CONFIG;
const sb = window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON);

// Helpers -------------------------------------------------
const zapURL = (msg) =>
  `https://wa.me/${C.LOJA.whatsapp}?text=${encodeURIComponent(msg||"Olá! Vi o site da AutoCar e gostaria de informações.")}`;

const brl = (v) => v==null ? "Consulte" :
  v.toLocaleString("pt-BR",{style:"currency",currency:"BRL",maximumFractionDigits:0});

const km = (v) => v==null ? "—" : v.toLocaleString("pt-BR")+" km";

// Preenche dados da loja no HTML ---------------------------
function preencheLoja(){
  const L = C.LOJA;
  const set = (id,val)=>{const e=document.getElementById(id); if(e) e.textContent=val;};
  set("loja-end", L.endereco);
  set("loja-tel", L.tel_exib);
  set("loja-email", L.email);
  set("loja-hora", L.horario);
  set("foot-end", L.endereco);
  set("foot-tel", L.tel_exib);
  set("foot-email", L.email);
  set("foot-hora", L.horario);
  ["zap-topo","zap-hero","zap-contato"].forEach(id=>{
    const e=document.getElementById(id); if(e) e.href=zapURL();
  });
}

// Estado --------------------------------------------------
let TODOS = [];
let filtro = "Todos";
let busca = "";
let ordem = "recentes";

// Filtro de categorias ------------------------------------
function montaChips(){
  const box = document.getElementById("chips");
  const cats = ["Todos", ...C.CATEGORIAS];
  box.innerHTML = "";
  cats.forEach(cat=>{
    const b = document.createElement("button");
    b.className = "chip"+(cat===filtro?" on":"");
    b.textContent = cat;
    b.onclick = ()=>{ filtro=cat; montaChips(); render(); };
    box.appendChild(b);
  });
}

// Card de carro -------------------------------------------
function cardHTML(c){
  const capa = c.foto_capa || (c.fotos&&c.fotos[0]) || "";
  const info = [];
  if(c.ano_mod||c.ano_fab) info.push((c.ano_fab||"")+(c.ano_mod?"/"+c.ano_mod:""));
  if(c.km!=null) info.push(km(c.km));
  if(c.cambio) info.push(c.cambio);
  return `
  <a class="card" href="carro.html?id=${c.id}">
    <div class="card-foto">
      ${capa?`<img src="${capa}" alt="${c.titulo}" loading="lazy">`:""}
      ${c.vendido?`<span class="tag-vendido">Vendido</span>`:""}
    </div>
    <div class="card-corpo">
      <span class="card-cat">${c.categoria}</span>
      <span class="card-tit">${c.titulo}</span>
      <div class="card-info">${info.map(i=>`<span>${i}</span>`).join("")}</div>
      <div class="card-preco">${brl(c.preco)}</div>
    </div>
  </a>`;
}

// Render --------------------------------------------------
function render(){
  const grade = document.getElementById("grade");
  const vazio = document.getElementById("vazio");

  // 1) filtro por categoria
  let lista = filtro==="Todos" ? TODOS.slice() : TODOS.filter(c=>c.categoria===filtro);

  // 2) busca por texto (título, marca, modelo)
  if(busca.trim()){
    const q = busca.trim().toLowerCase();
    lista = lista.filter(c=>{
      const alvo = [c.titulo, c.marca, c.modelo].filter(Boolean).join(" ").toLowerCase();
      return alvo.includes(q);
    });
  }

  if(lista.length===0){
    grade.innerHTML=""; vazio.classList.remove("oculto"); return;
  }
  vazio.classList.add("oculto");

  // 3) ordenação
  const preco = v => v==null ? Infinity : v;   // "consulte" vai pro fim em asc
  const ano   = c => c.ano_mod || c.ano_fab || 0;
  lista.sort((a,b)=>{
    if(a.vendido !== b.vendido) return a.vendido - b.vendido; // vendidos por último
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

// Liga os controles da busca/ordenação --------------------
function ligaControles(){
  const txt = document.getElementById("busca-txt");
  const ord = document.getElementById("ordena");
  if(txt) txt.addEventListener("input", e=>{ busca = e.target.value; render(); });
  if(ord) ord.addEventListener("change", e=>{ ordem = e.target.value; render(); });
}

// ===== Carrossel de destaques =====
let crIndex = 0, crTotal = 0, crTimer = null;

function montaCarrossel(destaques){
  const trilho = document.getElementById("carrossel-trilho");
  const vazio  = document.getElementById("carrossel-vazio");
  const dots   = document.getElementById("carrossel-dots");
  const esq = document.getElementById("cr-esq"), dir = document.getElementById("cr-dir");

  // Limita a no máximo 10 (regra: 6 a 10). Mostra o que houver.
  destaques = destaques.slice(0, 10);
  crTotal = destaques.length;

  if(crTotal === 0){
    vazio.textContent = "Em breve, veículos em destaque.";
    return;
  }
  vazio.classList.add("oculto");

  trilho.innerHTML = destaques.map(c=>{
    const capa = c.foto_capa || (c.fotos&&c.fotos[0]) || "";
    const sub = [ (c.ano_fab||"")+(c.ano_mod?"/"+c.ano_mod:""), c.km!=null?km(c.km):"" ]
                .filter(Boolean).join("  •  ");
    return `<div class="slide">
      <a href="carro.html?id=${c.id}">
        <div class="slide-foto">
          ${capa?`<img src="${capa}" alt="${c.titulo}">`:""}
          ${c.vendido?`<span class="tag-vendido">Vendido</span>`:""}
        </div>
        <div class="slide-info">
          <span class="slide-badge">Destaque</span>
          <div class="slide-tit">${c.titulo}</div>
          ${sub?`<div class="slide-sub">${sub}</div>`:""}
          <div class="slide-preco">${brl(c.preco)}</div>
        </div>
      </a>
    </div>`;
  }).join("");

  // Pontos
  dots.innerHTML = destaques.map((_,i)=>`<button data-i="${i}" class="${i===0?"on":""}"></button>`).join("");
  dots.querySelectorAll("button").forEach(b=>{
    b.onclick = ()=>{ vaiPara(+b.dataset.i); reinicia(); };
  });

  // Setas (só se tiver mais de 1)
  if(crTotal>1){
    esq.classList.remove("oculto"); dir.classList.remove("oculto");
    esq.onclick = ()=>{ vaiPara(crIndex-1); reinicia(); };
    dir.onclick = ()=>{ vaiPara(crIndex+1); reinicia(); };
    inicia();
  }
  vaiPara(0);
}

function vaiPara(i){
  if(crTotal===0) return;
  crIndex = (i+crTotal)%crTotal;
  document.getElementById("carrossel-trilho").style.transform = `translateX(-${crIndex*100}%)`;
  document.querySelectorAll("#carrossel-dots button")
    .forEach((b,idx)=>b.classList.toggle("on", idx===crIndex));
}
function inicia(){ crTimer = setInterval(()=>vaiPara(crIndex+1), 5000); }
function reinicia(){ clearInterval(crTimer); if(crTotal>1) inicia(); }

// Carrega do Supabase -------------------------------------
async function carrega(){
  const { data, error } = await sb
    .from("carros")
    .select("*")
    .eq("ativo", true)
    .order("criado_em",{ascending:false});
  if(error){ console.error(error);
    document.getElementById("vazio").classList.remove("oculto");
    const v=document.getElementById("carrossel-vazio");
    if(v) v.textContent="Não foi possível carregar os destaques.";
    return; }
  TODOS = data || [];
  render();
  // Destaques: marcados como destaque e não vendidos, mais recentes primeiro
  const destaques = TODOS.filter(c=>c.destaque && !c.vendido);
  montaCarrossel(destaques);
}

// Init ----------------------------------------------------
preencheLoja();
montaChips();
ligaControles();
carrega();
