-- Add 'note' column to orders table for general order note
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS "note" text;

-- (Optional) If you want to clean up the previous attempt:
-- ALTER TABLE order_items DROP COLUMN IF EXISTS "note";
