-- =============================================================================
-- FlowDesk — Supabase Functions & RPCs
-- Run these in the Supabase SQL editor after applying supabase-schema.sql.
-- =============================================================================


-- =============================================================================
-- LEADERBOARD
-- Already added in supabase-schema.sql. Included here for reference.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_leaderboard(p_limit int DEFAULT 50)
RETURNS TABLE(id uuid, username text, xp int)
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT id, username, (gamification->>'xp')::int AS xp
  FROM profiles
  WHERE gamification IS NOT NULL
    AND username IS NOT NULL
    AND (gamification->>'xp')::int > 0
  ORDER BY (gamification->>'xp')::int DESC
  LIMIT p_limit;
$$;


-- =============================================================================
-- ADMIN
-- =============================================================================

-- Table of admin users. Insert your user ID after creating this table.
CREATE TABLE IF NOT EXISTS public.admins (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS so only Postgres (service role) can modify it directly.
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- No SELECT policy — is_admin() uses SECURITY DEFINER and bypasses RLS.
-- Admins cannot add themselves via the client; only via service role / SQL editor.

-- Helper called by other RPCs to check admin status without exposing the table.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid());
$$;

-- Returns all feedback rows, but only if the caller is an admin.
-- Replaces the direct table query in services/feedback.js getAllFeedback().
CREATE OR REPLACE FUNCTION public.get_admin_feedback()
RETURNS TABLE (
  id         uuid,
  type       text,
  message    text,
  created_at timestamptz,
  user_id    uuid,
  username   text
)
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT
    f.id, f.type, f.message, f.created_at, f.user_id,
    p.username
  FROM feedback f
  LEFT JOIN profiles p ON p.id = f.user_id
  WHERE is_admin()
  ORDER BY f.created_at DESC;
$$;

-- Returns aggregate user stats, but only if the caller is an admin.
-- Replaces the full profiles table scan in services/admin.js getAdminUserStats().
CREATE OR REPLACE FUNCTION public.get_admin_user_stats()
RETURNS json
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT CASE WHEN NOT is_admin() THEN NULL
    ELSE (
      SELECT json_build_object(
        'totalUsers',       count(*),
        'activeUsers',      count(*) FILTER (WHERE (gamification->>'xp')::int > 0),
        'usersWithUsername',count(*) FILTER (WHERE username IS NOT NULL),
        'totalXP',          COALESCE(sum((gamification->>'xp')::int), 0),
        'avgXP',            COALESCE(round(avg((gamification->>'xp')::int)), 0)
      )
      FROM profiles
    )
  END;
$$;


-- =============================================================================
-- GAMIFICATION — Server-validated XP awards
-- =============================================================================

-- Awards XP for a named reason. Amounts are defined here on the server;
-- the client cannot pass an arbitrary number.
-- Call via: supabase.rpc('award_xp', { p_reason: 'task_complete' })
CREATE OR REPLACE FUNCTION public.award_xp(p_reason text)
RETURNS int
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_amount  int;
  v_current int;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Server-defined award amounts — client cannot override these.
  v_amount := CASE p_reason
    WHEN 'task_complete'       THEN 10
    WHEN 'focus_session'       THEN 15
    WHEN 'challenge_tasks_1'   THEN 15
    WHEN 'challenge_tasks_2'   THEN 20
    WHEN 'challenge_tasks_3'   THEN 25
    WHEN 'challenge_tasks_5'   THEN 40
    WHEN 'challenge_tasks_all' THEN 35
    WHEN 'challenge_focus_1'   THEN 20
    WHEN 'challenge_focus_2'   THEN 35
    WHEN 'challenge_streak'    THEN 20
    WHEN 'milestone_7'         THEN 50
    WHEN 'milestone_30'        THEN 100
    WHEN 'milestone_100'       THEN 200
    ELSE 0
  END;

  IF v_amount = 0 THEN
    RAISE EXCEPTION 'Unknown XP reason: %', p_reason;
  END IF;

  SELECT COALESCE((gamification->>'xp')::int, 0)
    INTO v_current
    FROM profiles
   WHERE id = v_user_id;

  UPDATE profiles
     SET gamification = jsonb_set(
           COALESCE(gamification, '{}'),
           '{xp}',
           to_jsonb(v_current + v_amount)
         ),
         updated_at = now()
   WHERE id = v_user_id;

  RETURN v_amount;
END;
$$;


-- =============================================================================
-- USAGE NOTES
-- =============================================================================
--
-- 1. After running this file, insert your admin user ID:
--      INSERT INTO public.admins VALUES ('<your-user-id>');
--
-- 2. Update services/feedback.js getAllFeedback() to use the RPC:
--      const { data, error } = await supabase.rpc('get_admin_feedback');
--
-- 3. Update services/admin.js getAdminUserStats() to use the RPC:
--      const { data, error } = await supabase.rpc('get_admin_user_stats');
--
-- 4. Update services/gamification.js to call award_xp instead of writing
--    the gamification column directly from the client. See 1b in the audit.
--
-- 5. Remove the hardcoded admin UUID from AdminPage.jsx and Sidebar.jsx:
--      const { data: isAdmin } = await supabase.rpc('is_admin');
--
