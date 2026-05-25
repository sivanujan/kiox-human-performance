-- CREATE UPDATE POLICY ON MESSAGES TO ALLOW STATUS TRANSITIONS (sent -> delivered -> seen)
DROP POLICY IF EXISTS "Users can update message status" ON public.messages;
CREATE POLICY "Users can update message status" 
ON public.messages FOR UPDATE 
TO authenticated
USING (auth.uid() = participant_1 OR auth.uid() = participant_2)
WITH CHECK (auth.uid() = participant_1 OR auth.uid() = participant_2);
