CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

DO $$ BEGIN CREATE TYPE user_role AS ENUM ('STUDENT','GUIDE','COORDINATOR','PANEL_MEMBER','ADMIN'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE project_status AS ENUM ('DRAFT','TEAM_FORMING','GUIDE_ALLOCATION_PENDING','GUIDE_ALLOCATED','IN_PROGRESS','SUBMITTED','COMPLETED','CANCELLED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE membership_status AS ENUM ('INVITED','ACTIVE','REMOVED','LEFT'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE preference_status AS ENUM ('SUBMITTED','LOCKED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE allocation_status AS ENUM ('PENDING','ALLOCATED','REJECTED','RELEASED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE review_status AS ENUM ('SCHEDULED','COMPLETED','CANCELLED','MISSED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE document_type AS ENUM ('PROPOSAL','SRS','DESIGN_DOCUMENT','PROGRESS_REPORT','PRESENTATION','FINAL_REPORT','CERTIFICATE','OTHER'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE submission_status AS ENUM ('DRAFT','SUBMITTED','UNDER_REVIEW','ACCEPTED','REJECTED','RESUBMISSION_REQUIRED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS academic_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name VARCHAR(100) NOT NULL,
  start_date DATE NOT NULL, end_date DATE NOT NULL, is_current BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), CHECK (end_date > start_date)
);
CREATE UNIQUE INDEX IF NOT EXISTS one_current_term ON academic_terms(is_current) WHERE is_current = TRUE;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), university_id VARCHAR(50) UNIQUE,
  email CITEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL, phone VARCHAR(30), avatar_url TEXT, is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS user_roles (user_id UUID REFERENCES users(id) ON DELETE CASCADE, role user_role NOT NULL, PRIMARY KEY(user_id, role));
CREATE TABLE IF NOT EXISTS student_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, roll_number VARCHAR(50) NOT NULL UNIQUE,
  department VARCHAR(150) NOT NULL, program VARCHAR(150), semester SMALLINT, batch_year SMALLINT,
  cgpa NUMERIC(4,2), skills TEXT[], interests TEXT[], github_url TEXT, linkedin_url TEXT,
  CHECK (cgpa IS NULL OR cgpa BETWEEN 0 AND 10)
);
CREATE TABLE IF NOT EXISTS guide_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, employee_id VARCHAR(50) UNIQUE,
  department VARCHAR(150) NOT NULL, designation VARCHAR(150), specialization TEXT[],
  max_project_load INTEGER NOT NULL DEFAULT 5, current_project_load INTEGER NOT NULL DEFAULT 0,
  is_available BOOLEAN NOT NULL DEFAULT TRUE, CHECK (max_project_load >= 0 AND current_project_load >= 0)
);

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), academic_term_id UUID REFERENCES academic_terms(id),
  title VARCHAR(255), description TEXT, department VARCHAR(150) NOT NULL, status project_status NOT NULL DEFAULT 'DRAFT',
  repository_url TEXT, created_by UUID NOT NULL REFERENCES users(id), created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS project_members (
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE, student_id UUID REFERENCES users(id) ON DELETE RESTRICT,
  status membership_status NOT NULL DEFAULT 'ACTIVE', is_leader BOOLEAN NOT NULL DEFAULT FALSE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(), left_at TIMESTAMPTZ, PRIMARY KEY(project_id, student_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS one_active_project_per_student ON project_members(student_id) WHERE status = 'ACTIVE';
CREATE UNIQUE INDEX IF NOT EXISTS one_leader_per_project ON project_members(project_id) WHERE is_leader = TRUE AND status = 'ACTIVE';
CREATE TABLE IF NOT EXISTS team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  invited_student_id UUID REFERENCES users(id) ON DELETE CASCADE, invited_by UUID REFERENCES users(id),
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING', expires_at TIMESTAMPTZ, responded_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, invited_student_id)
);

CREATE TABLE IF NOT EXISTS guide_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  guide_id UUID REFERENCES users(id) ON DELETE RESTRICT, preference_rank INTEGER NOT NULL,
  status preference_status NOT NULL DEFAULT 'SUBMITTED', submitted_by UUID REFERENCES users(id), created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, guide_id), UNIQUE(project_id, preference_rank), CHECK (preference_rank > 0)
);
CREATE TABLE IF NOT EXISTS guide_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  guide_id UUID REFERENCES users(id) ON DELETE RESTRICT, allocation_status allocation_status NOT NULL DEFAULT 'PENDING',
  preference_rank INTEGER, allocation_score NUMERIC(8,3), allocated_by UUID REFERENCES users(id), allocated_at TIMESTAMPTZ,
  released_at TIMESTAMPTZ, notes TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS one_active_guide_per_project ON guide_allocations(project_id) WHERE allocation_status = 'ALLOCATED';

CREATE TABLE IF NOT EXISTS review_panels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), academic_term_id UUID REFERENCES academic_terms(id), name VARCHAR(150) NOT NULL,
  description TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(academic_term_id, name)
);
CREATE TABLE IF NOT EXISTS review_panel_members (panel_id UUID REFERENCES review_panels(id) ON DELETE CASCADE, user_id UUID REFERENCES users(id), is_chair BOOLEAN DEFAULT FALSE, PRIMARY KEY(panel_id, user_id));
CREATE TABLE IF NOT EXISTS review_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), academic_term_id UUID REFERENCES academic_terms(id), name VARCHAR(150) NOT NULL,
  sequence_number INTEGER NOT NULL, description TEXT, max_score NUMERIC(6,2) NOT NULL DEFAULT 100, start_date DATE, end_date DATE,
  UNIQUE(academic_term_id, sequence_number)
);
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  review_round_id UUID REFERENCES review_rounds(id), panel_id UUID REFERENCES review_panels(id), scheduled_start TIMESTAMPTZ NOT NULL,
  scheduled_end TIMESTAMPTZ NOT NULL, location VARCHAR(255), meeting_url TEXT, status review_status NOT NULL DEFAULT 'SCHEDULED',
  agenda TEXT, coordinator_notes TEXT, created_by UUID REFERENCES users(id), created_at TIMESTAMPTZ NOT NULL DEFAULT now(), CHECK(scheduled_end > scheduled_start)
);
CREATE INDEX IF NOT EXISTS reviews_schedule_idx ON reviews(scheduled_start, status);
CREATE TABLE IF NOT EXISTS review_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
  evaluator_id UUID REFERENCES users(id), score NUMERIC(6,2), rubric JSONB, comments TEXT, submitted_at TIMESTAMPTZ, UNIQUE(review_id, evaluator_id)
);

CREATE TABLE IF NOT EXISTS progress_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), project_id UUID REFERENCES projects(id) ON DELETE CASCADE, author_id UUID REFERENCES users(id),
  title VARCHAR(255) NOT NULL, description TEXT NOT NULL, progress_percentage NUMERIC(5,2), blockers TEXT, next_steps TEXT,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK(progress_percentage IS NULL OR progress_percentage BETWEEN 0 AND 100)
);
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), project_id UUID REFERENCES projects(id) ON DELETE CASCADE, uploaded_by UUID REFERENCES users(id),
  document_type document_type NOT NULL, file_name VARCHAR(255) NOT NULL, object_key TEXT NOT NULL UNIQUE, file_url TEXT,
  mime_type VARCHAR(100) NOT NULL, file_size_bytes BIGINT NOT NULL, checksum VARCHAR(128), version INTEGER NOT NULL DEFAULT 1,
  is_current BOOLEAN NOT NULL DEFAULT TRUE, uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ, CHECK(file_size_bytes > 0)
);
CREATE UNIQUE INDEX IF NOT EXISTS one_current_document_per_type ON documents(project_id, document_type) WHERE is_current = TRUE AND deleted_at IS NULL;
CREATE TABLE IF NOT EXISTS final_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), project_id UUID UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
  final_document_id UUID REFERENCES documents(id), source_repository_url TEXT, submitted_by UUID REFERENCES users(id),
  status submission_status NOT NULL DEFAULT 'DRAFT', submitted_at TIMESTAMPTZ, reviewed_at TIMESTAMPTZ, reviewed_by UUID REFERENCES users(id),
  review_comments TEXT, final_score NUMERIC(6,2), created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), actor_id UUID REFERENCES users(id) ON DELETE SET NULL, entity_type VARCHAR(100) NOT NULL,
  entity_id UUID, action VARCHAR(100) NOT NULL, old_values JSONB, new_values JSONB, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
