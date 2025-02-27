# Database Recovery Summary

## Database Structure

Your application uses a Supabase database with the following key tables:

1. **user_inputs**
   - Core table storing user inputs for different sections
   - Contains session_id, section_name, and input_data (JSONB)
   - Referenced by other tables via session_id

2. **admin_notes**
   - Stores admin notes linked to session_id
   - Contains notes, ai_summary, and ai_generated_flag

3. **video_recordings**
   - Stores video recordings linked to session_id
   - Contains video_url and transcript

4. **report_cache**
   - Stores generated reports
   - Contains report_type, parameters, and report_data

5. **analysis_results**
   - Stores AI-generated insights
   - Contains analysis_type, input_data, and insights

6. **interview_sessions**
   - Stores interview sessions with session_id
   - Contains interview_data, transcript, and ai_summary

## Data Relationships

The database uses session_id as the primary way to link data across tables:

```
user_inputs
    |
    ├── admin_notes (via session_id)
    |
    ├── video_recordings (via session_id)
    |
    └── interview_sessions (via session_id)
```

Analysis results and report cache tables are standalone but may reference session IDs in their data.

## Recovery Process Overview

1. **Verify Connection**
   - Use debug_supabase_connection.js to check database connectivity

2. **Recreate Schema**
   - Use run-all-migrations.sh to recreate all tables

3. **Check Existing Data**
   - Use list_sessions.js to see what data survived the reset

4. **Restore Data**
   - Use initialize_sample_data.js for sample data
   - Or restore from backup if available

5. **Verify Integrity**
   - Use verify_data_integrity.js to check relationships

6. **Test Application**
   - Use set_session_id.js to set a session ID for testing

## Key Scripts

- **debug_supabase_connection.js**: Tests database connectivity
- **run-all-migrations.sh**: Recreates database schema
- **list_sessions.js**: Lists all sessions in the database
- **verify_data_integrity.js**: Checks data relationships
- **initialize_sample_data.js**: Creates sample data
- **set_session_id.js**: Sets session ID for testing

## Next Steps

1. Follow the detailed steps in database-recovery-plan.md
2. Use the scripts provided in database-recovery-scripts.md
3. If you need to implement custom data recovery, focus on the user_inputs table first, as it's the core table
4. Consider setting up regular database backups to prevent future data loss

## Preventive Measures

To prevent future data loss:

1. Set up automated backups using Supabase dashboard
2. Implement a version control system for database schema changes
3. Create a staging environment for testing changes before applying to production
4. Document database structure and relationships for easier recovery