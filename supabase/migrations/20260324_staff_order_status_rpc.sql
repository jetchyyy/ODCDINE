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

grant execute on function public.staff_update_order_status(uuid, order_status) to authenticated;
