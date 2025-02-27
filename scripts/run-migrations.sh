#!/bin/bash

# Database connection string
DB_URL="postgresql://postgres:OM5FsU6zeSP382qW@db.itkktsdqxxwgayosipdr.supabase.co:5432/postgres"

# Function to run a migration file
run_migration() {
    echo "Running migration: $1"
    psql "$DB_URL" -f "supabase/migrations/$1"
}

# Run migrations in order
run_migration "20240221_create_user_inputs.sql"
run_migration "20240224_report_tables.sql"
run_migration "20240226_add_video_recordings.sql"
run_migration "20240227_create_video_recordings_function.sql"
run_migration "20240228_create_interview_sessions.sql"

echo "Migrations completed"