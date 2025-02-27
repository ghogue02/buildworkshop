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