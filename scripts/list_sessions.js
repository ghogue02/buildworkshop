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