create or replace function public.auto_journal_block(_trip_id uuid, _user_id uuid, _date date, _type text, _content jsonb, _source_id text)
returns void language plpgsql security definer set search_path = public as $$
declare j uuid; d uuid; pos int;
begin
  select id into j from journals where trip_id = _trip_id and user_id = _user_id limit 1;
  if j is null then return; end if;
  if exists (select 1 from journal_blocks where journal_id = j and content->>'source_id' = _source_id) then return; end if;
  select id into d from journal_days where journal_id = j and date = _date limit 1;
  if d is null then
    select id into d from journal_days where journal_id = j order by abs(date - _date), date limit 1;
  end if;
  if d is null then return; end if;
  select coalesce(max(position), -1) + 1 into pos from journal_blocks where day_id = d;
  insert into journal_blocks (day_id, journal_id, user_id, type, content, position)
  values (d, j, _user_id, _type, _content || jsonb_build_object('source_id', _source_id, 'auto', true), pos);
end $$;
revoke execute on function public.auto_journal_block(uuid, uuid, date, text, jsonb, text) from public, anon, authenticated;

create or replace function public.trg_activity_to_journal()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'done' and (tg_op = 'INSERT' or old.status is distinct from 'done') then
    perform auto_journal_block(new.trip_id, new.user_id,
      coalesce(new.day_date, (coalesce(new.completed_at, now()))::date), 'location',
      jsonb_build_object('name', new.title, 'lat', new.lat, 'lng', new.lng, 'category', new.category),
      'activity:' || new.id::text);
  end if;
  return new;
end $$;
drop trigger if exists activity_to_journal on public.trip_activities;
create trigger activity_to_journal after insert or update of status on public.trip_activities
for each row execute function public.trg_activity_to_journal();

create or replace function public.trg_media_to_journal()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.type = 'photo' and new.url is not null then
    perform auto_journal_block(new.trip_id, new.user_id, new.created_at::date, 'photo',
      jsonb_build_object('url', new.url, 'caption', new.caption), 'media:' || new.id::text);
  end if;
  return new;
end $$;
drop trigger if exists media_to_journal on public.explore_node_media;
create trigger media_to_journal after insert on public.explore_node_media
for each row execute function public.trg_media_to_journal();

create or replace function public.trg_node_to_journal()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'visited' and (tg_op = 'INSERT' or old.status is distinct from 'visited') then
    perform auto_journal_block(new.trip_id, new.user_id, coalesce(new.visited_at, now())::date, 'location',
      jsonb_build_object('name', new.name, 'lat', new.lat, 'lng', new.lng), 'node:' || new.id::text);
  end if;
  return new;
end $$;
drop trigger if exists node_to_journal on public.explore_nodes;
create trigger node_to_journal after insert or update of status on public.explore_nodes
for each row execute function public.trg_node_to_journal();

revoke execute on function public.trg_activity_to_journal() from public, anon, authenticated;
revoke execute on function public.trg_media_to_journal() from public, anon, authenticated;
revoke execute on function public.trg_node_to_journal() from public, anon, authenticated;