-- Enable CORS for development
INSERT INTO auth.config (key, value)
VALUES
  ('DISABLE_SIGNUP', 'false'),
  ('JWT_EXP', '3600'),
  ('SITE_URL', 'http://localhost:3000'),
  ('ADDITIONAL_REDIRECT_URLS', '["http://localhost:3000"]'),
  ('ENABLE_EMAIL_SIGNUP', 'true'),
  ('ENABLE_EMAIL_AUTOCONFIRM', 'true')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Add CORS configuration
UPDATE auth.config
SET value = '["http://localhost:3000", "http://localhost"]'
WHERE key = 'ALLOWED_ORIGINS';