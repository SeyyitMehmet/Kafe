-- Add paid_at column for grouping receipts
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS paid_at timestamptz DEFAULT NULL;

-- Index for performance on sorting/filtering history
CREATE INDEX IF NOT EXISTS idx_orders_paid_at ON public.orders(paid_at);

-- Comment: This column will be set to NOW() when a table is cleared (paid).
-- We will use this timestamp to group multiple order rows into a single "Receipt".
