/* ===== Página de detalhe do carro ===== */
const C = window.CONFIG;
const sb = window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON);

const brl = (v) => v==null ? "Consulte" :
  v.toLocaleString("pt-BR",{style:"currency",currency:"BRL",maximumFractionDigits:0});
const kmF = (v) => v==null ? "—" : v.toLocaleString("pt-BR")+" km";

const params = new URLSearchParams(location.search);
const id = params.get("id");

document.getElementById("zap-topo").href =
  `https://wa.me/${C.LOJA.whatsapp}`;

function ficha(label,val){
  if(val==null||val==="") return "";
  return `<div><span>${label}</span>${val}</div>`;
}

async function carrega(){
  const alvo = document.getElementById("conteudo");
  if(!id){ alvo.innerHTML="<p>Veículo não encontrado.</p>"; return; }

  const { data:c, error } = await sb.from("carros")
    .select("*").eq("id",id).eq("ativo",true).single();

  if(error||!c){ alvo.innerHTML="<p style='padding:60px 0;text-align:center'>Veículo não encontrado ou indisponível.</p>"; return; }

  document.title = `${c.titulo} | AutoCar Veículos`;
  const fotos = (c.fotos&&c.fotos.length)?c.fotos:(c.foto_capa?[c.foto_capa]:[]);
  const anos = (c.ano_fab||"")+(c.ano_mod?"/"+c.ano_mod:"");

  const msgZap = `Olá! Tenho interesse no veículo: ${c.titulo}${c.preco?` (${brl(c.preco)})`:""}. Está disponível?`;
  const zap = `https://wa.me/${C.LOJA.whatsapp}?text=${encodeURIComponent(msgZap)}`;

  alvo.innerHTML = `
  <div class="det">
    <div>
      <div class="galeria-main">
        ${fotos.length?`<img id="foto-main" src="${fotos[0]}" alt="${c.titulo}">`
          :`<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--cinza)">Sem fotos</div>`}
        ${fotos.length>1?`
          <button class="galeria-seta esq" id="g-esq" aria-label="Foto anterior">‹</button>
          <button class="galeria-seta dir" id="g-dir" aria-label="Próxima foto">›</button>
          <span class="galeria-contador" id="g-cont">1 / ${fotos.length}</span>
        `:""}
      </div>
      ${fotos.length>1?`<div class="galeria-thumbs" id="thumbs">
        ${fotos.map((f,i)=>`<img src="${f}" class="${i===0?"on":""}" data-i="${i}">`).join("")}
      </div>`:""}
    </div>
    <div class="det-info">
      <span class="det-cat">${(c.categorias&&c.categorias.length)?c.categorias.join(" · "):""}</span>
      <h1 class="det-titulo">${c.titulo}</h1>
      ${c.vendido?`<span class="tag-vendido" style="position:static;display:inline-block">Vendido</span>`:""}
      <div class="det-preco">${brl(c.preco)}</div>

      <div class="ficha">
        ${ficha("Ano", anos||null)}
        ${ficha("KM", c.km!=null?kmF(c.km):null)}
        ${ficha("Câmbio", c.cambio)}
        ${ficha("Combustível", c.combustivel)}
        ${ficha("Cor", c.cor)}
        ${ficha("Portas", c.portas)}
        ${ficha("Marca", c.marca)}
        ${ficha("Modelo", c.modelo)}
      </div>

      ${c.opcionais&&c.opcionais.length?`
        <b style="font-size:.9rem;display:block;margin-bottom:6px">Opcionais</b>
        <div class="opcionais">${c.opcionais.map(o=>`<span>${o}</span>`).join("")}</div>`:""}

      ${c.descricao?`<p class="det-desc">${c.descricao}</p>`:""}

      <a class="btn-zap" href="${zap}" target="_blank" rel="noopener"
         style="display:inline-flex;margin-top:16px;padding:13px 24px;font-size:1rem">
         Tenho interesse — falar no WhatsApp</a>
    </div>
  </div>`;

  // ===== Galeria com setas e miniaturas =====
  if(fotos.length){
    let atual = 0;
    const main = document.getElementById("foto-main");
    const cont = document.getElementById("g-cont");
    const thumbs = document.getElementById("thumbs");
    const mostra = (i)=>{
      atual = (i+fotos.length)%fotos.length;
      main.src = fotos[atual];
      if(cont) cont.textContent = `${atual+1} / ${fotos.length}`;
      if(thumbs){
        thumbs.querySelectorAll("img").forEach((x,xi)=>x.classList.toggle("on", xi===atual));
      }
    };
    const esq = document.getElementById("g-esq");
    const dir = document.getElementById("g-dir");
    if(esq) esq.onclick = ()=> mostra(atual-1);
    if(dir) dir.onclick = ()=> mostra(atual+1);
    if(thumbs){
      thumbs.querySelectorAll("img").forEach(t=>{
        t.onclick = ()=> mostra(+t.dataset.i);
      });
    }
    // navegação por teclado (setas do teclado)
    document.addEventListener("keydown", e=>{
      if(e.key==="ArrowLeft") mostra(atual-1);
      if(e.key==="ArrowRight") mostra(atual+1);
    });
  }
}

carrega();
