/* ===== Helpers compartilhados (todas as páginas) ===== */
const C = window.CONFIG;
const sb = window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON);

const zapURL = (msg) =>
  `https://wa.me/${C.LOJA.whatsapp}?text=${encodeURIComponent(msg||"Olá! Vi o site da AutoCar e gostaria de informações.")}`;

const brl = (v) => v==null ? "Consulte" :
  v.toLocaleString("pt-BR",{style:"currency",currency:"BRL",maximumFractionDigits:0});

const km = (v) => v==null ? "—" : v.toLocaleString("pt-BR")+" km";

// primeira categoria (para exibir no card) ----------------
const catPrincipal = (c) => (c.categorias && c.categorias.length) ? c.categorias[0] : "";

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

// Card de carro (usado na home e no estoque) --------------
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
      <span class="card-cat">${catPrincipal(c)}</span>
      <span class="card-tit">${c.titulo}</span>
      <div class="card-info">${info.map(i=>`<span>${i}</span>`).join("")}</div>
      <div class="card-preco">${brl(c.preco)}</div>
    </div>
  </a>`;
}

// Menu sanduíche (celular) --------------------------------
function ligaMenu(){
  const btn = document.getElementById("menu-toggle");
  const nav = document.getElementById("menu-nav");
  if(btn && nav){
    btn.addEventListener("click", ()=> nav.classList.toggle("aberto"));
    nav.querySelectorAll("a").forEach(a=> a.addEventListener("click", ()=> nav.classList.remove("aberto")));
  }
}
