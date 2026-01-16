-- Add username and password to cafes for independent login
ALTER TABLE cafes ADD COLUMN IF NOT EXISTS username text UNIQUE;
ALTER TABLE cafes ADD COLUMN IF NOT EXISTS password text;

-- Add a secure token to tables to replace predictable IDs
ALTER TABLE tables ADD COLUMN IF NOT EXISTS token uuid DEFAULT gen_random_uuid();

-- Update existing cafes with credentials (if they exist, otherwise insert)
INSERT INTO cafes (name, slug, username, password) VALUES
('Merkez Kafe', 'merkez-kafe', 'merkez', 'merkez123'),
('Sahil Kafe', 'sahil-kafe', 'sahil', 'sahil123'),
('Kampüs Kafe', 'kampus-kafe', 'kampus', 'kampus123')
ON CONFLICT (slug) DO UPDATE SET 
username = EXCLUDED.username,
password = EXCLUDED.password;

-- Clear existing products and tables to ensure clean state with new logic
TRUNCATE products, tables, orders, order_items RESTART IDENTITY CASCADE;

-- Insert 9 Standard Products for EACH Cafe
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT id FROM cafes LOOP
        INSERT INTO products (cafe_id, name, category, price, description, image_url) VALUES
        (r.id, 'Türk Kahvesi', 'İçecekler', 60, 'Geleneksel Türk Kahvesi, lokum ile.', 'https://images.unsplash.com/photo-1599305090598-fe179d501227?auto=format&fit=crop&q=80&w=600'),
        (r.id, 'Filtre Kahve', 'İçecekler', 70, 'Taze demlenmiş 100% Arabica.', 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&q=80&w=600'),
        (r.id, 'Limonata', 'İçecekler', 80, 'Ev yapımı taze naneli limonata.', 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=600'),
        (r.id, 'Cheesecake', 'Tatlılar', 120, 'Limonlu veya Frambuazlı seçenekleriyle.', 'https://images.unsplash.com/photo-1524351199678-941a58a3df50?auto=format&fit=crop&q=80&w=600'),
        (r.id, 'Tiramisu', 'Tatlılar', 130, 'İtalyan usulü orijinal lezzet.', 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&q=80&w=600'),
        (r.id, 'Cookie', 'Tatlılar', 50, 'Çikolata parçacıklı dev kurabiye.', 'https://images.unsplash.com/photo-1499636138143-bd649043ea52?auto=format&fit=crop&q=80&w=600'),
        (r.id, 'Hamburger', 'Yiyecekler', 250, '180gr dana eti, patates kızartması ile.', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=600'),
        (r.id, 'Tost', 'Yiyecekler', 100, 'Kaşarlı veya karışık bazlama tostu.', 'https://images.unsplash.com/photo-1554401566-b25867a5b3a4?auto=format&fit=crop&q=80&w=600'),
        (r.id, 'Sezar Salata', 'Yiyecekler', 180, 'Izgara tavuk, kruton ve özel sos.', 'https://images.unsplash.com/photo-1550304999-8f6953e36f9c?auto=format&fit=crop&q=80&w=600');
        
        -- Insert Initial Tables for each cafe (Start with 5 tables)
        INSERT INTO tables (cafe_id, name, token, status) VALUES
        (r.id, 'Masa 1', gen_random_uuid(), 'empty'),
        (r.id, 'Masa 2', gen_random_uuid(), 'empty'),
        (r.id, 'Masa 3', gen_random_uuid(), 'empty'),
        (r.id, 'Masa 4', gen_random_uuid(), 'empty'),
        (r.id, 'Masa 5', gen_random_uuid(), 'empty');
    END LOOP;
END $$;
