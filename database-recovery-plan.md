# Database Recovery Plan

## Overview

This plan outlines the steps to recover your Supabase database after an accidental reset. We'll recreate the database schema and restore as much data as possible.

## Prerequisites

- Supabase project credentials (URL and API key)
- Node.js and npm installed
- PostgreSQL client (psql) installed for running migrations

## Step 1: Verify Database Connection

1. Check your Supabase connection using the debug script:
   ```bash
   node scripts/debug_supabase_connection.js
   ```

2. If there are connection issues, verify your environment variables in the `.env` file:
   ```
   REACT_APP_SUPABASE_URL=your-supabase-url
   REACT_APP_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

## Step 2: Recreate Database Schema

The `run-migrations.sh` script is missing some migration files. Let's create an updated version:

1. Create a new file `scripts/run-all-migrations.sh`:
   ```bash
   #!/bin/bash

   # Database connection string
   # Replace with your actual connection string if different
   DB_URL="postgresql://postgres:OM5FsU6zeSP382qW@db.itkktsdqxxwgayosipdr.supabase.co:5432/postgres"

   # Function to run a migration file
   run_migration() {
       echo "Running migration: $1"
       psql "$DB_URL" -f "supabase/migrations/$1"
   }

   # Run migrations in order
   run_migration "20240221_create_user_inputs.sql"
   run_migration "20240221_api_settings.sql"
   run_migration "20240221_check_table.sql"
   run_migration "20240221_cors_settings.sql"
   run_migration "20240221_create_policy.sql"
   run_migration "20240221_enable_cors.sql"
   run_migration "20240221_reset_table.sql"
   run_migration "20240221_verify_settings.sql"
   run_migration "20240222_admin_notes.sql"
   run_migration "20240224_report_tables.sql"
   run_migration "20240225_add_ai_summary.sql"
   run_migration "20240226_add_video_recordings.sql"
   run_migration "20240227_create_video_recordings_function.sql"
   run_migration "20240228_create_interview_sessions.sql"

   echo "Migrations completed"
   ```

2. Make the script executable:
   ```bash
   chmod +x scripts/run-all-migrations.sh
   ```

3. Run the script to recreate all tables:
   ```bash
   ./scripts/run-all-migrations.sh
   ```

## Step 3: Restore Sample Data

If you don't have a backup of your actual data, you can initialize sample data:

1. Run the sample data initialization script:
   ```bash
   node scripts/initialize_sample_data.js
   ```

2. This will create a sample session with data for various sections.

## Step 4: Check for Existing Data

Let's check if any data survived the reset:

1. Create a script to list all existing sessions:
   ```javascript
   // scripts/list_sessions.js
   const { createClient } = require('@supabase/supabase-js');
   require('dotenv').config();

   const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
   const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

   if (!supabaseUrl || !supabaseKey) {
     console.error('Missing Supabase credentials. Please check your .env file.');
     process.exit(1);
   }

   const supabase = createClient(supabaseUrl, supabaseKey);

   async function listSessions() {
     console.log('Fetching sessions from user_inputs table...');
     const { data: userInputs, error: userInputsError } = await supabase
       .from('user_inputs')
       .select('session_id, section_name, created_at')
       .order('created_at', { ascending: false });

     if (userInputsError) {
       console.error('Error fetching user_inputs:', userInputsError);
     } else {
       const sessionMap = {};
       userInputs.forEach(input => {
         if (!sessionMap[input.session_id]) {
           sessionMap[input.session_id] = {
             sections: [],
             created_at: input.created_at
           };
         }
         sessionMap[input.session_id].sections.push(input.section_name);
       });

       console.log('Sessions in user_inputs table:');
       console.log('=============================');
       Object.entries(sessionMap).forEach(([sessionId, data]) => {
         console.log(`Session ID: ${sessionId}`);
         console.log(`Created: ${new Date(data.created_at).toLocaleString()}`);
         console.log(`Sections: ${data.sections.join(', ')}`);
         console.log('-----------------------------');
       });
     }

     console.log('\nFetching sessions from admin_notes table...');
     const { data: adminNotes, error: adminNotesError } = await supabase
       .from('admin_notes')
       .select('session_id, created_at')
       .order('created_at', { ascending: false });

     if (adminNotesError) {
       console.error('Error fetching admin_notes:', adminNotesError);
     } else {
       console.log('Sessions in admin_notes table:');
       console.log('============================');
       adminNotes.forEach(note => {
         console.log(`Session ID: ${note.session_id}`);
         console.log(`Created: ${new Date(note.created_at).toLocaleString()}`);
         console.log('-----------------------------');
       });
     }

     console.log('\nFetching sessions from video_recordings table...');
     const { data: videoRecordings, error: videoRecordingsError } = await supabase
       .from('video_recordings')
       .select('session_id, created_at')
       .order('created_at', { ascending: false });

     if (videoRecordingsError) {
       console.error('Error fetching video_recordings:', videoRecordingsError);
     } else {
       console.log('Sessions in video_recordings table:');
       console.log('=================================');
       videoRecordings.forEach(recording => {
         console.log(`Session ID: ${recording.session_id}`);
         console.log(`Created: ${new Date(recording.created_at).toLocaleString()}`);
         console.log('-----------------------------');
       });
     }

     console.log('\nFetching sessions from interview_sessions table...');
     const { data: interviewSessions, error: interviewSessionsError } = await supabase
       .from('interview_sessions')
       .select('session_id, created_at')
       .order('created_at', { ascending: false });

     if (interviewSessionsError) {
       console.error('Error fetching interview_sessions:', interviewSessionsError);
     } else {
       console.log('Sessions in interview_sessions table:');
       console.log('==================================');
       interviewSessions.forEach(session => {
         console.log(`Session ID: ${session.session_id}`);
         console.log(`Created: ${new Date(session.created_at).toLocaleString()}`);
         console.log('-----------------------------');
       });
     }
   }

   listSessions().catch(e => {
     console.error('Unhandled exception:', e);
   });
   ```

2. Run the script:
   ```bash
   node scripts/list_sessions.js
   ```

## Step 5: Restore from Backup (if available)

If you have a database backup:

1. Restore it using the Supabase dashboard or CLI
2. Alternatively, if you have SQL dump files, you can restore them using:
   ```bash
   psql "$DB_URL" -f your-backup-file.sql
   ```

## Step 6: Verify Data Integrity

1. Check relationships between tables:
   ```javascript
   // scripts/verify_data_integrity.js
   const { createClient } = require('@supabase/supabase-js');
   require('dotenv').config();

   const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
   const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

   if (!supabaseUrl || !supabaseKey) {
     console.error('Missing Supabase credentials. Please check your .env file.');
     process.exit(1);
   }

   const supabase = createClient(supabaseUrl, supabaseKey);

   async function verifyDataIntegrity() {
     // Get all session IDs from user_inputs
     const { data: userInputs, error: userInputsError } = await supabase
       .from('user_inputs')
       .select('session_id')
       .order('created_at', { ascending: false });

     if (userInputsError) {
       console.error('Error fetching user_inputs:', userInputsError);
       return;
     }

     const sessionIds = [...new Set(userInputs.map(input => input.session_id))];
     console.log(`Found ${sessionIds.length} unique session IDs in user_inputs table`);

     // Check each session ID for related records
     for (const sessionId of sessionIds) {
       console.log(`\nChecking session ID: ${sessionId}`);

       // Check user_inputs
       const { data: inputs, error: inputsError } = await supabase
         .from('user_inputs')
         .select('section_name')
         .eq('session_id', sessionId);

       if (inputsError) {
         console.error(`Error fetching user_inputs for session ${sessionId}:`, inputsError);
       } else {
         console.log(`- user_inputs: ${inputs.length} sections found`);
       }

       // Check admin_notes
       const { data: notes, error: notesError } = await supabase
         .from('admin_notes')
         .select('id')
         .eq('session_id', sessionId);

       if (notesError) {
         console.error(`Error fetching admin_notes for session ${sessionId}:`, notesError);
       } else {
         console.log(`- admin_notes: ${notes.length} records found`);
       }

       // Check video_recordings
       const { data: recordings, error: recordingsError } = await supabase
         .from('video_recordings')
         .select('id')
         .eq('session_id', sessionId);

       if (recordingsError) {
         console.error(`Error fetching video_recordings for session ${sessionId}:`, recordingsError);
       } else {
         console.log(`- video_recordings: ${recordings.length} records found`);
       }

       // Check interview_sessions
       const { data: interviews, error: interviewsError } = await supabase
         .from('interview_sessions')
         .select('id')
         .eq('session_id', sessionId);

       if (interviewsError) {
         console.error(`Error fetching interview_sessions for session ${sessionId}:`, interviewsError);
       } else {
         console.log(`- interview_sessions: ${interviews.length} records found`);
       }
     }
   }

   verifyDataIntegrity().catch(e => {
     console.error('Unhandled exception:', e);
   });
   ```

2. Run the script:
   ```bash
   node scripts/verify_data_integrity.js
   ```

## Step 7: Set Up Session ID for Testing

Once you've restored your data, you can use the set_session_id.js script to set a session ID for testing:

1. Copy the script to your public directory:
   ```bash
   cp scripts/set_session_id.js public/
   ```

2. Open your application in the browser and run the following in the console:
   ```javascript
   loadScript('set_session_id.js')
   ```

3. Follow the prompts to select a session ID.

## Conclusion

By following these steps, you should be able to recover your database structure and as much data as possible. If you encounter any issues, check the error messages and adjust the steps accordingly.

Remember to regularly back up your database to prevent data loss in the future. You can set up automated backups using the Supabase dashboard or CLI.