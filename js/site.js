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

// ===== Monta 3 carrosséis, um por categoria (só destaques) =====
function montaDestaques(destaques){
  const grid  = document.getElementById("destaques-grid");
  const vazio = document.getElementById("destaques-vazio");

  if(!destaques.length){
    if(vazio) vazio.textContent = "Em breve, veículos em destaque.";
    return;
  }
  if(vazio) vazio.remove();

  // Agrupa por categoria: cada veículo entra na sua 1ª categoria.
  // Segue a ordem de C.CATEGORIAS e pega as que têm destaques.
  const porCategoria = {};
  destaques.forEach(c=>{
    const cats = (c.categorias&&c.categorias.length)?c.categorias:["Outros"];
    cats.forEach(cat=>{
      if(!porCategoria[cat]) porCategoria[cat] = [];
      // evita repetir o mesmo carro na mesma categoria
      if(!porCategoria[cat].some(x=>x.id===c.id)) porCategoria[cat].push(c);
    });
  });

  // Ordena as categorias pela ordem definida no config, só as que têm veículos
  const catsComDestaque = C.CATEGORIAS.filter(cat=>porCategoria[cat] && porCategoria[cat].length);
  // fallback: categorias fora da lista (ex: "Outros")
  Object.keys(porCategoria).forEach(cat=>{
    if(!catsComDestaque.includes(cat)) catsComDestaque.push(cat);
  });

  if(!catsComDestaque.length){
    grid.innerHTML = `<div class="carrossel-vazio-msg">Em breve, veículos em destaque.</div>`;
    return;
  }

  grid.innerHTML = catsComDestaque.map((cat,gi)=>{
    const lista = porCategoria[cat];
    const href = `estoque.html?cat=${encodeURIComponent(cat)}`;
    return `
    <div class="mini-carrossel" data-g="${gi}">
      <div class="mini-cab"><span class="mini-cab-nome">${cat}</span>
        <a class="mini-cab-link" href="${href}">ver todos</a></div>
      <div class="mini-viewport">
        <div class="mini-trilho">${lista.map(slideMini).join("")}</div>
        ${lista.length>1?`
          <button class="mini-seta esq" aria-label="Anterior">‹</button>
          <button class="mini-seta dir" aria-label="Próximo">›</button>
        `:""}
      </div>
      ${lista.length>1?`<div class="mini-dots">${lista.map((_,i)=>`<button data-i="${i}" class="${i===0?"on":""}"></button>`).join("")}</div>`:""}
    </div>`;
  }).join("");

  // Ativa rotação independente de cada coluna
  grid.querySelectorAll(".mini-carrossel").forEach((car,idx)=>{
    const trilho = car.querySelector(".mini-trilho");
    const dots = car.querySelectorAll(".mini-dots button");
    const total = catsComDestaque[idx] ? porCategoria[catsComDestaque[idx]].length : 0;
    if(total<2) return;
    let pos = 0;
    const ir = (i)=>{
      pos = (i+total)%total;
      trilho.style.transform = `translateX(-${pos*100}%)`;
      dots.forEach((d,di)=>d.classList.toggle("on", di===pos));
    };
    dots.forEach(d=> d.addEventListener("click", ()=>{ ir(+d.dataset.i); reinicia(); }));
    // setas
    const esq = car.querySelector(".mini-seta.esq");
    const dir = car.querySelector(".mini-seta.dir");
    if(esq) esq.addEventListener("click", (e)=>{ e.preventDefault(); ir(pos-1); reinicia(); });
    if(dir) dir.addEventListener("click", (e)=>{ e.preventDefault(); ir(pos+1); reinicia(); });
    let timer;
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
