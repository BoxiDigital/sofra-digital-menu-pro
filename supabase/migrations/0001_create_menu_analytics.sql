-- Create menu_analytics table for tracking page views and WhatsApp clicks

CREATE TABLE IF NOT EXISTS public.menu_analytics (
  id BIGSERIAL PRIMARY KEY,
  restaurant_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('scan_view', 'whatsapp_click')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_menu_analytics_restaurant ON public.menu_analytics(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_analytics_event ON public.menu_analytics(restaurant_id, event_type);

-- Enable Row Level Security
ALTER TABLE public.menu_analytics ENABLE ROW LEVEL SECURITY;

-- Allow anonymous visitors to insert analytics events (tracking page views & clicks)
CREATE POLICY "Allow anon insert"
  ON public.menu_analytics
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow authenticated users to read analytics (app code filters by restaurant_id)
CREATE POLICY "Allow authenticated select"
  ON public.menu_analytics
  FOR SELECT
  TO authenticated
  USING (true);