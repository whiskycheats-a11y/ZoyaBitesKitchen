-- Drop existing restrictive policies for food_items
DROP POLICY IF EXISTS "Admins can insert food items" ON public.food_items;
DROP POLICY IF EXISTS "Admins can update food items" ON public.food_items;
DROP POLICY IF EXISTS "Admins can delete food items" ON public.food_items;

-- Create new policies that allow all roles (admin page has its own password protection)
CREATE POLICY "Allow insert food items" ON public.food_items
FOR INSERT TO public
WITH CHECK (true);

CREATE POLICY "Allow update food items" ON public.food_items
FOR UPDATE TO public
USING (true);

CREATE POLICY "Allow delete food items" ON public.food_items
FOR DELETE TO public
USING (true);

-- Do same for menu_categories
DROP POLICY IF EXISTS "Admins can insert categories" ON public.menu_categories;
DROP POLICY IF EXISTS "Admins can update categories" ON public.menu_categories;
DROP POLICY IF EXISTS "Admins can delete categories" ON public.menu_categories;

CREATE POLICY "Allow insert categories" ON public.menu_categories
FOR INSERT TO public
WITH CHECK (true);

CREATE POLICY "Allow update categories" ON public.menu_categories
FOR UPDATE TO public
USING (true);

CREATE POLICY "Allow delete categories" ON public.menu_categories
FOR DELETE TO public
USING (true);