create extension if not exists pgcrypto;

create type public.app_role as enum ('colaborador', 'operacoes');
create type public.equipment_category as enum (
  'notebook',
  'monitor',
  'cabo',
  'camera',
  'acessorio'
);
create type public.equipment_condition as enum ('disponivel', 'manutencao');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null check (char_length(trim(nome)) > 0),
  role public.app_role not null default 'colaborador',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.equipments (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (char_length(trim(nome)) > 0),
  categoria public.equipment_category not null,
  patrimonio text,
  condition public.equipment_condition not null default 'disponivel',
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (patrimonio is null or char_length(trim(patrimonio)) > 0)
);

create table public.loans (
  id uuid primary key default gen_random_uuid(),
  equipment_id uuid not null references public.equipments(id),
  borrower_id uuid not null references public.profiles(id),
  checked_out_at timestamptz not null default now(),
  due_at timestamptz not null,
  returned_at timestamptz,
  returned_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (due_at > checked_out_at),
  check (returned_at is null or returned_at >= checked_out_at)
);

create unique index equipments_patrimonio_unique
  on public.equipments (patrimonio)
  where patrimonio is not null;

create unique index loans_one_open_per_equipment
  on public.loans (equipment_id)
  where returned_at is null;

create index loans_open_by_borrower
  on public.loans (borrower_id, due_at)
  where returned_at is null;

create index loans_open_by_due_date
  on public.loans (due_at)
  where returned_at is null;

create index equipments_by_category_and_condition
  on public.equipments (categoria, condition);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger equipments_set_updated_at
before update on public.equipments
for each row execute function public.set_updated_at();

create trigger loans_set_updated_at
before update on public.loans
for each row execute function public.set_updated_at();

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nome)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'nome'), ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'Usuário'
    )
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create function public.is_operations()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'operacoes'
  );
$$;

create function public.enforce_loan_rules()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  equipment_condition public.equipment_condition;
  open_loans_count integer;
begin
  select condition
    into equipment_condition
    from public.equipments
    where id = new.equipment_id
    for update;

  if not found then
    raise exception 'Equipamento não encontrado';
  end if;

  if equipment_condition <> 'disponivel' then
    raise exception 'Equipamento indisponível para empréstimo';
  end if;

  perform 1
    from public.profiles
    where id = new.borrower_id
    for update;

  if not found then
    raise exception 'Colaborador não encontrado';
  end if;

  select count(*)
    into open_loans_count
    from public.loans
    where borrower_id = new.borrower_id
      and returned_at is null;

  if open_loans_count >= 3 then
    raise exception 'Limite de 3 empréstimos ativos atingido';
  end if;

  return new;
end;
$$;

create trigger loans_enforce_rules
before insert on public.loans
for each row execute function public.enforce_loan_rules();

create function public.prevent_maintenance_with_open_loan()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.condition = 'manutencao'
     and old.condition is distinct from new.condition
     and exists (
       select 1
       from public.loans
       where equipment_id = new.id
         and returned_at is null
     ) then
    raise exception 'Não é possível colocar em manutenção um equipamento emprestado';
  end if;

  return new;
end;
$$;

create trigger equipments_prevent_maintenance_with_open_loan
before update of condition on public.equipments
for each row execute function public.prevent_maintenance_with_open_loan();

create function public.request_loan(p_equipment_id uuid)
returns public.loans
language plpgsql
security definer
set search_path = public
as $$
declare
  created_loan public.loans;
begin
  if auth.uid() is null then
    raise exception 'Autenticação obrigatória';
  end if;

  insert into public.loans (equipment_id, borrower_id, due_at)
  values (p_equipment_id, auth.uid(), now() + interval '14 days')
  returning * into created_loan;

  return created_loan;
end;
$$;

create function public.return_loan(p_loan_id uuid)
returns public.loans
language plpgsql
security definer
set search_path = public
as $$
declare
  current_loan public.loans;
begin
  if auth.uid() is null then
    raise exception 'Autenticação obrigatória';
  end if;

  select *
    into current_loan
    from public.loans
    where id = p_loan_id
    for update;

  if not found then
    raise exception 'Empréstimo não encontrado';
  end if;

  if current_loan.returned_at is not null then
    raise exception 'Empréstimo já devolvido';
  end if;

  if current_loan.borrower_id <> auth.uid()
     and not public.is_operations() then
    raise exception 'Sem permissão para registrar esta devolução';
  end if;

  update public.loans
    set returned_at = now(),
        returned_by = auth.uid()
    where id = p_loan_id
    returning * into current_loan;

  return current_loan;
end;
$$;

alter table public.profiles enable row level security;
alter table public.equipments enable row level security;
alter table public.loans enable row level security;

create policy "profiles_read_own_or_operations"
on public.profiles
for select
to authenticated
using (id = auth.uid() or public.is_operations());

create policy "equipments_read_authenticated"
on public.equipments
for select
to authenticated
using (true);

create policy "equipments_manage_operations"
on public.equipments
for all
to authenticated
using (public.is_operations())
with check (public.is_operations());

create policy "loans_read_borrower_or_operations"
on public.loans
for select
to authenticated
using (borrower_id = auth.uid() or public.is_operations());

grant select on public.profiles to authenticated;
grant select, insert, update, delete on public.equipments to authenticated;
grant select on public.loans to authenticated;

revoke all on function public.request_loan(uuid) from public, anon;
revoke all on function public.return_loan(uuid) from public, anon;
grant execute on function public.request_loan(uuid) to authenticated;
grant execute on function public.return_loan(uuid) to authenticated;
