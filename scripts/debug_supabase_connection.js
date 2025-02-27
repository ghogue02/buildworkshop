/**
 * Script to debug Supabase connection issues
 * 
 * This script performs a series of tests to diagnose Supabase connection issues:
 * 1. Validates environment variables
 * 2. Tests basic connectivity to Supabase
 * 3. Checks table access permissions
 * 4. Tests CRUD operations
 * 5. Verifies realtime functionality
 * 
 * Usage:
 * 1. Make sure your Supabase URL and key are set in the .env file
 * 2. Run this script with: node scripts/debug_supabase_connection.js
 */

// Import required libraries
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
require('dotenv').config();

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Test table name
const TEST_TABLE = 'user_inputs';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Helper function to log with colors
function log(message, color = colors.white) {
  console.log(color + message + colors.reset);
}

// Helper function to log success
function success(message) {
  log('✅ ' + message, colors.green);
}

// Helper function to log error
function error(message) {
  log('❌ ' + message, colors.red);
}

// Helper function to log warning
function warning(message) {
  log('⚠️ ' + message, colors.yellow);
}

// Helper function to log info
function info(message) {
  log('ℹ️ ' + message, colors.blue);
}

// Helper function to log section header
function section(title) {
  console.log('\n' + colors.cyan + '='.repeat(80) + colors.reset);
  console.log(colors.cyan + ' ' + title + colors.reset);
  console.log(colors.cyan + '='.repeat(80) + colors.reset);
}

// Test 1: Validate environment variables
async function validateEnvironmentVariables() {
  section('1. Validating Environment Variables');
  
  if (!supabaseUrl) {
    error('REACT_APP_SUPABASE_URL is not defined in .env file');
    return false;
  } else {
    success(`REACT_APP_SUPABASE_URL is defined: ${supabaseUrl}`);
  }
  
  if (!supabaseKey) {
    error('REACT_APP_SUPABASE_ANON_KEY is not defined in .env file');
    return false;
  } else {
    success('REACT_APP_SUPABASE_ANON_KEY is defined');
  }
  
  // Validate URL format
  try {
    new URL(supabaseUrl);
    success('Supabase URL is valid');
  } catch (e) {
    error(`Supabase URL is invalid: ${e.message}`);
    return false;
  }
  
  // Check if URL is a Supabase URL
  if (!supabaseUrl.includes('supabase.co')) {
    warning('Supabase URL does not contain "supabase.co". This might be a custom domain.');
  }
  
  // Check if key looks like a JWT
  if (!supabaseKey.includes('.') || supabaseKey.split('.').length !== 3) {
    warning('Supabase key does not look like a valid JWT token');
  }
  
  return true;
}

// Test 2: Test basic connectivity
async function testBasicConnectivity() {
  section('2. Testing Basic Connectivity');
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Simple health check
    const { data, err } = await supabase.from(TEST_TABLE).select('count(*)', { count: 'exact', head: true });
    
    if (err) {
      error(`Failed to connect to Supabase: ${err.message}`);
      if (err.code === '42P01') {
        error(`Table "${TEST_TABLE}" does not exist. Please create it first.`);
      }
      return false;
    }
    
    success(`Successfully connected to Supabase and accessed "${TEST_TABLE}" table`);
    info(`Table "${TEST_TABLE}" has records`);
    
    return true;
  } catch (e) {
    error(`Exception during connectivity test: ${e.message}`);
    return false;
  }
}

// Test 3: Check table access permissions
async function checkTablePermissions() {
  section('3. Checking Table Access Permissions');
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test SELECT
    info('Testing SELECT permission...');
    const { error: selectErr } = await supabase
      .from(TEST_TABLE)
      .select('*')
      .limit(1);
      
    if (selectErr) {
      error(`SELECT permission denied: ${selectErr.message}`);
    } else {
      success('SELECT permission granted');
    }
    
    // Test INSERT
    info('Testing INSERT permission...');
    const testId = crypto.randomUUID(); // Generate a proper UUID
    const { error: insertErr } = await supabase
      .from(TEST_TABLE)
      .insert({
        session_id: testId,
        section_name: 'Connection Test',
        input_data: { test: true }
      });
      
    if (insertErr) {
      error(`INSERT permission denied: ${insertErr.message}`);
    } else {
      success('INSERT permission granted');
    }
    
    // Test UPDATE
    info('Testing UPDATE permission...');
    const { error: updateErr } = await supabase
      .from(TEST_TABLE)
      .update({ input_data: { test: true, updated: true } })
      .eq('session_id', testId);
      
    if (updateErr) {
      error(`UPDATE permission denied: ${updateErr.message}`);
    } else {
      success('UPDATE permission granted');
    }
    
    // Test DELETE
    info('Testing DELETE permission...');
    const { error: deleteErr } = await supabase
      .from(TEST_TABLE)
      .delete()
      .eq('session_id', testId);
      
    if (deleteErr) {
      error(`DELETE permission denied: ${deleteErr.message}`);
    } else {
      success('DELETE permission granted');
    }
    
    return true;
  } catch (e) {
    error(`Exception during permissions test: ${e.message}`);
    return false;
  }
}

// Test 4: Test CRUD operations
async function testCRUDOperations() {
  section('4. Testing CRUD Operations');
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const testId = crypto.randomUUID(); // Generate a proper UUID
    
    // CREATE
    info('Testing CREATE operation...');
    const { data: createData, error: createErr } = await supabase
      .from(TEST_TABLE)
      .insert({
        session_id: testId,
        section_name: 'CRUD Test',
        input_data: { test: true, created_at: new Date().toISOString() }
      })
      .select();
      
    if (createErr) {
      error(`CREATE operation failed: ${createErr.message}`);
      return false;
    }
    
    success('CREATE operation successful');
    
    // READ
    info('Testing READ operation...');
    const { data: readData, error: readErr } = await supabase
      .from(TEST_TABLE)
      .select('*')
      .eq('session_id', testId)
      .single();
      
    if (readErr) {
      error(`READ operation failed: ${readErr.message}`);
      return false;
    }
    
    if (!readData) {
      error('READ operation returned no data');
      return false;
    }
    
    success('READ operation successful');
    
    // UPDATE
    info('Testing UPDATE operation...');
    const { data: updateData, error: updateErr } = await supabase
      .from(TEST_TABLE)
      .update({ input_data: { ...readData.input_data, updated: true } })
      .eq('session_id', testId)
      .select();
      
    if (updateErr) {
      error(`UPDATE operation failed: ${updateErr.message}`);
      return false;
    }
    
    success('UPDATE operation successful');
    
    // DELETE
    info('Testing DELETE operation...');
    const { error: deleteErr } = await supabase
      .from(TEST_TABLE)
      .delete()
      .eq('session_id', testId);
      
    if (deleteErr) {
      error(`DELETE operation failed: ${deleteErr.message}`);
      return false;
    }
    
    success('DELETE operation successful');
    
    return true;
  } catch (e) {
    error(`Exception during CRUD test: ${e.message}`);
    return false;
  }
}

// Test 5: Verify realtime functionality
async function testRealtimeFunctionality() {
  section('5. Testing Realtime Functionality');
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      realtime: {
        enabled: true,
        timeout: 10000
      }
    });
    
    const testId = crypto.randomUUID(); // Generate a proper UUID
    let receivedRealtimeEvent = false;
    
    // Set up a promise that will resolve when we receive a realtime event
    const realtimePromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Realtime test timed out after 10 seconds'));
      }, 10000);
      
      info('Setting up realtime subscription...');
      
      const channel = supabase
        .channel('realtime-test')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: TEST_TABLE,
          filter: `session_id=eq.${testId}`
        }, (payload) => {
          success('Received realtime event!');
          receivedRealtimeEvent = true;
          clearTimeout(timeout);
          resolve(true);
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            info('Realtime subscription active, inserting test record...');
            
            // Insert a test record to trigger the realtime event
            supabase
              .from(TEST_TABLE)
              .insert({
                session_id: testId,
                section_name: 'Realtime Test',
                input_data: { test: true, timestamp: new Date().toISOString() }
              })
              .then(({ error: insertErr }) => {
                if (insertErr) {
                  error(`Failed to insert test record: ${insertErr.message}`);
                  clearTimeout(timeout);
                  reject(insertErr);
                } else {
                  info('Test record inserted, waiting for realtime event...');
                }
              });
          } else if (status === 'CHANNEL_ERROR') {
            error('Realtime subscription error');
            clearTimeout(timeout);
            reject(new Error('Realtime subscription error'));
          }
        });
    });
    
    try {
      await realtimePromise;
      success('Realtime functionality is working!');
      
      // Clean up the test record
      await supabase
        .from(TEST_TABLE)
        .delete()
        .eq('session_id', testId);
        
      return true;
    } catch (e) {
      if (!receivedRealtimeEvent) {
        error(`Realtime functionality is not working: ${e.message}`);
        warning('This could be due to:');
        warning('1. The realtime extension is not enabled in your Supabase project');
        warning('2. There are issues with replication slots');
        warning('3. The table does not have realtime enabled in the Supabase dashboard');
        
        // Try to clean up the test record anyway
        await supabase
          .from(TEST_TABLE)
          .delete()
          .eq('session_id', testId);
          
        return false;
      }
    }
  } catch (e) {
    error(`Exception during realtime test: ${e.message}`);
    return false;
  }
}

// Main function to run all tests
async function runTests() {
  console.log(colors.magenta + '\n🔍 SUPABASE CONNECTION DIAGNOSTICS 🔍\n' + colors.reset);
  
  const envValid = await validateEnvironmentVariables();
  if (!envValid) {
    error('Environment variables validation failed. Please fix the issues above before continuing.');
    return;
  }
  
  const connected = await testBasicConnectivity();
  if (!connected) {
    error('Basic connectivity test failed. Please fix the connection issues before continuing.');
    return;
  }
  
  await checkTablePermissions();
  await testCRUDOperations();
  await testRealtimeFunctionality();
  
  console.log(colors.magenta + '\n📊 DIAGNOSTICS SUMMARY 📊\n' + colors.reset);
  console.log('If all tests passed, your Supabase connection is working correctly.');
  console.log('If some tests failed, review the error messages and take appropriate action.');
  console.log('\nCommon solutions:');
  console.log('1. Check your Supabase URL and key in the .env file');
  console.log('2. Verify table permissions in the Supabase dashboard');
  console.log('3. Enable the realtime extension if it\'s not already enabled');
  console.log('4. Check for issues with replication slots');
  console.log('\nFor realtime issues, see the scripts/README_REALTIME.md file for more information.');
}

// Run the tests
runTests().catch(e => {
  console.error('Unhandled exception during tests:', e);
});