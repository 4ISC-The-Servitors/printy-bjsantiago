CREATE OR REPLACE FUNCTION public.api_insert_chat_message_v2(p_session_id uuid, p_text text, p_role text, p_node_id text DEFAULT NULL::text, p_metadata jsonb DEFAULT NULL::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$

declare

  v_message_id uuid;

  v_customer_id uuid;

  v_final_metadata jsonb;

begin

  -- Get session customer_id

  select customer_id into v_customer_id
  from public.chat_sessions_v2
  where session_id = p_session_id;



  -- Check authorization: must be session owner, admin, or service role

  if v_customer_id is null then

    raise exception 'session not found';

  end if;



  if not (v_customer_id = auth.uid() or priv.is_admin()) then

    raise exception 'not authorized';

  end if;



  -- Build metadata: merge node_id with provided metadata

  v_final_metadata := jsonb_build_object('node_id', p_node_id);

  if p_metadata is not null then

    v_final_metadata := v_final_metadata || p_metadata;

  end if;



  -- Insert message as plain bytea (not encrypted)

  insert into public.chat_messages_v2 (

    session_id,

    sender_role,

    message_text_enc,

    metadata

  )

  values (

    p_session_id,

    p_role,

    p_text::bytea,

    v_final_metadata

  )

  returning message_id into v_message_id;



  return jsonb_build_object('message_id', v_message_id);

end;

$function$
