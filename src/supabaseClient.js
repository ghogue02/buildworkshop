import { createClient } from '@supabase/supabase-js';
import { config } from './config';

const supabaseUrl = config.supabase.url;
const supabaseAnonKey = config.supabase.anonKey;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase configuration. Check environment variables.');
  // Use placeholder values in development mode instead of throwing an error
  if (process.env.NODE_ENV === 'development') {
    console.warn('Using placeholder Supabase URL and key in development mode');
  } else {
    throw new Error('Missing Supabase configuration. Check environment variables.');
  }
}

// Validate URL format to prevent "Invalid URL" errors
let validatedSupabaseUrl = supabaseUrl;
try {
  // Test if the URL is valid
  new URL(supabaseUrl);
} catch (error) {
  console.error('Invalid Supabase URL format:', error);
  // Use a fallback URL in development mode
  if (process.env.NODE_ENV === 'development') {
    validatedSupabaseUrl = 'https://example.supabase.co';
    console.warn('Using fallback Supabase URL in development mode');
  } else {
    throw new Error('Invalid Supabase URL format. Please check your configuration.');
  }
}

export const supabase = createClient(validatedSupabaseUrl, supabaseAnonKey, {
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

// Add a test function to verify the Supabase connection
export const testSupabaseConnection = async () => {
  try {
    console.log('Testing Supabase connection...');
    console.log('Supabase URL:', validatedSupabaseUrl);
    console.log('Supabase Key:', supabaseAnonKey ? 'Key exists (not shown for security)' : 'Key missing');
    
    const { data, error } = await supabase.from('user_inputs').select('count').limit(1);
    
    if (error) {
      console.error('Supabase connection test failed:', error);
      return { success: false, error };
    }
    
    console.log('Supabase connection test successful:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Supabase connection test exception:', error);
    return { success: false, error };
  }
};