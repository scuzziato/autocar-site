/* ===== Home: barra de categorias + grade de carrosséis de destaque ===== */
// (helpers em comum.js: sb, brl, km, zapURL, preencheLoja, ligaMenu)

// ===== Barra de categorias (topo) =====
function montaBarraCategorias(){
  const box = document.getElementById("cat-bar");
  if(!box) return;
  const cats = ["Todos", ...C.CATEGORIAS];
  box.innerHTML = cats.map(cat=>{
    const href = cat==="Todos" ? "estoque.html" : `estoque.html?cat=${encodeURIComponent(cat)}`;
    return `<a class="cat-bar-item" href="${href}">${cat}</a>`;
  }).join("");
}

// ===== Card de um slide dentro do mini-carrossel =====
function slideMini(c){
  const capa = c.foto_capa || (c.fotos&&c.fotos[0]) || "";
  const sub = [ (c.ano_fab||"")+(c.ano_mod?"/"+c.ano_mod:""), c.km!=null?km(c.km):"" ]
              .filter(Boolean).join("  •  ");
  const cat = (c.categorias&&c.categorias.length)?c.categorias[0]:"";
  return `<a class="mini-slide" href="carro.html?id=${c.id}">
    <div class="mini-foto">
      ${capa?`<img src="${capa}" alt="${c.titulo}">`:""}
      ${c.vendido?`<span class="tag-vendido">Vendido</span>`:`<span class="mini-badge">Destaque</span>`}
    </div>
    <div class="mini-info">
      ${cat?`<span class="mini-cat">${cat}</span>`:""}
      <span class="mini-tit">${c.titulo}</span>
      ${sub?`<span class="mini-sub">${sub}</span>`:""}
      <span class="mini-preco">${brl(c.preco)}</span>
    </div>
  </a>`;
}

// ===== Monta 3 carrosséis, distribuindo os destaques entre eles =====
function montaDestaques(destaques){
  const grid  = document.getElementById("destaques-grid");
  const vazio = document.getElementById("destaques-vazio");

  if(!destaques.length){
    if(vazio) vazio.textContent = "Em breve, veículos em destaque.";
    return;
  }
  if(vazio) vazio.remove();

  // Distribui os destaques em até 3 grupos (colunas)
  const NCOLS = Math.min(3, destaques.length);
  const grupos = Array.from({length:NCOLS}, ()=>[]);
  destaques.forEach((c,i)=> grupos[i % NCOLS].push(c));

  grid.innerHTML = grupos.map((g,gi)=>`
    <div class="mini-carrossel" data-g="${gi}">
      <div class="mini-trilho">${g.map(slideMini).join("")}</div>
      ${g.length>1?`<div class="mini-dots">${g.map((_,i)=>`<button data-i="${i}" class="${i===0?"on":""}"></button>`).join("")}</div>`:""}
    </div>`).join("");

  // Ativa rotação independente de cada coluna
  grid.querySelectorAll(".mini-carrossel").forEach((car,idx)=>{
    const trilho = car.querySelector(".mini-trilho");
    const dots = car.querySelectorAll(".mini-dots button");
    const total = grupos[idx].length;
    if(total<2) return;
    let pos = 0;
    const ir = (i)=>{
      pos = (i+total)%total;
      trilho.style.transform = `translateX(-${pos*100}%)`;
      dots.forEach((d,di)=>d.classList.toggle("on", di===pos));
    };
    dots.forEach(d=> d.addEventListener("click", ()=>{ ir(+d.dataset.i); reinicia(); }));
    let timer;
    // desencontra o início de cada coluna para não trocarem todas juntas
    const inicia = ()=>{ timer = setInterval(()=>ir(pos+1), 4000); };
    const reinicia = ()=>{ clearInterval(timer); inicia(); };
    setTimeout(inicia, idx*1300);
  });
}

// ===== Carrega destaques do Supabase =====
async function carrega(){
  const { data, error } = await sb
    .from("carros").select("*")
    .eq("ativo", true).eq("destaque", true)
    .order("criado_em",{ascending:false});
  if(error){ console.error(error);
    const v=document.getElementById("destaques-vazio");
    if(v) v.textContent="Não foi possível carregar os destaques.";
    return; }
  const destaques = (data||[]).filter(c=>!c.vendido);
  montaDestaques(destaques);
}

// Init
preencheLoja();
ligaMenu();
montaBarraCategorias();
carrega();
