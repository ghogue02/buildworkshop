# Re-enabling Realtime Functionality in Supabase

This document provides instructions for re-enabling realtime functionality in Supabase after encountering issues with replication slots.

## Background

Supabase's realtime functionality relies on PostgreSQL's logical replication feature. When issues occur with replication slots, you may need to manually terminate backend processes and recreate the realtime extension.

## Using the SQL Script

We've provided a SQL script (`enable_realtime.sql`) that can help you re-enable realtime functionality:

1. **Review the script**: Open `scripts/enable_realtime.sql` and review the commands.

2. **Update PIDs**: Replace the example PIDs in the script with the actual PIDs from your system. You can find these in the Supabase dashboard or by running:
   ```sql
   SELECT pid, application_name, state, query 
   FROM pg_stat_activity 
   WHERE application_name LIKE 'supabase_realtime%';
   ```

3. **Execute the script**: You can execute this script in the Supabase SQL editor or using the psql command-line tool if you have direct database access.

## Manual Steps

If you prefer to execute the commands manually or if the script doesn't work for your specific situation, follow these steps:

1. **Terminate backend processes**:
   ```sql
   SELECT pg_terminate_backend(PID);
   ```
   Replace `PID` with the actual process ID.

2. **Drop existing replication slots**:
   ```sql
   SELECT pg_drop_replication_slot('slot_name') 
   WHERE EXISTS (SELECT 1 FROM pg_replication_slots WHERE slot_name = 'slot_name');
   ```
   Replace `slot_name` with the actual slot names (e.g., 'supabase_realtime_messages_replication_slot_v2_34_34').

3. **Re-enable the realtime extension**:
   ```sql
   CREATE EXTENSION IF NOT EXISTS realtime;
   ```

4. **Verify the extension is enabled**:
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'realtime';
   ```

5. **Check for active replication slots**:
   ```sql
   SELECT * FROM pg_replication_slots;
   ```

## Troubleshooting

- **Permission issues**: If you encounter permission errors, you may need to contact Supabase support as some operations require superuser privileges.
  
- **Persistent replication slots**: If you cannot drop a replication slot, it might be because it's still in use. Make sure to terminate all related backend processes first.

- **Extension creation failure**: If the extension creation fails, check the PostgreSQL logs for more detailed error messages.

## Application Configuration

After re-enabling realtime functionality on the database side, ensure your application is properly configured to use it:

```javascript
// Initialize Supabase client with realtime enabled
const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: {
    enabled: true
  }
});

// Subscribe to changes
const subscription = supabase
  .from('your_table')
  .on('INSERT', payload => {
    console.log('New record:', payload.new);
  })
  .subscribe();
```

## Additional Resources

- [Supabase Realtime Documentation](https://supabase.com/docs/guides/realtime)
- [PostgreSQL Logical Replication](https://www.postgresql.org/docs/current/logical-replication.html)