// Initialize window._env_ if it doesn't exist
window._env_ = window._env_ || {};

export const config = {
  supabase: {
    url: window._env_?.REACT_APP_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL,
    anonKey: window._env_?.REACT_APP_SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY
  }
};

// Function to update environment variables at runtime
export const updateConfig = (env) => {
  window._env_ = { ...window._env_, ...env };
};