/* ===================================================
   CONFIGURAÇÃO — preencha com os dados do seu projeto
   Supabase NOVO (separado do Pátio).
   Pegue em: Supabase > Settings > API
=================================================== */
window.CONFIG = {
  // --- Supabase ---
  SUPABASE_URL:  "https://SEU-PROJETO.supabase.co",   // <-- troque
  SUPABASE_ANON: "SUA-CHAVE-ANON-PUBLIC",             // <-- troque (anon/public)

  // --- Dados da loja (usados no site inteiro) ---
  LOJA: {
    nome:      "AutoCar Veículos",
    endereco:  "Rua São João, 6237 - Centro, Toledo - PR",
    whatsapp:  "5545991130102",          // só números, com 55 (Brasil)
    tel_exib:  "(45) 99113-0102",
    fixo:      "(45) 3053-2207",          // CONFIRME qual o fixo correto!
    email:     "autocarveiculos@gmail.com",
    horario:   "Seg a Sex: 8h-12h e 13h30-18h",
    maps:      "https://maps.google.com?q=Rua+São+João,+6237+-+Centro,+Toledo+-+PR",
    lat: -24.727625, lng: -53.737107
  },

  // Categorias (ordem que aparecem no filtro)
  CATEGORIAS: ["Utilitários","Vans","Vans Passageiros","Vans Furgões",
               "Pickups","Passeios","Motos","Mista","Caminhão"]
};
