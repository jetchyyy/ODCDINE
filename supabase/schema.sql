create extension if not exists pgcrypto;

create type app_role as enum ('admin', 'cashier', 'kitchen', 'waiter');
create type order_status as enum ('pending', 'confirmed', 'preparing', 'ready_to_serve', 'served', 'completed', 'cancelled');
create type table_session_status as enum ('open', 'closed');
create type payment_method as enum ('cash', 'card', 'gcash', 'maya', 'bank_transfer');
create type payment_status as enum ('pending', 'paid', 'failed', 'refunded');

create or replace function public.generate_table_code()
returns text
language sql
as $$
  select encode(gen_random_bytes(12), 'hex');
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text not null,
  role app_role not null,
  created_at timestamptz not null default now()
);

create or replace function public.current_app_role()
returns app_role
language sql
stable
as $$
  select role
  from public.profiles
  where id = auth.uid();
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
as $$
  select public.current_app_role() is not null;
$$;

create table public.business_settings (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  logo_url text,
  contact_number text not null,
  address text not null,
  tax_rate numeric(5,4) not null default 0.12 check (tax_rate >= 0 and tax_rate <= 1),
  service_charge_rate numeric(5,4) not null default 0.10 check (service_charge_rate >= 0 and service_charge_rate <= 1),
  currency text not null default 'PHP',
  opening_hours jsonb not null default '{"mon":"07:00-22:00","tue":"07:00-22:00","wed":"07:00-22:00","thu":"07:00-22:00","fri":"07:00-22:00","sat":"07:00-22:00","sun":"07:00-22:00"}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index business_settings_singleton_idx on public.business_settings ((true));

create table public.tables (
  id uuid primary key default gen_random_uuid(),
  table_number integer not null unique,
  table_name text not null,
  table_code text not null unique default public.generate_table_code(),
  qr_code_url text,
  capacity integer not null default 2 check (capacity > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tables_active_idx on public.tables (is_active, table_number);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text not null default '',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index categories_active_sort_idx on public.categories (is_active, sort_order, name);

create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete restrict,
  name text not null unique,
  description text not null default '',
  price numeric(12,2) not null check (price >= 0),
  image_url text,
  is_available boolean not null default true,
  is_featured boolean not null default false,
  preparation_time_minutes integer not null default 5 check (preparation_time_minutes >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index menu_items_category_idx on public.menu_items (category_id, is_available, is_featured);
create index menu_items_available_idx on public.menu_items (is_available, name);

create table public.table_sessions (
  id uuid primary key default gen_random_uuid(),
  table_id uuid not null references public.tables(id) on delete restrict,
  session_code text not null unique default public.generate_table_code(),
  status table_session_status not null default 'open',
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index table_sessions_one_open_per_table_idx on public.table_sessions (table_id) where status = 'open';

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  table_id uuid not null references public.tables(id) on delete restrict,
  table_session_id uuid references public.table_sessions(id) on delete restrict,
  order_number text not null unique,
  status order_status not null default 'pending',
  subtotal numeric(12,2) not null check (subtotal >= 0),
  tax_amount numeric(12,2) not null default 0 check (tax_amount >= 0),
  service_charge_amount numeric(12,2) not null default 0 check (service_charge_amount >= 0),
  total numeric(12,2) not null check (total >= 0),
  notes text,
  source text not null default 'qr' check (source in ('qr')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index orders_status_created_at_idx on public.orders (status, created_at desc);
create index orders_table_id_idx on public.orders (table_id, created_at desc);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  menu_item_id uuid references public.menu_items(id) on delete set null,
  item_name text not null,
  unit_price numeric(12,2) not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  line_total numeric(12,2) not null check (line_total >= 0),
  notes text,
  created_at timestamptz not null default now()
);

create index order_items_order_id_idx on public.order_items (order_id, created_at);

create table public.order_status_logs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status order_status not null,
  changed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index order_status_logs_order_id_idx on public.order_status_logs (order_id, created_at desc);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  payment_method payment_method not null,
  amount_paid numeric(12,2) not null check (amount_paid >= 0),
  payment_status payment_status not null default 'pending',
  reference_number text,
  created_at timestamptz not null default now()
);

create trigger set_business_settings_updated_at before update on public.business_settings for each row execute function public.set_updated_at();
create trigger set_tables_updated_at before update on public.tables for each row execute function public.set_updated_at();
create trigger set_categories_updated_at before update on public.categories for each row execute function public.set_updated_at();
create trigger set_menu_items_updated_at before update on public.menu_items for each row execute function public.set_updated_at();
create trigger set_orders_updated_at before update on public.orders for each row execute function public.set_updated_at();

create or replace function public.ensure_open_table_session(p_table_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  active_session_id uuid;
begin
  select id
  into active_session_id
  from public.table_sessions
  where table_id = p_table_id and status = 'open'
  limit 1;

  if active_session_id is null then
    insert into public.table_sessions (table_id)
    values (p_table_id)
    returning id into active_session_id;
  end if;

  return active_session_id;
end;
$$;

create or replace function public.create_public_order(
  p_table_code text,
  p_items jsonb,
  p_notes text default null
)
returns table(order_id uuid, order_number text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_table_id uuid;
  v_session_id uuid;
  v_order_id uuid;
  v_order_number text;
  v_subtotal numeric(12,2);
  v_tax_rate numeric(5,4);
  v_service_charge_rate numeric(5,4);
  v_inserted_count integer;
begin
  if p_table_code is null or btrim(p_table_code) = '' then
    raise exception 'Table code is required.';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Order items are required.';
  end if;

  select id
  into v_table_id
  from public.tables
  where table_code = p_table_code
    and is_active = true
  limit 1;

  if v_table_id is null then
    raise exception 'Invalid or inactive table.';
  end if;

  select tax_rate, service_charge_rate
  into v_tax_rate, v_service_charge_rate
  from public.business_settings
  limit 1;

  if v_tax_rate is null then
    raise exception 'Business settings have not been configured.';
  end if;

  v_session_id := public.ensure_open_table_session(v_table_id);
  v_order_number := concat(
    'ORD-',
    to_char(now(), 'YYYYMMDDHH24MISS'),
    '-',
    upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6))
  );

  insert into public.orders (
    table_id,
    table_session_id,
    order_number,
    status,
    subtotal,
    tax_amount,
    service_charge_amount,
    total,
    notes,
    source
  ) values (
    v_table_id,
    v_session_id,
    v_order_number,
    'pending',
    0,
    0,
    0,
    0,
    nullif(p_notes, ''),
    'qr'
  )
  returning id into v_order_id;

  insert into public.order_items (
    order_id,
    menu_item_id,
    item_name,
    unit_price,
    quantity,
    line_total,
    notes
  )
  select
    v_order_id,
    mi.id,
    mi.name,
    mi.price,
    greatest((item.value ->> 'quantity')::integer, 1),
    mi.price * greatest((item.value ->> 'quantity')::integer, 1),
    nullif(item.value ->> 'notes', '')
  from jsonb_array_elements(p_items) as item(value)
  join public.menu_items mi
    on mi.id = (item.value ->> 'menu_item_id')::uuid
  where mi.is_available = true;

  get diagnostics v_inserted_count = row_count;

  if v_inserted_count = 0 then
    raise exception 'No valid available items were submitted.';
  end if;

  select coalesce(sum(line_total), 0)
  into v_subtotal
  from public.order_items
  where order_id = v_order_id;

  update public.orders
  set
    subtotal = v_subtotal,
    tax_amount = round(v_subtotal * v_tax_rate, 2),
    service_charge_amount = round(v_subtotal * v_service_charge_rate, 2),
    total = round(v_subtotal + (v_subtotal * v_tax_rate) + (v_subtotal * v_service_charge_rate), 2)
  where id = v_order_id;

  insert into public.order_status_logs (order_id, status, changed_by)
  values (v_order_id, 'pending', null);

  return query
  select v_order_id, v_order_number;
end;
$$;

create or replace function public.get_public_order(p_order_id uuid)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'id', o.id,
    'table_id', o.table_id,
    'order_number', o.order_number,
    'status', o.status,
    'subtotal', o.subtotal,
    'tax_amount', o.tax_amount,
    'service_charge_amount', o.service_charge_amount,
    'total', o.total,
    'notes', o.notes,
    'source', o.source,
    'created_at', o.created_at,
    'updated_at', o.updated_at,
    'tables', jsonb_build_object(
      'table_name', t.table_name,
      'table_number', t.table_number
    ),
    'order_items', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', oi.id,
            'order_id', oi.order_id,
            'menu_item_id', oi.menu_item_id,
            'item_name', oi.item_name,
            'unit_price', oi.unit_price,
            'quantity', oi.quantity,
            'line_total', oi.line_total,
            'notes', oi.notes,
            'created_at', oi.created_at
          )
          order by oi.created_at asc
        )
        from public.order_items oi
        where oi.order_id = o.id
      ),
      '[]'::jsonb
    ),
    'order_status_logs', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', osl.id,
            'order_id', osl.order_id,
            'status', osl.status,
            'changed_by', osl.changed_by,
            'created_at', osl.created_at,
            'profiles', case
              when p.id is not null then jsonb_build_object('full_name', p.full_name)
              else null
            end
          )
          order by osl.created_at asc
        )
        from public.order_status_logs osl
        left join public.profiles p on p.id = osl.changed_by
        where osl.order_id = o.id
      ),
      '[]'::jsonb
    )
  )
  from public.orders o
  join public.tables t on t.id = o.table_id
  where o.id = p_order_id
    and o.source = 'qr'
  limit 1;
$$;

create or replace function public.staff_update_order_status(
  p_order_id uuid,
  p_status order_status
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role app_role;
  v_order public.orders%rowtype;
begin
  select public.current_app_role() into v_role;

  if v_role is null then
    raise exception 'Authentication required.';
  end if;

  if v_role not in ('admin', 'cashier', 'kitchen', 'waiter') then
    raise exception 'Not allowed to update order status.';
  end if;

  update public.orders
  set status = p_status
  where id = p_order_id
  returning * into v_order;

  if v_order.id is null then
    raise exception 'Order not found.';
  end if;

  insert into public.order_status_logs (order_id, status, changed_by)
  values (v_order.id, p_status, auth.uid());

  return v_order;
end;
$$;

grant execute on function public.create_public_order(text, jsonb, text) to anon, authenticated;
grant execute on function public.get_public_order(uuid) to anon, authenticated;
grant execute on function public.staff_update_order_status(uuid, order_status) to authenticated;

alter table public.profiles enable row level security;
alter table public.business_settings enable row level security;
alter table public.tables enable row level security;
alter table public.categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.table_sessions enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_logs enable row level security;
alter table public.payments enable row level security;

create policy "staff read own and peer profiles" on public.profiles for select to authenticated using (public.is_staff());
create policy "admin manage profiles" on public.profiles for all to authenticated using (public.current_app_role() = 'admin') with check (public.current_app_role() = 'admin');
create policy "public read business settings" on public.business_settings for select to anon, authenticated using (true);
create policy "admin manage business settings" on public.business_settings for all to authenticated using (public.current_app_role() = 'admin') with check (public.current_app_role() = 'admin');
create policy "public read active tables" on public.tables for select to anon, authenticated using (is_active = true);
create policy "admin manage tables" on public.tables for all to authenticated using (public.current_app_role() = 'admin') with check (public.current_app_role() = 'admin');
create policy "public read active categories" on public.categories for select to anon, authenticated using (is_active = true or public.is_staff());
create policy "admin manage categories" on public.categories for all to authenticated using (public.current_app_role() = 'admin') with check (public.current_app_role() = 'admin');
create policy "public read menu items" on public.menu_items for select to anon, authenticated using (is_available = true or public.is_staff());
create policy "admin manage menu items" on public.menu_items for all to authenticated using (public.current_app_role() = 'admin') with check (public.current_app_role() = 'admin');
create policy "staff read table sessions" on public.table_sessions for select to authenticated using (public.is_staff());
create policy "staff manage table sessions" on public.table_sessions for all to authenticated using (public.current_app_role() in ('admin', 'cashier', 'waiter')) with check (public.current_app_role() in ('admin', 'cashier', 'waiter'));
create policy "staff read orders" on public.orders for select to authenticated using (public.is_staff());
create policy "staff update orders" on public.orders for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "staff read order items" on public.order_items for select to authenticated using (public.is_staff());
create policy "staff read order status logs" on public.order_status_logs for select to authenticated using (public.is_staff());
create policy "staff insert order status logs" on public.order_status_logs for insert to authenticated with check (public.is_staff());
create policy "cashier manage payments" on public.payments for all to authenticated using (public.current_app_role() in ('admin', 'cashier')) with check (public.current_app_role() in ('admin', 'cashier'));

insert into storage.buckets (id, name, public)
values
  ('menu-images', 'menu-images', true),
  ('branding', 'branding', true)
on conflict (id) do nothing;

create policy "public read branding files" on storage.objects for select to anon, authenticated using (bucket_id = 'branding');
create policy "public read menu images" on storage.objects for select to anon, authenticated using (bucket_id = 'menu-images');
create policy "admin upload branding files" on storage.objects for insert to authenticated with check (bucket_id = 'branding' and public.current_app_role() = 'admin');
create policy "admin update branding files" on storage.objects for update to authenticated using (bucket_id = 'branding' and public.current_app_role() = 'admin') with check (bucket_id = 'branding' and public.current_app_role() = 'admin');
create policy "admin upload menu images" on storage.objects for insert to authenticated with check (bucket_id = 'menu-images' and public.current_app_role() = 'admin');
create policy "admin update menu images" on storage.objects for update to authenticated using (bucket_id = 'menu-images' and public.current_app_role() = 'admin') with check (bucket_id = 'menu-images' and public.current_app_role() = 'admin');

create or replace function public.broadcast_public_order_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id text;
begin
  v_order_id := coalesce(new.id::text, old.id::text);

  perform realtime.broadcast_changes(
    'public-order:' || v_order_id,
    TG_OP,
    'order-updated',
    TG_TABLE_NAME,
    TG_TABLE_SCHEMA,
    new,
    old
  );

  return coalesce(new, old);
end;
$$;

create or replace function public.broadcast_public_order_status_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform realtime.broadcast_changes(
    'public-order:' || new.order_id::text,
    TG_OP,
    'status-changed',
    TG_TABLE_NAME,
    TG_TABLE_SCHEMA,
    new,
    old
  );

  return coalesce(new, old);
end;
$$;

drop trigger if exists broadcast_public_order_update_trigger on public.orders;
create trigger broadcast_public_order_update_trigger after insert or update on public.orders for each row execute function public.broadcast_public_order_update();

drop trigger if exists broadcast_public_order_status_update_trigger on public.order_status_logs;
create trigger broadcast_public_order_status_update_trigger after insert on public.order_status_logs for each row execute function public.broadcast_public_order_status_update();

create policy "public listen public-order channels" on realtime.messages for select to anon, authenticated using (split_part(realtime.topic(), ':', 1) = 'public-order');
