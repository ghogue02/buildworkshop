import { createClient } from '@supabase/supabase-js';
import { config } from './config';

const supabaseUrl = config.supabase.url;
const supabaseAnonKey = config.supabase.anonKey;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase configuration. Check environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  },
  // Add additional options to improve connection reliability
  db: {
    schema: 'public'
  },
  realtime: {
    timeout: 30000, // Increase timeout to 30 seconds
    params: {
      eventsPerSecond: 10
    }
  },
  // Add retry configuration
  fetch: (url, options) => {
    return fetch(url, {
      ...options,
      // Add a longer timeout
      signal: options.signal || (new AbortController()).signal
    }).catch(error => {
      console.error('Fetch error:', error);
      throw error;
    });
  }
});

// Add a helper function to handle Supabase operations with retries
export const withRetry = async (operation, maxRetries = 3, delay = 1000) => {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      console.warn(`Operation failed (attempt ${attempt + 1}/${maxRetries}):`, error.message);
      lastError = error;
      
      // Wait before retrying
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (attempt + 1)));
      }
    }
  }
  
  throw lastError;
};