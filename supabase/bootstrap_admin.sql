-- 1. Create your first staff user in Supabase Dashboard:
--    Authentication -> Users -> Add user
-- 2. Copy the auth user UUID and email
-- 3. Replace the placeholders below and run this file

insert into public.business_settings (
  business_name,
  logo_url,
  contact_number,
  address,
  tax_rate,
  service_charge_rate,
  currency,
  opening_hours
)
values (
  'Your Business Name',
  null,
  '+63 900 000 0000',
  'Your business address',
  0.12,
  0.10,
  'PHP',
  '{"mon":"07:00-22:00","tue":"07:00-22:00","wed":"07:00-22:00","thu":"07:00-22:00","fri":"07:00-22:00","sat":"07:00-22:00","sun":"07:00-22:00"}'::jsonb
)
on conflict do nothing;

insert into public.profiles (id, email, full_name, role)
values ('9569fcdb-3e1e-421a-877f-e12285c214db', 'superadmin@gmail.com', 'Admin User', 'admin')
on conflict (id) do update
set
  email = excluded.email,
  full_name = excluded.full_name,
  role = excluded.role;

insert into public.tables (table_number, table_name, capacity)
values
  (1, 'Table 1', 2),
  (2, 'Table 2', 4),
  (3, 'Table 3', 4)
on conflict (table_number) do nothing;

insert into public.categories (name, description, sort_order)
values
  ('Coffee', 'Fresh brewed coffee and espresso drinks', 1),
  ('Pastries', 'Baked goods and desserts', 2),
  ('Meals', 'Brunch, sandwiches, and plated items', 3)
on conflict (name) do nothing;

insert into public.menu_items (
  category_id,
  name,
  description,
  price,
  image_url,
  is_available,
  is_featured,
  preparation_time_minutes
)
select
  c.id,
  seed.name,
  seed.description,
  seed.price,
  seed.image_url,
  true,
  seed.is_featured,
  seed.preparation_time_minutes
from (
  values
    ('Coffee', 'Americano', 'Hot black coffee', 120.00, '', true, 5),
    ('Coffee', 'Cappuccino', 'Espresso with steamed milk and foam', 150.00, '', true, 6),
    ('Pastries', 'Butter Croissant', 'Fresh-baked laminated pastry', 95.00, '', false, 2),
    ('Meals', 'Chicken Pesto Sandwich', 'Toasted sandwich with pesto and greens', 245.00, '', true, 10)
) as seed(category_name, name, description, price, image_url, is_featured, preparation_time_minutes)
join public.categories c
  on c.name = seed.category_name
where not exists (
  select 1 from public.menu_items mi where mi.name = seed.name
);
