-- Spec 002 · T2 · CA-05, CA-06
-- DDL aprovado por Ryan em 2026-11-16. Colunas aceitam nulo: as linhas existentes ficam sem imagem até o envio.
-- O bucket público `equipamentos` é criado pelo script de envio (idempotente), não aqui: no local o Storage
-- pode estar desligado e a tabela storage.buckets não existir durante o `db reset`.

alter table public.equipments
  add column image_path         text,
  add column image_source_id    text,
  add column image_photographer text,
  add column image_source_url   text,
  add column image_license      text,
  add constraint equipments_image_credito_completo check (
    image_path is null or (
      image_source_id is not null and image_photographer is not null
      and image_source_url is not null and image_license is not null
    )
  );

-- Uma mesma foto não aparece em dois equipamentos (CA-05)
create unique index equipments_image_source_id_unique
  on public.equipments (image_source_id)
  where image_source_id is not null;
