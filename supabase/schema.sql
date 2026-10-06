CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  roll_number TEXT UNIQUE,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'guide', 'coordinator')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own profile" ON public.users;
CREATE POLICY "Users can read their own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    CASE
      WHEN NEW.raw_user_meta_data->>'role' IN ('student', 'guide', 'coordinator')
      THEN NEW.raw_user_meta_data->>'role'
      ELSE 'student'
    END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_name TEXT NOT NULL CHECK (char_length(trim(team_name)) BETWEEN 2 AND 120),
  student_ids UUID[] NOT NULL DEFAULT '{}'::UUID[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (cardinality(student_ids) BETWEEN 1 AND 4)
);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Team members can read their teams" ON public.teams;
CREATE POLICY "Team members can read their teams"
  ON public.teams FOR SELECT
  USING (auth.uid() = ANY(student_ids));

DROP POLICY IF EXISTS "Authenticated students can create teams" ON public.teams;
CREATE POLICY "Authenticated students can create teams"
  ON public.teams FOR INSERT
  WITH CHECK (auth.uid() = ANY(student_ids));

DROP POLICY IF EXISTS "Team members can update their teams" ON public.teams;
CREATE POLICY "Team members can update their teams"
  ON public.teams FOR UPDATE
  USING (auth.uid() = ANY(student_ids))
  WITH CHECK (auth.uid() = ANY(student_ids));

CREATE OR REPLACE FUNCTION public.lookup_students(identifiers TEXT[])
RETURNS TABLE (id UUID, email TEXT, roll_number TEXT)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.id, u.email, u.roll_number
  FROM public.users u
  WHERE u.role = 'student'
    AND (lower(u.email) = ANY(SELECT lower(value) FROM unnest(identifiers) AS value)
      OR lower(coalesce(u.roll_number, '')) = ANY(SELECT lower(value) FROM unnest(identifiers) AS value));
$$;

REVOKE ALL ON FUNCTION public.lookup_students(TEXT[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lookup_students(TEXT[]) TO authenticated;
