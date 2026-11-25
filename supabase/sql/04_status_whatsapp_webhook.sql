-- PATCH opsional untuk mencatat status pengiriman Meta: sent/delivered/read/failed.
-- PRASYARAT: tabel public.pengingat_obat dari migrasi 02 telah ada.
-- Jangan jalankan bila struktur tabel berbeda tanpa meninjau migrasi.
begin;

create schema if not exists private;

alter table public.pengingat_obat drop constraint if exists pengingat_obat_status_check;
alter table public.pengingat_obat add constraint pengingat_obat_status_check
  check (status in (
    'terjadwal','diproses','diajukan_api','dikirim_manual','gagal',
    'dibatalkan','perlu_tinjau','kedaluwarsa',
    'wa_terkirim','wa_diterima','wa_dibaca'
  ));

create unique index if not exists idx_pengingat_wa_message_id
  on public.pengingat_obat(wa_message_id) where wa_message_id is not null;

-- Tabel privat khusus status; tidak menyimpan isi pesan/nomor penerima.
create table if not exists private.wa_delivery_events (
  wa_message_id text primary key,
  stage text not null check (stage in ('sent','delivered','read','failed')),
  updated_at timestamptz not null default now()
);
revoke all on private.wa_delivery_events from public, anon, authenticated;

-- Pilih status tertinggi untuk webhook duplikat / tidak berurutan.
create or replace function private.wa_event_rank(p_stage text)
returns integer language sql immutable set search_path = '' as $$
  select case p_stage
    when 'read' then 3
    when 'delivered' then 2
    when 'sent' then 1
    when 'failed' then 0
    else -1 end;
$$;

-- Synchronize status pengingat dari status delivery paling tinggi.
create or replace function private.sync_wa_reminder(p_message_id text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_stage text;
begin
  select stage into v_stage
  from private.wa_delivery_events
  where wa_message_id=p_message_id;

  if v_stage is null then return; end if;

  update public.pengingat_obat r
  set status = case
      when v_stage='read' then 'wa_dibaca'
      when v_stage='delivered' and r.status <> 'wa_dibaca' then 'wa_diterima'
      when v_stage='sent' and r.status in ('diajukan_api','wa_terkirim') then 'wa_terkirim'
      when v_stage='failed' and r.status in ('diajukan_api','wa_terkirim') then 'gagal'
      else r.status
    end,
    last_error = case when v_stage='failed' then 'WhatsApp melaporkan kegagalan pengiriman' else r.last_error end
  where r.wa_message_id=p_message_id
    and r.status in ('diajukan_api','wa_terkirim','wa_diterima','wa_dibaca','gagal');
end;
$$;

-- Webhook bisa tiba SEBELUM sender mencatat wa_message_id.
-- Trigger berikut menyelaraskan receipt tertunda ketika ID pesan baru tersimpan.
create or replace function private.on_wa_message_id_saved()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.wa_message_id is not null
     and new.wa_message_id is distinct from old.wa_message_id then
    perform private.sync_wa_reminder(new.wa_message_id);
  end if;
  return null;
end;
$$;
drop trigger if exists trg_wa_message_id_saved on public.pengingat_obat;
create trigger trg_wa_message_id_saved
  after update of wa_message_id on public.pengingat_obat
  for each row execute function private.on_wa_message_id_saved();

-- Akses RPC hanya service_role, bukan browser atau admin terautentikasi.
create or replace function public.record_wa_delivery_status(
  p_message_id text, p_stage text
) returns boolean language plpgsql security definer set search_path = '' as $$
begin
  if p_message_id is null or length(p_message_id) < 3 or length(p_message_id)>250
     or p_stage not in ('sent','delivered','read','failed') then
    return false;
  end if;

  insert into private.wa_delivery_events(wa_message_id, stage)
  values (p_message_id, p_stage)
  on conflict (wa_message_id) do update
    set stage = excluded.stage, updated_at=now()
    where private.wa_event_rank(excluded.stage) > private.wa_event_rank(private.wa_delivery_events.stage);

  perform private.sync_wa_reminder(p_message_id);
  return true;
end;
$$;
revoke all on function public.record_wa_delivery_status(text,text) from public, anon, authenticated;
grant execute on function public.record_wa_delivery_status(text,text) to service_role;

commit;
