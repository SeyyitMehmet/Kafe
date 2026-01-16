-- Add columns for Account Freezing logic
ALTER TABLE public.cafes 
ADD COLUMN IF NOT EXISTS is_frozen BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS frozen_at TIMESTAMPTZ DEFAULT NULL;

-- Ensure Realtime listens to these changes (if not already covered by table-level)
-- The previous 'alter publication' covers the whole table, so no extra step needed here.
