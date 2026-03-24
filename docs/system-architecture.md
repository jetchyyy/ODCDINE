# QR Ordering System Architecture

## Scope
- One restaurant or coffee shop per deployment
- One Supabase project per client
- No tenant switching
- No `restaurant_id` scoping
- Business settings centralized for future branding support

## Core apps
- Public ordering app: `/menu/:tableCode`, `/cart/:tableCode`, `/track/:orderId`
- Admin console: menu CMS, table CMS, order monitoring, analytics, settings, staff
- Kitchen board: action-first order preparation view

## Production approach
- React + Vite + TypeScript frontend
- Tailwind CSS for styling
- Zustand for cart and local UI state
- TanStack Query for server state
- Supabase for auth, Postgres, storage, realtime, and RLS
- Service layer between pages and Supabase client for maintainability

## Security model
- Staff users authenticate through Supabase Auth
- `profiles.role` drives authorization
- Public guests do not authenticate
- Public inserts should go through controlled order creation logic
- Sensitive admin tables remain read/write restricted to staff roles

## White-label readiness
- `business_settings` stores business name, logo, rates, address, currency, and operating hours
- UI uses settings/config rather than hardcoded brand text
- Theme extension can later map stored brand config into CSS variables
