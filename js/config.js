/* ===================================================
   CONFIGURAÇÃO — preencha com os dados do seu projeto
   Supabase NOVO (separado do Pátio).
   Pegue em: Supabase > Settings > API
=================================================== */
window.CONFIG = {
  // --- Supabase ---
  SUPABASE_URL:  "https://lnrshfnaagqgfefljhcs.supabase.co",
  SUPABASE_ANON: "sb_publishable_v98RSrE5bS5TDGx06A7pQQ_3vWoqa4L",

  // --- Dados da loja (usados no site inteiro) ---
  LOJA: {
    nome:      "AutoCar Veículos",
    endereco:  "Rua São João, 6237 - Centro, Toledo - PR",
    whatsapp:  "5545991130102",          // só números, com 55 (Brasil)
    tel_exib:  "(45) 99113-0102",
    fixo:      "",                        // sem fixo — só WhatsApp
    email:     "autocarveiculos@gmail.com",
    horario:   "Seg a Sex: 8h-12h e 13h30-18h",
    maps:      "https://maps.google.com?q=Rua+São+João,+6237+-+Centro,+Toledo+-+PR",
    lat: -24.727625, lng: -53.737107
  },

  // Categorias (ordem que aparecem no filtro)
  CATEGORIAS: ["Utilitários","Vans","Vans Passageiros","Vans Furgões",
               "Pickups","Passeios","Motos","Mista","Caminhão"]
};
