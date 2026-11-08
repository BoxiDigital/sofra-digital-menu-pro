-- ==============================================
-- Fix: Ensure RLS policies exist on menu_analytics
-- ==============================================

-- Ensure RLS is enabled
ALTER TABLE public.menu_analytics ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist (clean slate)
DROP POLICY IF EXISTS "Allow anon insert" ON public.menu_analytics;
DROP POLICY IF EXISTS "Allow authenticated select" ON public.menu_analytics;

-- CRITICAL: Allow anonymous visitors to insert analytics events
CREATE POLICY "Allow anon insert"
  ON public.menu_analytics
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow authenticated owners to read analytics
CREATE POLICY "Allow authenticated select"
  ON public.menu_analytics
  FOR SELECT
  TO authenticated
  USING (true);

-- Verify policies were created
SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'menu_analytics';