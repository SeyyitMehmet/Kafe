-- Add status column to order_items table
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';

-- Update existing items to match their parent order status (optional cleanup)
UPDATE order_items 
SET status = orders.status 
FROM orders 
WHERE order_items.order_id = orders.id;
