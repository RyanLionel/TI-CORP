-- Spec 001 · T2 · CA-01, CA-03 a CA-06
-- DDL aprovado por Ryan em 2026-11-16. Não altera tabela, coluna nem policy; nenhuma linha existente é afetada.
-- Recriada em 2026-11-16: a migration 20261110185103 citada nas rodadas antigas não existe em nenhum repositório.

-- Prazo: N dias úteis (seg-sex, sem feriados), contados no fuso de São Paulo (decisão da spec 001)
create function public.add_business_days(p_start timestamptz, p_days int)
returns timestamptz
language plpgsql
immutable
set search_path = public
as $$
declare
  d timestamptz := p_start;
  n int := 0;
begin
  while n < p_days loop
    d := d + interval '1 day';
    if extract(isodow from d at time zone 'America/Sao_Paulo') < 6 then
      n := n + 1;
    end if;
  end loop;
  return d;
end;
$$;

-- Regras no banco: manutenção, já emprestado, atraso, limite 5 (atrasados contam)
create or replace function public.enforce_loan_rules()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  equipment_condition public.equipment_condition;
  open_loans_count integer;
begin
  select condition into equipment_condition
    from public.equipments where id = new.equipment_id for update;
  if not found then
    raise exception 'Equipamento não encontrado';
  end if;
  if equipment_condition = 'manutencao' then
    raise exception 'Equipamento em manutenção';
  end if;
  if exists (select 1 from public.loans
             where equipment_id = new.equipment_id and returned_at is null) then
    raise exception 'Equipamento já emprestado';
  end if;

  perform 1 from public.profiles where id = new.borrower_id for update;
  if not found then
    raise exception 'Colaborador não encontrado';
  end if;

  if exists (select 1 from public.loans
             where borrower_id = new.borrower_id
               and returned_at is null and due_at < now()) then
    raise exception 'Você tem empréstimo em atraso';
  end if;

  select count(*) into open_loans_count
    from public.loans
    where borrower_id = new.borrower_id and returned_at is null;
  if open_loans_count >= 5 then
    raise exception 'Limite de 5 empréstimos em aberto atingido';
  end if;

  return new;
end;
$$;

-- Prazo de 14 dias úteis
create or replace function public.request_loan(p_equipment_id uuid)
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
  values (p_equipment_id, auth.uid(), public.add_business_days(now(), 14))
  returning * into created_loan;
  return created_loan;
end;
$$;
