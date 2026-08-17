-- ============================================================
-- MIGRAÇÃO: categoria única  ->  múltiplas categorias
-- Rode este script no SQL Editor do Supabase (uma vez).
-- Como os cadastros atuais são só testes, zeramos e recriamos limpo.
-- ============================================================

-- 1) Zera os veículos de teste (opcional, mas recomendado)
truncate table public.carros;

-- 2) Adiciona a nova coluna de categorias (lista)
alter table public.carros
  add column if not exists categorias text[] not null default '{}';

-- 3) Migra o que houver da coluna antiga (se ainda existir) para a nova
update public.carros
  set categorias = array[categoria]
  where categoria is not null
    and (categorias is null or array_length(categorias,1) is null);

-- 4) Remove a coluna antiga de categoria única
alter table public.carros
  drop column if exists categoria;

-- 5) Índice para filtrar por categoria dentro do array (busca rápida)
create index if not exists idx_carros_categorias
  on public.carros using gin (categorias);

-- ============================================================
-- Pronto. Agora cada veículo pode ter uma ou mais categorias.
-- Ex: um furgão que também é van -> {"Vans","Vans Furgões"}
-- ============================================================
