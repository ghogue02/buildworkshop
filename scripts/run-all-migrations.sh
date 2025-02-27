#!/bin/bash

# Database connection string
# Replace with your actual connection string if different
DB_URL="postgresql://postgres:OM5FsU6zeSP382qW@db.itkktsdqxxwgayosipdr.supabase.co:5432/postgres"

# Function to run a migration file
run_migration() {
    echo "Running migration: $1"
    psql "$DB_URL" -f "supabase/migrations/$1"
}

# Run migrations in order
run_migration "20240221_create_user_inputs.sql"
run_migration "20240221_api_settings.sql"
run_migration "20240221_check_table.sql"
run_migration "20240221_cors_settings.sql"
run_migration "20240221_create_policy.sql"
run_migration "20240221_enable_cors.sql"
run_migration "20240221_reset_table.sql"
run_migration "20240221_verify_settings.sql"
run_migration "20240222_admin_notes.sql"
run_migration "20240224_report_tables.sql"
run_migration "20240225_add_ai_summary.sql"
run_migration "20240226_add_video_recordings.sql"
run_migration "20240227_create_video_recordings_function.sql"
run_migration "20240228_create_interview_sessions.sql"

echo "Migrations completed"