/**
 * Test script for Supabase Realtime functionality
 * 
 * This script tests if the Supabase Realtime functionality is working properly
 * by creating a subscription to a table and then inserting a record into that table.
 * 
 * Usage:
 * 1. Make sure your Supabase URL and key are set in the .env file
 * 2. Run this script with: node scripts/test_realtime.js
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

// Initialize Supabase client with realtime enabled
const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: {
    enabled: true,
    timeout: 30000, // 30 seconds
  }
});

// Table to test (you can change this to any table in your database)
const TABLE_NAME = 'user_inputs';

// Test ID to identify test records
const TEST_ID = `test_${Date.now()}`;

// Function to create a subscription
async function createSubscription() {
  console.log(`Creating subscription to ${TABLE_NAME} table...`);
  
  const subscription = supabase
    .channel(`${TABLE_NAME}_channel`)
    .on('postgres_changes', { 
      event: 'INSERT', 
      schema: 'public', 
      table: TABLE_NAME 
    }, (payload) => {
      console.log('Received realtime update:', payload);
      
      // Check if this is our test record
      if (payload.new && payload.new.session_id === TEST_ID) {
        console.log('✅ Realtime is working! Received the test record.');
        
        // Clean up the test record
        cleanupTestRecord().then(() => {
          console.log('Test completed successfully.');
          process.exit(0);
        });
      }
    })
    .subscribe((status) => {
      console.log(`Subscription status:`, status);
      
      if (status === 'SUBSCRIBED') {
        // Once subscribed, insert a test record
        insertTestRecord();
      }
    });
    
  // Set a timeout in case we don't receive the realtime update
  setTimeout(() => {
    console.error('❌ Timeout: Did not receive realtime update within 10 seconds.');
    console.error('Realtime functionality may not be working properly.');
    
    // Clean up anyway
    cleanupTestRecord().then(() => {
      process.exit(1);
    });
  }, 10000);
}

// Function to insert a test record
async function insertTestRecord() {
  console.log('Inserting test record...');
  
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert({
        session_id: TEST_ID,
        section_name: 'Realtime Test',
        input_data: { test: true, timestamp: new Date().toISOString() }
      });
      
    if (error) {
      console.error('Error inserting test record:', error);
      process.exit(1);
    }
    
    console.log('Test record inserted successfully.');
  } catch (error) {
    console.error('Exception inserting test record:', error);
    process.exit(1);
  }
}

// Function to clean up the test record
async function cleanupTestRecord() {
  console.log('Cleaning up test record...');
  
  try {
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('session_id', TEST_ID);
      
    if (error) {
      console.error('Error cleaning up test record:', error);
      return;
    }
    
    console.log('Test record cleaned up successfully.');
  } catch (error) {
    console.error('Exception cleaning up test record:', error);
  }
}

// Start the test
console.log('Starting Supabase Realtime test...');
createSubscription();