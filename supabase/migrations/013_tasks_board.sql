-- 013_tasks_board.sql
-- Migration for Kanban Task Board

CREATE TABLE IF NOT EXISTS task_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    created_by UUID REFERENCES owners(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS task_columns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES task_projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES task_projects(id) ON DELETE CASCADE,
    column_id UUID NOT NULL REFERENCES task_columns(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    created_by UUID REFERENCES owners(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES owners(id) ON DELETE SET NULL,
    investor_id UUID REFERENCES owners(id) ON DELETE SET NULL,
    start_date DATE,
    end_date DATE,
    deadline DATE,
    position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS task_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE task_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;

-- Allow only admin, root, accountant to access these tables
-- Since Supabase role logic is sometimes complex in SQL, we just check auth.jwt()
-- Or we check the 'owners' table role.

CREATE OR REPLACE FUNCTION is_admin_or_accountant()
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- get role from app_metadata in JWT if available
  user_role := current_setting('request.jwt.claims', true)::json->'app_metadata'->>'role';
  IF user_role IN ('admin', 'root', 'accountant') THEN
    RETURN TRUE;
  END IF;
  
  -- fallback to owners table
  SELECT role INTO user_role FROM owners WHERE id = auth.uid();
  IF user_role IN ('admin', 'root', 'accountant') THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies for task_projects
CREATE POLICY "Tasks access for admins" ON task_projects
    FOR ALL
    USING (is_admin_or_accountant());

-- Policies for task_columns
CREATE POLICY "Tasks access for admins" ON task_columns
    FOR ALL
    USING (is_admin_or_accountant());

-- Policies for tasks
CREATE POLICY "Tasks access for admins" ON tasks
    FOR ALL
    USING (is_admin_or_accountant());

-- Policies for task_comments
CREATE POLICY "Tasks access for admins" ON task_comments
    FOR ALL
    USING (is_admin_or_accountant());

-- Trigger to update updated_at on tasks
CREATE OR REPLACE FUNCTION update_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tasks_updated_at_trigger
BEFORE UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION update_tasks_updated_at();
