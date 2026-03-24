# ODCDine

ODCDine is a QR-based restaurant and cafe ordering system built for a single business deployment. Customers can scan a table QR code, browse the menu, place an order, and track its status in real time, while staff manage operations through separate admin and kitchen views.

## What the system does

- Public ordering flow for guests without requiring login
- Table-based QR menu access
- Cart and order checkout experience
- Real-time order tracking for customers
- Admin dashboard for orders, menu items, categories, tables, staff, settings, and analytics
- Kitchen board for preparation-focused order handling
- Role-based access for `admin`, `cashier`, `kitchen`, and `waiter`
- Supabase-backed authentication, database, storage, and realtime updates

## Main flows

### Customer side

- Open `/menu/:tableCode`
- Add items to cart
- Submit an order from the table
- Track progress at `/track/:orderId`

### Staff side

- Log in through the staff portal
- Manage menu categories and items
- Create and manage tables with QR-ready table codes
- Monitor incoming orders
- Update order status as service progresses
- View business settings and analytics

## Tech stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- TanStack Query
- Zustand
- Supabase Auth
- Supabase Postgres
- Supabase Storage
- Supabase Realtime

## Database overview

The Supabase schema includes the core entities needed for restaurant operations:

- `business_settings` for brand and operational configuration
- `profiles` for staff accounts and roles
- `tables` for dine-in table setup and QR access
- `categories` and `menu_items` for the menu
- `table_sessions` for active dining sessions
- `orders`, `order_items`, and `order_status_logs` for the order lifecycle
- `payments` for cashier-side payment records

The repository also includes SQL bootstrap data in [supabase/bootstrap_admin.sql](/c:/odcdine/supabase/bootstrap_admin.sql) for initial business settings, an admin profile, sample tables, categories, and menu items.

## Project structure

- [src](/c:/odcdine/src) contains the React app
- [supabase](/c:/odcdine/supabase) contains the schema and seed scripts
- [docs/system-architecture.md](/c:/odcdine/docs/system-architecture.md) describes the overall architecture
- [docs/implementation-roadmap.md](/c:/odcdine/docs/implementation-roadmap.md) outlines the planned rollout

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment values into `.env`:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_PUBLIC_SITE_URL=https://your-domain.com
```

3. Apply the SQL in [supabase/schema.sql](/c:/odcdine/supabase/schema.sql) to your Supabase project.
4. Run the seed script in [supabase/bootstrap_admin.sql](/c:/odcdine/supabase/bootstrap_admin.sql).
5. Start the app:

```bash
npm run dev
```

## Current status

This project already includes the core QR ordering architecture, staff role model, realtime order updates, and the main admin and kitchen interfaces. It is well suited as a starting point for a dine-in digital ordering system for a coffee shop, cafe, or small restaurant.
