Subject: Need Help Restoring Database Backup - Active Replication Slots Issue

Hello Supabase Support,

I need assistance restoring a database backup from February 25, 2025 05:03:05 UTC. When attempting to restore the backup, I'm encountering issues with active replication slots that require superuser privileges to manage.

Specifically:

1. Current Status:
- Two active replication slots are preventing the backup restore:
  * supabase_realtime_messages_replication_slot_v2_34_34 (PID: 94020)
  * supabase_realtime_replication_slot_v2_34_34 (PID: 95438)

2. Error Messages:
- When trying to restore: "All subscriptions and replication slots must be dropped before a backup can be restored"
- When trying to terminate processes: "ERROR: 42501: must be a superuser to terminate superuser process"

3. What I've Tried:
- Attempted to drop the replication slots directly
- Tried to terminate the backend processes
- Attempted to disable the realtime extension

Could you please help:
1. Safely terminate these system processes
2. Drop the replication slots
3. Restore the backup from February 25, 2025 05:03:05 UTC
4. Re-enable the realtime functionality after restore

Thank you for your assistance.

Project Reference: [Your Project ID]