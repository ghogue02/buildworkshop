// Initialize window._env_ if it doesn't exist
window._env_ = window._env_ || {};

export const config = {
  supabase: {
    url: process.env.REACT_APP_SUPABASE_URL || window._env_.REACT_APP_SUPABASE_URL,
    anonKey: process.env.REACT_APP_SUPABASE_ANON_KEY || window._env_.REACT_APP_SUPABASE_ANON_KEY
  },
  openai: {
    apiKey: process.env.REACT_APP_OPENAI_API_KEY || window._env_.REACT_APP_OPENAI_API_KEY
  }
};

// Function to update environment variables at runtime
export const updateConfig = (env) => {
  window._env_ = { ...window._env_, ...env };
};

// Function to set OpenAI API key at runtime
export const setOpenAIKey = (apiKey) => {
  window._env_.REACT_APP_OPENAI_API_KEY = apiKey;
};