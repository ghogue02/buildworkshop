/**
 * Script to initialize sample data in the Supabase database
 * 
 * This script creates sample data for a test session in the user_inputs table.
 * It's useful for testing the application without having to manually enter data.
 * 
 * Usage:
 * 1. Make sure your Supabase URL and key are set in the .env file
 * 2. Run this script with: node scripts/initialize_sample_data.js
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

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Session ID to use for the sample data
// You can either use a fixed ID for testing or generate a new one
// const SESSION_ID = 'sample-session-' + Date.now();
const SESSION_ID = 'sample-session-123'; // Fixed ID for easier testing

// Sample data for each section
const sampleData = [
  {
    section_name: 'User Info',
    input_data: {
      name: 'Test User',
      email: 'test@example.com'
    }
  },
  {
    section_name: 'Problem Definition',
    input_data: {
      summary: 'Difficulty finding reliable information online',
      context: 'With the rise of misinformation, it\'s becoming harder to find trustworthy sources.',
      impact: 'People make decisions based on incorrect information, leading to poor outcomes.',
      rootCauses: 'Lack of verification mechanisms, incentives for clickbait, echo chambers.',
      outcome: 'A system that can verify information and provide credibility scores.'
    }
  },
  {
    section_name: 'MVP Planner',
    input_data: {
      aiOptions: [
        'AI-powered fact-checking tool',
        'Credibility scoring for news articles',
        'Source verification system'
      ],
      howItWorks: 'The system uses NLP to analyze text and compare claims against verified databases.',
      dataNeeds: 'Access to fact-checking databases, news article corpus, and source credibility metrics.',
      userExperience: 'Browser extension that shows credibility scores for articles as users browse.',
      valueProposition: 'Save time by quickly identifying reliable information and avoiding misinformation.'
    }
  },
  {
    section_name: 'Give & Get Feedback',
    input_data: {
      share: 'I\'m building an AI-powered fact-checking tool that helps users verify information online.',
      requestFeedback: 'How can I make this tool more accessible to non-technical users?',
      giveFeedback: 'Your idea about personalized learning paths is interesting, but consider privacy implications.',
      capture: 'Need to simplify the UI, add browser integrations, and consider a mobile app version.'
    }
  },
  {
    section_name: 'Refine Your MVP',
    input_data: {
      feedbackIntegration: 'Based on feedback, I\'ll focus on a simpler UI with clear visual indicators.',
      aiEnhancement: 'Adding a confidence score to show how certain the AI is about its verification.',
      productRefinement: 'Creating a browser extension first, then expanding to a mobile app later.',
      keyImprovements: 'Simplified UI, confidence scores, and integration with popular browsers.'
    }
  },
  {
    section_name: 'Start Build',
    input_data: {
      whatBuilt: 'A prototype browser extension that checks facts on news websites.',
      functionality: 'The extension can analyze text, check claims against databases, and show credibility scores.',
      futureAdditions: 'Social sharing features, API for developers, and mobile app version.',
      aiHelp: 'Used AI for natural language processing and claim extraction from articles.'
    }
  },
  {
    section_name: 'Presentations & Retro',
    input_data: {
      problem: 'Misinformation online leads to poor decision-making and societal harm.',
      solution: 'An AI-powered browser extension that verifies information and provides credibility scores.',
      demo: 'The extension analyzes text on news sites, highlights claims, and shows verification status.',
      journey: 'Started with a complex system but simplified based on user feedback.',
      impact: 'Helps users make better-informed decisions and promotes information literacy.'
    }
  }
];

// Function to insert sample data
async function insertSampleData() {
  console.log(`Inserting sample data for session ID: ${SESSION_ID}`);
  
  // First, check if data already exists for this session
  const { data: existingData, error: checkError } = await supabase
    .from('user_inputs')
    .select('id')
    .eq('session_id', SESSION_ID)
    .limit(1);
    
  if (checkError) {
    console.error('Error checking for existing data:', checkError);
    return;
  }
  
  if (existingData && existingData.length > 0) {
    console.log('Sample data already exists for this session. Deleting existing data...');
    
    const { error: deleteError } = await supabase
      .from('user_inputs')
      .delete()
      .eq('session_id', SESSION_ID);
      
    if (deleteError) {
      console.error('Error deleting existing data:', deleteError);
      return;
    }
    
    console.log('Existing data deleted successfully.');
  }
  
  // Insert new sample data
  for (const section of sampleData) {
    console.log(`Inserting data for section: ${section.section_name}`);
    
    const { error } = await supabase
      .from('user_inputs')
      .insert({
        session_id: SESSION_ID,
        section_name: section.section_name,
        input_data: section.input_data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
    if (error) {
      console.error(`Error inserting data for section ${section.section_name}:`, error);
    }
  }
  
  console.log('Sample data insertion completed.');
  console.log(`To use this sample data in the application, set your session ID to: ${SESSION_ID}`);
  console.log('You can do this by running the following in your browser console:');
  console.log(`localStorage.setItem('sessionId', '${SESSION_ID}');`);
  console.log('Then refresh the page.');
}

// Start the data insertion
insertSampleData()
  .catch(error => {
    console.error('Error in sample data insertion:', error);
  })
  .finally(() => {
    console.log('Script execution completed.');
  });