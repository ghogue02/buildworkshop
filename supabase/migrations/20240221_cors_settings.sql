-- Enable CORS for development
INSERT INTO storage.buckets (id, name)
VALUES ('user_inputs', 'user_inputs')
ON CONFLICT (id) DO NOTHING;

-- Update storage CORS configuration
UPDATE storage.buckets
SET cors_origins = array['http://localhost:3000']
WHERE id = 'user_inputs';

-- Update auth settings
INSERT INTO auth.config (key, value)
VALUES
  ('SITE_URL', '"http://localhost:3000"'),
  ('ADDITIONAL_REDIRECT_URLS', '["http://localhost:3000"]'),
  ('DISABLE_SIGNUP', 'false'),
  ('JWT_EXP', '3600'),
  ('ENABLE_EMAIL_SIGNUP', 'true'),
  ('ENABLE_EMAIL_AUTOCONFIRM', 'true')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Add CORS configuration
UPDATE auth.config
SET value = '["http://localhost:3000"]'
WHERE key = 'ALLOWED_ORIGINS';

-- Verify settings
SELECT key, value FROM auth.config WHERE key IN (
  'SITE_URL',
  'ADDITIONAL_REDIRECT_URLS',
  'ALLOWED_ORIGINS'
);