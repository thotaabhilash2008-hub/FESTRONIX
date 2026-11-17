ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS whatsapp_group_link TEXT;
