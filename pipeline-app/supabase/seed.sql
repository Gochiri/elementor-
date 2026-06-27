-- Seed opcional: proyecto Ágave Azul de ejemplo, fresco (sin artefactos; el trigger crea los 8 pasos en 'pending').
-- Ejecutar tras schema.sql. Idempotente por nombre. Puedes saltártelo si quieres la BD vacía.

insert into public.projects (name, domain, briefing_doc_urls, structure_sheet_urls, relume_urls, status)
select
  'Ágave Azul',
  null,
  array['https://docs.google.com/document/d/1_eR6KAzV5k7gcFPi-SbJIXzw_-MSGd_6v8i5ykET8r0'],
  array['https://docs.google.com/spreadsheets/d/1Ss0YtWYPeykajQWBs0try5cLd6Fp5SZO'],
  array['https://www.relume.io/app/project/P3401133_R8XmMrXFFLlc_bJ2zKHe5osdsgA7O_YgVVBAOv4n4OE'],
  'active'
where not exists (select 1 from public.projects where name = 'Ágave Azul');
