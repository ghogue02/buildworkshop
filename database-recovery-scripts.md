# Database Recovery Scripts

This document contains the scripts needed to implement the database recovery plan. You can copy these scripts to the appropriate files in your project.

## list_sessions.js

Create this file at `scripts/list_sessions.js`:

```javascript
/**
 * Script to list all sessions in the Supabase database
 * 
 * This script fetches and displays all sessions from various tables in the Supabase database.
 * It helps you see what data is available after a database reset.
 * 
 * Usage:
 * 1. Make sure your Supabase URL and key are set in the .env file
 * 2. Run this script with: node scripts/list_sessions.js
 */

// Import required libraries
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Get Supabase credentials from environment variables
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

## verify_data_integrity.js

Create this file at `scripts/verify_data_integrity.js`:

```javascript
/**
 * Script to verify data integrity in the Supabase database
 * 
 * This script checks relationships between tables to ensure data integrity.
 * It helps identify missing or inconsistent data after a database reset.
 * 
 * Usage:
 * 1. Make sure your Supabase URL and key are set in the .env file
 * 2. Run this script with: node scripts/verify_data_integrity.js
 */

// Import required libraries
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Get Supabase credentials from environment variables
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

## run-all-migrations.sh

Create this file at `scripts/run-all-migrations.sh`:

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

## Implementation Instructions

1. Copy each script from this document to the corresponding file in your project.
2. Make the shell script executable:
   ```bash
   chmod +x scripts/run-all-migrations.sh
   ```
3. Follow the steps in the database-recovery-plan.md file to recover your database.