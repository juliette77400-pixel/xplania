create table if not exists public.places_search_counters (
  day date primary key,
  searches integer not null default 0
);
grant all on public.places_search_counters to service_role;
alter table public.places_search_counters enable row level security;

create or replace function public.record_places_search()
returns integer
language plpgsql
security definer
set search_path to 'public'
as $$
declare new_count integer;
begin
  insert into public.places_search_counters (day, searches)
  values (current_date, 1)
  on conflict (day) do update set searches = public.places_search_counters.searches + 1
  returning searches into new_count;
  return new_count;
end;
$$;
revoke execute on function public.record_places_search() from public, anon, authenticated;
grant execute on function public.record_places_search() to service_role;