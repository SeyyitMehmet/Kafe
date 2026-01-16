-- 1. Modify cafes table to support roles and subscription
ALTER TABLE cafes 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'admin',
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP WITH TIME ZONE;

-- Set existing cafes to 'admin' role and active
UPDATE cafes SET role = 'admin', is_active = true WHERE role IS NULL;

-- 2. Create system_settings table for global configurations like Maintenance Mode
CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL
);

-- Seed initial maintenance mode setting (disabled by default)
INSERT INTO system_settings (key, value)
VALUES ('maintenance_mode', '{"enabled": false}')
ON CONFLICT (key) DO NOTHING;

-- 3. Seed Root Admin User
-- Using INSERT to ensure we have at least one super admin
-- Check if exists first to avoid duplicate errors if run multiple times (though username constraint usually handles this)
INSERT INTO cafes (name, slug, username, password, role, is_active, subscription_end_date)
VALUES (
    'Süper Yönetici', 
    'super-admin', 
    'rootadmin', 
    'rootPassword123', 
    'super_admin', 
    true, 
    '2099-12-31 23:59:59+00' -- Effectively lifetime
)
ON CONFLICT (username) DO NOTHING;
