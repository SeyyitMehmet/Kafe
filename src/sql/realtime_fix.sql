-- Enable Realtime for cafes table
-- This allows the ProtectedRoute subscription to receive UPDATE events
-- when the super admin changes the status or subscription date.

-- 1. Add table to publication (Corrected schema)
alter publication supabase_realtime add table "public"."cafes";

-- 2. Ensure RLS allows reading
-- If RLS is enabled on 'cafes', ensure authenticated users can select.
-- CREATE POLICY "Enable read access for all users" ON "public"."cafes" FOR SELECT USING (true);
