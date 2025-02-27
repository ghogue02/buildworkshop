-- First, show current replication slots
SELECT * FROM pg_replication_slots;

-- Drop the specific replication slots
SELECT pg_terminate_backend(94020); -- Terminate the process using the first slot
SELECT pg_terminate_backend(95438); -- Terminate the process using the second slot

-- Now drop the slots
SELECT pg_drop_replication_slot('supabase_realtime_messages_replication_slot_v2_34_34');
SELECT pg_drop_replication_slot('supabase_realtime_replication_slot_v2_34_34');