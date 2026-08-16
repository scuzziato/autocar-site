# AutoCar Veículos — site + painel de estoque

Site institucional com vitrine de veículos e painel para a loja atualizar o
estoque. Stack: HTML/CSS/JS puro + Supabase (banco, fotos e login) + Vercel (deploy).

---

## Estrutura

```
autocar/
├── index.html        Home: alerta de golpe, hero, estoque, sobre, contato
├── carro.html        Página de detalhe do veículo (galeria de fotos)
├── admin.html        Painel do operador (login + cadastro/edição)
├── css/estilo.css    Estilo (cor de marca #b84a39)
├── js/
│   ├── config.js     >>> VOCÊ PREENCHE aqui as chaves e dados da loja <<<
│   ├── site.js        Carrega os carros na home
│   ├── carro.js       Detalhe do carro
│   └── admin.js       Login + CRUD + upload de fotos
├── sql/schema.sql     Roda no Supabase (cria tabela, storage, permissões)
└── vercel.json        Config de deploy
```

---

## Passo a passo

### 1. Criar o projeto Supabase (novo, separado do Pátio)
1. Acesse https://supabase.com > New project. Guarde a senha do banco.
2. Menu **SQL Editor** > New query > cole TODO o conteúdo de `sql/schema.sql` > **Run**.
3. Menu **Authentication > Providers > Email**: desative
   "Confirm email" (para o login funcionar sem confirmação por e-mail).
4. Menu **Authentication > Users > Add user**: crie o login da pessoa da loja
   (e-mail + senha). É esse login que ela usará no painel.

### 2. Preencher `js/config.js`
- `SUPABASE_URL` e `SUPABASE_ANON`: em **Supabase > Settings > API**
  (use a chave **anon / public** — nunca a service_role).
- Confira os dados da loja, principalmente **o telefone fixo correto**
  (o site antigo tinha dois números diferentes: 3053-2207 e 3055-2887).

### 3. Subir na Vercel
1. Crie um repositório no GitHub e suba esta pasta (mesmo fluxo do Pátio).
2. Em https://vercel.com > New Project > importe o repositório > Deploy.
   Não precisa configurar build — é site estático.
3. Em **Settings > Domains**, adicione `autocartoledo.com.br` e
   `www.autocartoledo.com.br`, e aponte o DNS conforme a Vercel indicar
   (troca do apontamento que hoje vai para o SITE123).

### 4. Testar
- Site público: página inicial deve carregar (vazia até cadastrar carros).
- Painel: acesse `/admin.html`, faça login, cadastre um veículo com fotos,
  marque "Visível no site" e confira se aparece na home.

---

## Como a pessoa da loja usa (dia a dia)
1. Acessa `seusite.com.br/admin.html`
2. Faz login com o e-mail e senha criados no passo 1.4
3. **+ Adicionar veículo** → preenche → escolhe as fotos (a 1ª vira capa) → **Salvar**
4. Para tirar do site: edita e desmarca "Visível no site", ou marca "Vendido".

Sem programar. Sem mexer em código.

### Carrossel de destaques (página inicial)
O carrossel rotativo no topo da home mostra os veículos marcados com
**"Destaque (carrossel)"** no painel. Basta marcar essa caixinha ao
cadastrar/editar o veículo. Recomendação: mantenha entre **6 e 10 destaques**.
- O carrossel mostra no máximo 10 (se marcar mais, exibe os 10 mais recentes).
- Veículos vendidos não aparecem no carrossel, mesmo marcados como destaque.
- Gira sozinho a cada 5 segundos; o cliente também navega pelas setas/pontos.

---

## Observações de segurança
- A chave `anon` é pública por natureza (vai no navegador). A proteção real
  está nas **políticas RLS** do Supabase (já configuradas no schema): o público
  só LÊ carros ativos; só quem está logado pode criar/editar/excluir.
- O painel (`admin.html`) tem `noindex` para não aparecer no Google, mas a
  segurança de verdade é o login do Supabase.
