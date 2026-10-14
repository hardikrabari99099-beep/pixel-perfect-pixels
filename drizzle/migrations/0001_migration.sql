alter table public.bookings alter column utr drop not null;
alter table public.bookings add column if not exists stock_applied boolean not null default false;
drop policy if exists "anyone create pending booking" on public.bookings;
create policy "anyone create pending booking" on public.bookings for insert to anon, authenticated with check (status='pending' and stock_applied=false and (utr is null or length(utr) between 6 and 30));

-- customer can attach a UTR to their own pending booking (knows the id)
create or replace function public.attach_utr(_id text, _utr text) returns void language plpgsql security definer set search_path=public as $$
begin
  if _utr !~ '^[A-Za-z0-9]{6,30}$' then raise exception 'invalid utr'; end if;
  update public.bookings set utr=_utr where id=_id and status='pending';
end $$;
grant execute on function public.attach_utr(text,text) to anon, authenticated;

-- idempotent stock reduction: only once per booking, when it first becomes paid
create or replace function public.apply_stock() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.status in ('approved','used') and not old.stock_applied then
    update public.events set passes = (
      select jsonb_agg(case when p->>'id' = new.pass_id then jsonb_set(p,'{left}', to_jsonb(greatest(0,(p->>'left')::int - new.qty))) else p end)
      from jsonb_array_elements(passes) p) where id = new.event_id;
    new.stock_applied := true;
  end if;
  return new;
end $$;
create trigger bookings_apply_stock before update on public.bookings for each row execute function public.apply_stock();