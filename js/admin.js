/* ===== Painel de estoque (operador) ===== */
const C = window.CONFIG;
const sb = window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON);
const BUCKET = "fotos-carros";

const $ = (id)=>document.getElementById(id);
const msg = (box,txt,tipo)=>{ box.innerHTML = txt?`<div class="msg ${tipo}">${txt}</div>`:""; };

// Fotos em edição no formulário (mistura de URLs já salvas + novos arquivos)
let fotosAtuais = [];   // {tipo:"url", valor:"https..."} ou {tipo:"file", valor:File, preview:"blob..."}

// ---------- Compressão de imagem antes do upload ----------
// Redimensiona para no máx. LARGURA_MAX px de largura e recomprime em JPEG.
// Uma foto de 5MB do celular vira ~300-500KB, sem perda visível na tela.
const LARGURA_MAX = 1600;   // px — suficiente para telas grandes
const QUALIDADE   = 0.82;   // 0..1 — equilíbrio qualidade/tamanho

function comprimeImagem(file){
  return new Promise((resolve)=>{
    // Se não for imagem, devolve como está
    if(!file.type.startsWith("image/")){ resolve(file); return; }
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = ()=>{
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if(width > LARGURA_MAX){
        height = Math.round(height * (LARGURA_MAX / width));
        width  = LARGURA_MAX;
      }
      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob)=>{
        if(!blob){ resolve(file); return; }   // fallback
        // Mantém nome base, troca extensão para .jpg
        const base = (file.name.replace(/\.[^.]+$/,"")||"foto");
        resolve(new File([blob], base+".jpg", {type:"image/jpeg"}));
      }, "image/jpeg", QUALIDADE);
    };
    img.onerror = ()=>{ URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

// ---------- AUTH ----------
async function estado(){
  const { data:{ session } } = await sb.auth.getSession();
  if(session){ abrePainel(session.user); } else { mostraLogin(); }
}
function mostraLogin(){ $("tela-login").classList.remove("oculto"); $("tela-painel").classList.add("oculto"); }
function abrePainel(user){
  $("tela-login").classList.add("oculto");
  $("tela-painel").classList.remove("oculto");
  $("quem").textContent = "Conectado como "+user.email;
  preencheCategorias();
  listar();
}

$("btn-login").onclick = async ()=>{
  const email=$("in-email").value.trim(), senha=$("in-senha").value;
  msg($("msg-login"),"Entrando…","ok");
  const { data, error } = await sb.auth.signInWithPassword({email,password:senha});
  if(error){ msg($("msg-login"),"E-mail ou senha inválidos.","err"); return; }
  msg($("msg-login"),"");
  abrePainel(data.user);
};
$("btn-sair").onclick = async ()=>{ await sb.auth.signOut(); mostraLogin(); };

// ---------- CATEGORIAS (checkboxes) ----------
function preencheCategorias(){
  $("f-categorias").innerHTML = C.CATEGORIAS.map(c=>`
    <label class="cat-check">
      <input type="checkbox" value="${c}"> <span>${c}</span>
    </label>`).join("");
}
function getCategoriasSelecionadas(){
  return [...document.querySelectorAll("#f-categorias input:checked")].map(i=>i.value);
}
function setCategoriasSelecionadas(cats){
  const set = new Set(cats||[]);
  document.querySelectorAll("#f-categorias input").forEach(i=>{ i.checked = set.has(i.value); });
}

// ---------- LISTAR ----------
async function listar(){
  const { data, error } = await sb.from("carros").select("*").order("criado_em",{ascending:false});
  if(error){ msg($("msg-painel"),"Erro ao carregar: "+error.message,"err"); return; }
  $("cont").textContent = data.length;
  $("lista").innerHTML = data.map(c=>{
    const capa = c.foto_capa || (c.fotos&&c.fotos[0]) || "";
    const preco = c.preco!=null ? c.preco.toLocaleString("pt-BR",{style:"currency",currency:"BRL",maximumFractionDigits:0}) : "Consulte";
    return `<div class="linha-carro">
      ${capa?`<img src="${capa}">`:`<div style="width:70px;height:52px;background:var(--cinza-cl);border-radius:7px"></div>`}
      <div class="meta">
        <b>${c.titulo}</b>
        <small>${(c.categorias||[]).join(", ")||"—"} • ${preco}</small>
      </div>
      ${c.vendido?`<span class="badge v">Vendido</span>`:``}
      ${c.ativo?`<span class="badge a">No site</span>`:`<span class="badge v">Oculto</span>`}
      <button class="btn-s" onclick="editar('${c.id}')">Editar</button>
      <button class="btn-x" onclick="remover('${c.id}')">Excluir</button>
    </div>`;
  }).join("") || "<p style='color:var(--cinza)'>Nenhum veículo ainda. Clique em “Adicionar veículo”.</p>";
}

// ---------- FORM: abrir/fechar ----------
$("btn-novo").onclick = ()=>{ limpaForm(); $("form-tit").textContent="Novo veículo"; $("form-box").classList.remove("oculto"); scrollTo(0,0); };
$("btn-cancelar").onclick = ()=>{ $("form-box").classList.add("oculto"); };

function limpaForm(){
  ["f-id","f-titulo","f-marca","f-modelo","f-preco","f-anofab","f-anomod","f-km","f-cor","f-portas","f-opcionais","f-descricao"]
    .forEach(id=>$(id).value="");
  $("f-cambio").value=""; $("f-comb").value=""; setCategoriasSelecionadas([]);
  $("f-destaque").checked=false; $("f-vendido").checked=false; $("f-ativo").checked=true;
  fotosAtuais=[]; renderThumbs(); $("f-fotos").value="";
}

// ---------- FOTOS: seleção e preview ----------
$("f-fotos").onchange = (e)=>{
  [...e.target.files].forEach(file=>{
    fotosAtuais.push({tipo:"file", valor:file, preview:URL.createObjectURL(file)});
  });
  renderThumbs();
  e.target.value="";
};
function renderThumbs(){
  $("thumbs-up").innerHTML = fotosAtuais.map((f,i)=>{
    const src = f.tipo==="url"?f.valor:f.preview;
    const total = fotosAtuais.length;
    return `<div class="t" draggable="true" data-i="${i}">
      <img src="${src}" draggable="false">
      <button class="rm" onclick="tiraFoto(${i})" title="Remover">×</button>
      <div class="t-mover">
        <button onclick="moveFoto(${i},-1)" ${i===0?"disabled":""} title="Mover para trás">‹</button>
        <button onclick="moveFoto(${i},1)" ${i===total-1?"disabled":""} title="Mover para frente">›</button>
      </div>
      ${i===0?`<div class="t-capa">capa</div>`:``}
    </div>`;
  }).join("");
  ligaArrasto();
}

// Mover foto por botão (‹ ›)
window.moveFoto = (i, dir)=>{
  const j = i + dir;
  if(j<0 || j>=fotosAtuais.length) return;
  [fotosAtuais[i], fotosAtuais[j]] = [fotosAtuais[j], fotosAtuais[i]];
  renderThumbs();
};

// Arrastar-e-soltar para reordenar
let arrastando = null;
function ligaArrasto(){
  const box = $("thumbs-up");
  box.querySelectorAll(".t").forEach(el=>{
    el.addEventListener("dragstart", ()=>{ arrastando = +el.dataset.i; el.classList.add("arrastando"); });
    el.addEventListener("dragend", ()=>{ el.classList.remove("arrastando"); });
    el.addEventListener("dragover", (e)=> e.preventDefault());
    el.addEventListener("drop", (e)=>{
      e.preventDefault();
      const destino = +el.dataset.i;
      if(arrastando===null || arrastando===destino) return;
      const item = fotosAtuais.splice(arrastando,1)[0];
      fotosAtuais.splice(destino,0,item);
      arrastando = null;
      renderThumbs();
    });
  });
}

// ---------- EDITAR ----------
window.editar = async (id)=>{
  const { data:c } = await sb.from("carros").select("*").eq("id",id).single();
  if(!c) return;
  $("f-id").value=c.id; $("f-titulo").value=c.titulo||""; setCategoriasSelecionadas(c.categorias);
  $("f-marca").value=c.marca||""; $("f-modelo").value=c.modelo||"";
  $("f-preco").value=c.preco??""; $("f-anofab").value=c.ano_fab??""; $("f-anomod").value=c.ano_mod??"";
  $("f-km").value=c.km??""; $("f-cambio").value=c.cambio||""; $("f-comb").value=c.combustivel||"";
  $("f-cor").value=c.cor||""; $("f-portas").value=c.portas??"";
  $("f-opcionais").value=(c.opcionais||[]).join(", "); $("f-descricao").value=c.descricao||"";
  $("f-destaque").checked=c.destaque; $("f-vendido").checked=c.vendido; $("f-ativo").checked=c.ativo;
  fotosAtuais = (c.fotos||[]).map(u=>({tipo:"url",valor:u}));
  renderThumbs();
  $("form-tit").textContent="Editar veículo";
  $("form-box").classList.remove("oculto"); scrollTo(0,0);
};

// ---------- REMOVER ----------
// Extrai o nome do arquivo dentro do bucket a partir da URL pública
function nomeDoArquivo(url){
  if(!url) return null;
  // URL pública: .../storage/v1/object/public/fotos-carros/NOME.jpg
  const marca = `/${BUCKET}/`;
  const i = url.indexOf(marca);
  if(i === -1) return null;
  return decodeURIComponent(url.slice(i + marca.length).split("?")[0]);
}

window.remover = async (id)=>{
  if(!confirm("Excluir este veículo? Esta ação não pode ser desfeita.")) return;

  // 1) Busca o carro para saber quais fotos apagar
  const { data:carro } = await sb.from("carros").select("fotos").eq("id",id).single();

  // 2) Apaga as fotos do Storage
  if(carro && carro.fotos && carro.fotos.length){
    const nomes = carro.fotos.map(nomeDoArquivo).filter(Boolean);
    if(nomes.length){
      const { error:stErr } = await sb.storage.from(BUCKET).remove(nomes);
      if(stErr) console.warn("Aviso ao apagar fotos do storage:", stErr.message);
    }
  }

  // 3) Apaga o registro do banco
  const { error } = await sb.from("carros").delete().eq("id",id);
  if(error){ msg($("msg-painel"),"Erro ao excluir: "+error.message,"err"); return; }
  msg($("msg-painel"),"Veículo e fotos excluídos.","ok"); listar();
};

// ---------- SALVAR ----------
$("btn-salvar").onclick = async ()=>{
  const titulo = $("f-titulo").value.trim();
  if(!titulo){ msg($("msg-painel"),"Informe o título do veículo.","err"); scrollTo(0,0); return; }
  if(getCategoriasSelecionadas().length===0){ msg($("msg-painel"),"Selecione ao menos uma categoria.","err"); scrollTo(0,0); return; }

  $("btn-salvar").disabled=true; $("btn-salvar").textContent="Salvando…";
  msg($("msg-painel"),"Enviando fotos e salvando…","ok");

  try{
    // 1) Sobe fotos novas ao storage (comprimidas), mantém URLs existentes
    const urls = [];
    for(const f of fotosAtuais){
      if(f.tipo==="url"){ urls.push(f.valor); continue; }
      const arquivo = await comprimeImagem(f.valor);   // <-- comprime aqui
      const nome = `${Date.now()}-${Math.random().toString(36).slice(2,8)}.jpg`;
      const { error:upErr } = await sb.storage.from(BUCKET).upload(nome, arquivo, {cacheControl:"3600", contentType:"image/jpeg"});
      if(upErr) throw upErr;
      const { data:pub } = sb.storage.from(BUCKET).getPublicUrl(nome);
      urls.push(pub.publicUrl);
    }

    // 2) Monta registro
    const num = (id)=>{ const v=$(id).value.trim(); return v===""?null:Number(v); };
    const opc = $("f-opcionais").value.split(",").map(s=>s.trim()).filter(Boolean);
    const reg = {
      titulo,
      categorias: getCategoriasSelecionadas(),
      marca: $("f-marca").value.trim()||null,
      modelo: $("f-modelo").value.trim()||null,
      preco: num("f-preco"),
      ano_fab: num("f-anofab"), ano_mod: num("f-anomod"), km: num("f-km"),
      cambio: $("f-cambio").value||null,
      combustivel: $("f-comb").value||null,
      cor: $("f-cor").value.trim()||null,
      portas: num("f-portas"),
      descricao: $("f-descricao").value.trim()||null,
      opcionais: opc,
      fotos: urls,
      foto_capa: urls[0]||null,
      destaque: $("f-destaque").checked,
      vendido: $("f-vendido").checked,
      ativo: $("f-ativo").checked
    };

    // 3) Insere ou atualiza
    const id = $("f-id").value;
    let error;
    if(id){ ({ error } = await sb.from("carros").update(reg).eq("id",id)); }
    else  { ({ error } = await sb.from("carros").insert(reg)); }
    if(error) throw error;

    msg($("msg-painel"),"Veículo salvo com sucesso!","ok");
    $("form-box").classList.add("oculto");
    listar();
  }catch(e){
    console.error(e);
    msg($("msg-painel"),"Erro ao salvar: "+(e.message||e),"err");
  }finally{
    $("btn-salvar").disabled=false; $("btn-salvar").textContent="Salvar veículo";
    scrollTo(0,0);
  }
};

// Init
estado();
