-- Script to re-enable realtime functionality in Supabase

-- 1. First, terminate the backend processes that are using the replication slots
-- Replace the PIDs with the actual PIDs from your system
SELECT pg_terminate_backend(94020); -- Replace with actual PID
SELECT pg_terminate_backend(95438); -- Replace with actual PID

-- 2. Drop the existing replication slots if they exist
SELECT pg_drop_replication_slot('supabase_realtime_messages_replication_slot_v2_34_34') 
WHERE EXISTS (SELECT 1 FROM pg_replication_slots WHERE slot_name = 'supabase_realtime_messages_replication_slot_v2_34_34');

SELECT pg_drop_replication_slot('supabase_realtime_replication_slot_v2_34_34') 
WHERE EXISTS (SELECT 1 FROM pg_replication_slots WHERE slot_name = 'supabase_realtime_replication_slot_v2_34_34');

-- 3. Re-enable the realtime extension
CREATE EXTENSION IF NOT EXISTS realtime;

-- 4. Verify that the extension is enabled
SELECT * FROM pg_extension WHERE extname = 'realtime';

-- 5. Check for active replication slots
SELECT * FROM pg_replication_slots;