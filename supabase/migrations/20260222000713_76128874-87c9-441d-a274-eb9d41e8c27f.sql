
-- Create access codes table for temporary admin access
CREATE TABLE public.admin_access_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  label TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_access_codes ENABLE ROW LEVEL SECURITY;

-- Only allow read via anon for login check
CREATE POLICY "Anyone can check codes" ON public.admin_access_codes
  FOR SELECT USING (true);

-- Admin can insert/update/delete via service role (edge function)
-- For now allow authenticated admin inserts from client
CREATE POLICY "Admins can manage codes" ON public.admin_access_codes
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));
