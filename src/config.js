// Initialize window._env_ if it doesn't exist
window._env_ = window._env_ || {};

export const config = {
  supabase: {
    url: process.env.REACT_APP_SUPABASE_URL || window._env_.REACT_APP_SUPABASE_URL,
    anonKey: process.env.REACT_APP_SUPABASE_ANON_KEY || window._env_.REACT_APP_SUPABASE_ANON_KEY
  },
  // OpenAI API key is no longer needed with Web Speech API
  openai: {
    apiKey: null
  }
};

// Function to update environment variables at runtime
export const updateConfig = (env) => {
  window._env_ = { ...window._env_, ...env };
};