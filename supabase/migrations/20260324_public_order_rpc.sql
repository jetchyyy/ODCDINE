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
    p_notes,
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
  from public.order_items oi
  where oi.order_id = v_order_id;

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
  select v_order_id as order_id, v_order_number as order_number;
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
    'tables', jsonb_build_object(
      'table_name', t.table_name,
      'table_number', t.table_number,
      'table_code', t.table_code
    ),
    'order_items', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', oi.id,
            'menu_item_id', oi.menu_item_id,
            'item_name', oi.item_name,
            'unit_price', oi.unit_price,
            'quantity', oi.quantity,
            'line_total', oi.line_total,
            'notes', oi.notes
          )
          order by oi.created_at asc
        )
        from public.order_items oi
        where oi.order_id = o.id
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

grant execute on function public.create_public_order(text, jsonb, text) to anon, authenticated;
grant execute on function public.get_public_order(uuid) to anon, authenticated;

