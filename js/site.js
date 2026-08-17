/* ===== Home: destaques + categorias ===== */
// (helpers em comum.js: sb, brl, km, zapURL, preencheLoja, ligaMenu, catPrincipal)

// ===== Carrossel de destaques =====
let crIndex = 0, crTotal = 0, crTimer = null;

function montaCarrossel(destaques){
  const trilho = document.getElementById("carrossel-trilho");
  const vazio  = document.getElementById("carrossel-vazio");
  const dots   = document.getElementById("carrossel-dots");
  const esq = document.getElementById("cr-esq"), dir = document.getElementById("cr-dir");

  destaques = destaques.slice(0, 10);
  crTotal = destaques.length;

  if(crTotal === 0){ vazio.textContent = "Em breve, veículos em destaque."; return; }
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

  dots.innerHTML = destaques.map((_,i)=>`<button data-i="${i}" class="${i===0?"on":""}"></button>`).join("");
  dots.querySelectorAll("button").forEach(b=>{
    b.onclick = ()=>{ vaiPara(+b.dataset.i); reinicia(); };
  });

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

// ===== Categorias na sidebar (links que levam ao estoque) =====
function montaCategorias(){
  const box = document.getElementById("cats-links");
  if(!box) return;
  const links = ["Todos", ...C.CATEGORIAS];
  box.innerHTML = links.map(cat=>{
    const href = cat==="Todos" ? "estoque.html" : `estoque.html?cat=${encodeURIComponent(cat)}`;
    return `<a class="chip" href="${href}">${cat}</a>`;
  }).join("");
}

// ===== Busca na home leva ao estoque com o termo =====
function ligaBusca(){
  const txt = document.getElementById("busca-txt");
  const btn = document.getElementById("busca-btn");
  if(!btn) return;
  const irParaEstoque = ()=>{
    const q = txt ? txt.value.trim() : "";
    location.href = q ? `estoque.html?q=${encodeURIComponent(q)}` : "estoque.html";
  };
  btn.addEventListener("click", irParaEstoque);
  if(txt) txt.addEventListener("keydown", e=>{ if(e.key==="Enter") irParaEstoque(); });
}

// ===== Carrega destaques do Supabase =====
async function carrega(){
  const { data, error } = await sb
    .from("carros").select("*")
    .eq("ativo", true).eq("destaque", true)
    .order("criado_em",{ascending:false});
  if(error){ console.error(error);
    const v=document.getElementById("carrossel-vazio");
    if(v) v.textContent="Não foi possível carregar os destaques.";
    return; }
  const destaques = (data||[]).filter(c=>!c.vendido);
  montaCarrossel(destaques);
}

// Init
preencheLoja();
ligaMenu();
montaCategorias();
ligaBusca();
carrega();
