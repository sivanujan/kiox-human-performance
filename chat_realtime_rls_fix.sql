-- 1. ADD PARTICIPANT COLUMNS TO MESSAGES TABLE
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS participant_1 UUID;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS participant_2 UUID;

-- 2. CREATE FUNCTION AND TRIGGER TO AUTOMATICALLY POPULATE THEM ON NEW INSERTS
CREATE OR REPLACE FUNCTION public.populate_message_participants()
RETURNS TRIGGER AS $$
BEGIN
  SELECT participant_1, participant_2 
  INTO new.participant_1, new.participant_2
  FROM public.conversations
  WHERE id = new.conversation_id;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_message_inserted ON public.messages;
CREATE TRIGGER on_message_inserted
  BEFORE INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.populate_message_participants();

-- 3. BACKFILL PARTICIPANTS FOR EXISTING MESSAGES
UPDATE public.messages m
SET participant_1 = c.participant_1,
    participant_2 = c.participant_2
FROM public.conversations c
WHERE m.conversation_id = c.id;

-- 4. DROP SUBQUERY RLS POLICIES AND CREATE DIRECT COLUMN MATCH RLS POLICIES FOR REALTIME
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
CREATE POLICY "Users can view messages in their conversations" 
ON public.messages FOR SELECT 
TO authenticated
USING (auth.uid() = participant_1 OR auth.uid() = participant_2);

DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON public.messages;
CREATE POLICY "Users can insert messages in their conversations" 
ON public.messages FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() = sender_id AND 
  (auth.uid() = participant_1 OR auth.uid() = participant_2)
);

-- 5. RE-CONFIRM SUPABASE REALTIME REPLICATION FOR MESSAGES AND CONVERSATIONS (SAFE CHECK)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;

    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END IF;
END $$;
