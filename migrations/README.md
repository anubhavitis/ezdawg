# Database Migrations

## Running Migrations

To apply the builder approval migration to your Supabase database:

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `add_builder_approval.sql`
4. Run the SQL query

## Migration: add_builder_approval.sql

This migration adds builder approval tracking to the `agent_wallets` table:
- `builder_approved` (BOOLEAN): Tracks whether user has approved builder fee
- `builder_fee` (INTEGER): Stores approved builder fee in 0.1 basis points format (10000 = 1%)

These fields allow the app to track builder approval status in the database for each user.
