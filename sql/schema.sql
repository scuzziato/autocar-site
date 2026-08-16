-- ============================================================
-- AutoCar Veículos — Schema do site público (Supabase)
-- Rode este script inteiro no SQL Editor do Supabase.
-- Projeto NOVO/SEPARADO do Pátio.
-- ============================================================

-- 1) Tabela principal de carros --------------------------------
create table if not exists public.carros (
  id            uuid primary key default gen_random_uuid(),
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),

  -- Identificação
  titulo        text not null,               -- ex: "Fiat Toro Volcano 2021"
  categoria     text not null,               -- ver lista de categorias abaixo
  marca         text,
  modelo        text,

  -- Números
  preco         numeric(12,2),               -- em reais; null = "consulte"
  ano_fab       int,                         -- ano de fabricação
  ano_mod       int,                         -- ano do modelo
  km            int,

  -- Ficha técnica
  cambio        text,                        -- Manual / Automático / ...
  combustivel   text,                        -- Flex / Diesel / Gasolina / ...
  cor           text,
  portas        int,

  -- Conteúdo livre
  descricao     text,                        -- texto livre do vendedor
  opcionais     text[],                      -- lista: {"Ar condicionado","Direção", ...}

  -- Fotos (galeria) — URLs públicas do storage
  fotos         text[] not null default '{}',
  foto_capa     text,                        -- URL da foto principal (capa)

  -- Estado
  vendido       boolean not null default false,
  ativo         boolean not null default true, -- false = oculto do site
  destaque      boolean not null default false -- aparece em "destaques"
);

-- Categorias válidas (mesmas do site atual)
-- Utilitários, Vans, Vans Passageiros, Vans Furgões, Pickups,
-- Passeios, Motos, Mista, Caminhão

create index if not exists idx_carros_categoria on public.carros (categoria);
create index if not exists idx_carros_ativo     on public.carros (ativo);
create index if not exists idx_carros_vendido   on public.carros (vendido);

-- Atualiza atualizado_em automaticamente
create or replace function public.tg_atualizado_em()
returns trigger language plpgsql as $$
begin
  new.atualizado_em = now();
  return new;
end $$;

drop trigger if exists set_atualizado_em on public.carros;
create trigger set_atualizado_em
  before update on public.carros
  for each row execute function public.tg_atualizado_em();

-- 2) Row Level Security ----------------------------------------
alter table public.carros enable row level security;

-- Público (site): pode LER apenas carros ativos
drop policy if exists "publico_le_ativos" on public.carros;
create policy "publico_le_ativos"
  on public.carros for select
  to anon
  using (ativo = true);

-- Operador logado: pode LER tudo
drop policy if exists "auth_le_tudo" on public.carros;
create policy "auth_le_tudo"
  on public.carros for select
  to authenticated
  using (true);

-- Operador logado: pode INSERIR / ATUALIZAR / APAGAR
drop policy if exists "auth_insere" on public.carros;
create policy "auth_insere"
  on public.carros for insert
  to authenticated
  with check (true);

drop policy if exists "auth_atualiza" on public.carros;
create policy "auth_atualiza"
  on public.carros for update
  to authenticated
  using (true) with check (true);

drop policy if exists "auth_apaga" on public.carros;
create policy "auth_apaga"
  on public.carros for delete
  to authenticated
  using (true);

-- 3) Storage: bucket público de fotos --------------------------
insert into storage.buckets (id, name, public)
values ('fotos-carros', 'fotos-carros', true)
on conflict (id) do nothing;

-- Qualquer um LÊ as fotos (bucket público)
drop policy if exists "fotos_leitura_publica" on storage.objects;
create policy "fotos_leitura_publica"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'fotos-carros');

-- Só operador logado ENVIA / APAGA fotos
drop policy if exists "fotos_envio_auth" on storage.objects;
create policy "fotos_envio_auth"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'fotos-carros');

drop policy if exists "fotos_apaga_auth" on storage.objects;
create policy "fotos_apaga_auth"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'fotos-carros');

-- ============================================================
-- FIM. Depois de rodar:
-- 1. Vá em Authentication > Users > Add user e crie o login
--    da pessoa que vai atualizar o estoque (email + senha).
-- 2. Desative "Enable email confirmations" em Authentication >
--    Providers > Email, para o login funcionar direto.
-- ============================================================
