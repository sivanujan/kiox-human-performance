-- ADD STATUS COLUMN TO MESSAGES FOR WHATSAPP-STYLE READ TICKS
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'seen'));

-- BACKFILL EXISTING MESSAGES TO SEEN
UPDATE public.messages SET status = 'seen' WHERE status IS NULL;
