# Database Recovery Quick-Start Guide

This guide provides the essential steps to recover your Supabase database after an accidental reset. For detailed information, refer to the other recovery documents.

## Prerequisites

- Supabase project credentials in your `.env` file
- Node.js and npm installed
- PostgreSQL client (psql) installed

## Step 1: Check Database Connection

```bash
# Test your Supabase connection
node scripts/debug_supabase_connection.js
```

## Step 2: Create Recovery Scripts

Create the following scripts using the code provided in `database-recovery-scripts.md`:

1. `scripts/run-all-migrations.sh` - Recreates database schema
2. `scripts/list_sessions.js` - Lists existing sessions
3. `scripts/verify_data_integrity.js` - Checks data relationships

Make the migration script executable:
```bash
chmod +x scripts/run-all-migrations.sh
```

## Step 3: Recreate Database Schema

```bash
# Run all migrations to recreate tables
./scripts/run-all-migrations.sh
```

## Step 4: Check for Existing Data

```bash
# List all sessions in the database
node scripts/list_sessions.js
```

## Step 5: Restore Data

If you need sample data:
```bash
# Initialize sample data
node scripts/initialize_sample_data.js
```

If you have a backup:
```bash
# Restore from backup (if available)
psql "your-connection-string" -f your-backup-file.sql
```

## Step 6: Verify Data Integrity

```bash
# Check relationships between tables
node scripts/verify_data_integrity.js
```

## Step 7: Test the Application

1. Copy the session ID utility to your public directory:
   ```bash
   cp scripts/set_session_id.js public/
   ```

2. Open your application in the browser
3. Open the browser console and run:
   ```javascript
   loadScript('set_session_id.js')
   ```
4. Select a session ID from the list

## Next Steps

- Set up automated backups to prevent future data loss
- Document your database structure and relationships
- Consider implementing a version control system for database changes

For more detailed instructions, refer to:
- `database-recovery-plan.md` - Comprehensive recovery plan
- `database-recovery-scripts.md` - Script code and implementation details
- `database-recovery-summary.md` - Database structure and relationships overview