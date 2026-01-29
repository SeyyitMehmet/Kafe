-- Add is_active column to products table for stock management
-- Run this SQL in Supabase SQL Editor

-- Add the column with default value true (all existing products will be active)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update any null values to true
UPDATE products SET is_active = true WHERE is_active IS NULL;
