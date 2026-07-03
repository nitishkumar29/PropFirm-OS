# CapitalOS Supabase Migration Guide

## Overview
This sprint establishes the backend foundation for CapitalOS using Supabase. It introduces authentication, tenant-scoped tables, RLS, and storage buckets while preserving the current UI design.

## Required Environment Variables
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY

## Steps
1. Create a Supabase project.
2. Apply the SQL schema from server/supabase-schema.sql.
3. Apply storage bucket setup from server/storage-buckets.sql.
4. Apply RLS policies from server/rls-policies.sql.
5. Configure auth redirect settings to /dashboard.
6. Deploy the app and test signup/login flows.

## Notes
- IndexedDB remains as an offline cache only.
- Dashboard, Accounts, Payouts, Broker, and Financial Flow are connected to Supabase.
- Other sections remain unchanged.
