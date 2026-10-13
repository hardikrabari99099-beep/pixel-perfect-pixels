create type public.app_role as enum ('admin','user');
create table public.user_roles (id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete cascade not null, role app_role not null, unique(user_id, role));
grant select on public.user_roles to authenticated; grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create or replace function public.has_role(_user_id uuid, _role app_role) returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.user_roles where user_id=_user_id and role=_role) $$;
create policy "own roles" on public.user_roles for select to authenticated using (user_id = auth.uid());

-- first signed-up user becomes admin
create or replace function public.handle_first_admin() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if not exists (select 1 from public.user_roles where role='admin') then
    insert into public.user_roles(user_id, role) values (new.id, 'admin');
  end if;
  return new;
end $$;
create trigger on_auth_user_first_admin after insert on auth.users for each row execute function public.handle_first_admin();

create table public.site_settings (id int primary key default 1 check (id=1), data jsonb not null default '{}'::jsonb, updated_at timestamptz not null default now());
grant select on public.site_settings to anon, authenticated; grant update, insert on public.site_settings to authenticated; grant all on public.site_settings to service_role;
alter table public.site_settings enable row level security;
create policy "public read settings" on public.site_settings for select to anon, authenticated using (true);
create policy "admin update settings" on public.site_settings for update to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "admin insert settings" on public.site_settings for insert to authenticated with check (public.has_role(auth.uid(),'admin'));
insert into public.site_settings(id, data) values (1, '{
 "heroEyebrow":"Navratri 2026 · Surat","heroTitle":"Surat Ni Navratri,","heroTitleAccent":"Aapno Pass.",
 "heroText":"Discover Surat''s best Navratri events, book your pass online, and get your personalized digital pass instantly.",
 "featuredTitle":"Featured events","tagline":"Surat Ni Navratri, Aapno Pass.","supportLine":"Find. Book. Celebrate.",
 "steps":["Find|Browse garba nights across Vesu, Adajan, Piplod and more.","Book|Pick your pass, pay via UPI and submit your UTR.","Celebrate|Once verified, download your PDF pass with QR."],
 "contactPhone":"+91 98765 43210","contactEmail":"hello@aapnopass.in","contactAddress":"Surat, Gujarat","whatsapp":"919876543210",
 "contactText":"Questions about a booking or listing your event? Reach out.",
 "upiId":"aapnopass@upi","upiName":"AapnoPass","paymentNote":"Scan the QR with any UPI app (GPay, PhonePe, Paytm), pay the exact amount, then enter the 12-digit UTR number.",
 "footerText":"© 2026 AapnoPass, Surat"}'::jsonb);

create table public.events (id text primary key, name text not null, venue text not null default '', area text not null default '', dates text not null default '', time text not null default '', artist text not null default '', tag text not null default '', about text not null default '', nights text[] not null default '{}', passes jsonb not null default '[]'::jsonb, active boolean not null default true, sort int not null default 0, created_at timestamptz not null default now());
grant select on public.events to anon, authenticated; grant insert, update, delete on public.events to authenticated; grant all on public.events to service_role;
alter table public.events enable row level security;
create policy "public read active events" on public.events for select to anon, authenticated using (active or public.has_role(auth.uid(),'admin'));
create policy "admin write events" on public.events for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

insert into public.events(id,name,venue,area,dates,time,artist,tag,about,nights,passes,sort)
select v.id,v.name,v.venue,v.area,'3 – 11 Oct','8:00 PM onwards',v.artist,v.tag,v.about,
 array['3 Oct 2026','4 Oct 2026','5 Oct 2026','6 Oct 2026','7 Oct 2026','8 Oct 2026','9 Oct 2026','10 Oct 2026','11 Oct 2026'],
 jsonb_build_array(
  jsonb_build_object('id','single','name','Single Day','price',v.base,'desc','Entry for any one night','left',240,'season',false),
  jsonb_build_object('id','couple','name','Couple Pass','price',round(v.base*1.8),'desc','Entry for two, one night','left',120,'season',false),
  jsonb_build_object('id','season','name','Season Pass','price',v.base*7,'desc','All 9 nights, one person','left',60,'season',true),
  jsonb_build_object('id','vip','name','VIP Season','price',v.base*14,'desc','All nights, lounge & front circle','left',15,'season',true,'vip',true)), v.sort
from (values
 ('rangilo-raas','Rangilo Raas Utsav','Sarsana Dome Grounds','Sarsana','Kinjal Dave','Most booked','Surat''s biggest open-air garba with live orchestra and a 40,000 sq ft arena.',599,1),
 ('vesu-garba','Vesu Garba Mahotsav','VR Mall Grounds','Vesu','Aishwarya Majmudar','Premium','A premium family-friendly Navratri with curated food court and VIP lounge.',799,2),
 ('adajan-dandiya','Adajan Dandiya Night','Riverfront Plot','Adajan','Geeta Rabari','Riverside','Traditional dandiya by the Tapi river, folk-first and community driven.',449,3),
 ('piplod-nights','Piplod Navratri Nights','SVNIT Ground','Piplod','Osman Mir','New','Youth-favourite garba with modern beats and traditional rounds.',399,4)
) as v(id,name,venue,area,artist,tag,about,base,sort);

create table public.bookings (id text primary key, event_id text not null, event_name text not null, pass_id text not null, pass_name text not null, qty int not null check (qty between 1 and 10), name text not null, phone text not null, email text not null, night text not null, total int not null, utr text not null, status text not null default 'pending' check (status in ('pending','approved','rejected','used')), created_at timestamptz not null default now());
grant insert on public.bookings to anon, authenticated; grant select, update, delete on public.bookings to authenticated; grant all on public.bookings to service_role;
alter table public.bookings enable row level security;
create policy "anyone create pending booking" on public.bookings for insert to anon, authenticated with check (status='pending' and length(utr) between 6 and 30);
create policy "admin read bookings" on public.bookings for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "admin update bookings" on public.bookings for update to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "admin delete bookings" on public.bookings for delete to authenticated using (public.has_role(auth.uid(),'admin'));

-- public lookup by exact id only
create or replace function public.get_bookings(_ids text[]) returns setof public.bookings language sql stable security definer set search_path=public as $$ select * from public.bookings where id = any(_ids) $$;
grant execute on function public.get_bookings(text[]) to anon, authenticated;