-- Add 'note' column to order_items for customer special requests
ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS "note" text;

-- Ensure RLS is updated (though existing logic was permissive)
-- No new policies needed as long as existing one covers ALL
