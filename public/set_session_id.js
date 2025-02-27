/**
 * Script to set the session ID in localStorage to match an existing session in the database
 * 
 * This script helps with testing by setting the session ID to match an existing session
 * in the Supabase database, allowing you to view and work with existing data.
 * 
 * Usage:
 * 1. Open your application in the browser
 * 2. Open the browser console (F12 or Ctrl+Shift+I)
 * 3. Run the following command in the console:
 *    loadScript('set_session_id.js')
 * 4. The script will show available sessions and let you select one
 */

// Function to load the script
function loadScript(src) {
  const script = document.createElement('script');
  script.src = src;
  document.head.appendChild(script);
  console.log(`Loading script: ${src}`);
}

// Main function to set the session ID
async function setSessionId() {
  // Check if Supabase is available
  if (!window.supabase) {
    console.error('Supabase client not found. Make sure you are running this in the application.');
    return;
  }

  try {
    // Get available sessions from the database
    console.log('Fetching available sessions from the database...');
    const { data: sessions, error } = await window.supabase
      .from('user_inputs')
      .select('session_id, section_name')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching sessions:', error);
      return;
    }

    if (!sessions || sessions.length === 0) {
      console.log('No sessions found in the database.');
      return;
    }

    // Group sessions by session_id
    const sessionMap = {};
    sessions.forEach(session => {
      if (!sessionMap[session.session_id]) {
        sessionMap[session.session_id] = [];
      }
      sessionMap[session.session_id].push(session.section_name);
    });

    // Display available sessions
    console.log('Available sessions:');
    console.log('------------------');
    
    const sessionIds = Object.keys(sessionMap);
    sessionIds.forEach((sessionId, index) => {
      const sections = sessionMap[sessionId];
      console.log(`${index + 1}. Session ID: ${sessionId}`);
      console.log(`   Sections: ${sections.join(', ')}`);
      console.log('------------------');
    });

    // Prompt user to select a session
    const selection = prompt(`Enter the number of the session you want to use (1-${sessionIds.length}):`);
    const selectedIndex = parseInt(selection) - 1;

    if (isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= sessionIds.length) {
      console.log('Invalid selection. Operation cancelled.');
      return;
    }

    const selectedSessionId = sessionIds[selectedIndex];
    
    // Save the selected session ID to localStorage
    localStorage.setItem('sessionId', selectedSessionId);
    console.log(`Session ID set to: ${selectedSessionId}`);
    console.log('Refresh the page to load data for this session.');

    // Offer to refresh the page
    if (confirm('Refresh the page now to load data for the selected session?')) {
      window.location.reload();
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Alternative function to directly set a specific session ID
function setSpecificSessionId(sessionId) {
  if (!sessionId) {
    console.error('Please provide a session ID.');
    return;
  }
  
  localStorage.setItem('sessionId', sessionId);
  console.log(`Session ID set to: ${sessionId}`);
  console.log('Refresh the page to load data for this session.');
  
  if (confirm('Refresh the page now to load data for the selected session?')) {
    window.location.reload();
  }
}

// Provide instructions
console.log('Session ID Utility');
console.log('=================');
console.log('This utility helps you set your session ID to match an existing session in the database.');
console.log('Available commands:');
console.log('1. setSessionId() - Shows available sessions and lets you select one');
console.log('2. setSpecificSessionId("your-session-id") - Sets a specific session ID');
console.log('3. localStorage.getItem("sessionId") - Shows your current session ID');
console.log('=================');

// Automatically show the current session ID
const currentSessionId = localStorage.getItem('sessionId');
console.log(`Current session ID: ${currentSessionId || 'Not set'}`);

// Automatically show available sessions
setSessionId();