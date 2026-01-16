-- 1. Create admin_notifications table
CREATE TABLE IF NOT EXISTS admin_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info', -- 'info', 'warning', 'success', 'error'
    is_read BOOLEAN DEFAULT false,
    cafe_id BIGINT REFERENCES cafes(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Add subscription fields to cafes
ALTER TABLE cafes 
ADD COLUMN IF NOT EXISTS subscription_type TEXT DEFAULT 'monthly', -- 'trial', 'monthly', 'yearly', 'lifetime'
ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN DEFAULT false;

-- Update existing cafes to default values if null
UPDATE cafes SET subscription_type = 'monthly' WHERE subscription_type IS NULL;
UPDATE cafes SET auto_renew = false WHERE auto_renew IS NULL;
