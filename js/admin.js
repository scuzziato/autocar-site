/* ===== Painel de estoque (operador) ===== */
const C = window.CONFIG;
const sb = window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON);
const BUCKET = "fotos-carros";

const $ = (id)=>document.getElementById(id);
const msg = (box,txt,tipo)=>{ box.innerHTML = txt?`<div class="msg ${tipo}">${txt}</div>`:""; };

// Fotos em edição no formulário (mistura de URLs já salvas + novos arquivos)
let fotosAtuais = [];   // {tipo:"url", valor:"https..."} ou {tipo:"file", valor:File, preview:"blob..."}

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
    return `<div class="t">
      <img src="${src}">
      <button class="rm" onclick="tiraFoto(${i})">×</button>
      ${i===0?`<div style="text-align:center;font-size:.68rem;color:var(--marca);font-weight:700">capa</div>`:``}
    </div>`;
  }).join("");
}
window.tiraFoto = (i)=>{ fotosAtuais.splice(i,1); renderThumbs(); };

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
window.remover = async (id)=>{
  if(!confirm("Excluir este veículo? Esta ação não pode ser desfeita.")) return;
  const { error } = await sb.from("carros").delete().eq("id",id);
  if(error){ msg($("msg-painel"),"Erro ao excluir: "+error.message,"err"); return; }
  msg($("msg-painel"),"Veículo excluído.","ok"); listar();
};

// ---------- SALVAR ----------
$("btn-salvar").onclick = async ()=>{
  const titulo = $("f-titulo").value.trim();
  if(!titulo){ msg($("msg-painel"),"Informe o título do veículo.","err"); scrollTo(0,0); return; }
  if(getCategoriasSelecionadas().length===0){ msg($("msg-painel"),"Selecione ao menos uma categoria.","err"); scrollTo(0,0); return; }

  $("btn-salvar").disabled=true; $("btn-salvar").textContent="Salvando…";
  msg($("msg-painel"),"Enviando fotos e salvando…","ok");

  try{
    // 1) Sobe fotos novas ao storage, mantém URLs existentes
    const urls = [];
    for(const f of fotosAtuais){
      if(f.tipo==="url"){ urls.push(f.valor); continue; }
      const ext = (f.valor.name.split(".").pop()||"jpg").toLowerCase();
      const nome = `${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;
      const { error:upErr } = await sb.storage.from(BUCKET).upload(nome, f.valor, {cacheControl:"3600"});
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
