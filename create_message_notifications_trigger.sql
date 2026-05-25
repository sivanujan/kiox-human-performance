-- CREATE SYSTEM TRIGGER TO GENERATE NOTIFICATION ON NEW MESSAGES
-- When a new message is inserted, this trigger automatically populates the recipient's system_notifications feed.

CREATE OR REPLACE FUNCTION public.create_message_system_notification()
RETURNS TRIGGER AS $$
DECLARE
  recipient_uuid UUID;
  sender_name TEXT;
BEGIN
  -- Determine the recipient (the participant who is NOT the sender)
  IF NEW.sender_id = NEW.participant_1 THEN
    recipient_uuid := NEW.participant_2;
  ELSE
    recipient_uuid := NEW.participant_1;
  END IF;

  -- Fetch sender name to make the notification look highly premium
  SELECT COALESCE(first_name || ' ' || last_name, username, 'Someone')
  INTO sender_name
  FROM public.profiles
  WHERE id = NEW.sender_id;

  -- Insert the notification into public.system_notifications
  INSERT INTO public.system_notifications (recipient_id, sender_id, title, message, type)
  VALUES (
    recipient_uuid,
    NEW.sender_id,
    'NEW CHAT MESSAGE',
    sender_name || ': ' || NEW.message,
    'MESSAGE'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_create_message_system_notification ON public.messages;
CREATE TRIGGER tr_create_message_system_notification
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.create_message_system_notification();
