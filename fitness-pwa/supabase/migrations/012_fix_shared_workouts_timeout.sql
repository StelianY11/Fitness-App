-- Phase 9F: Avoid profile RLS timeouts while loading Ready Workouts.
--
-- Ready Workouts needs small display labels for users who shared workouts.
-- The previous public.profiles policy checked public.workout_templates from
-- inside a profiles select, which can become slow under RLS. This RPC returns
-- only safe profile labels for users who have shared workouts and keeps the
-- main workout_templates query independent from profile RLS.

drop policy if exists "Users can read profiles for shared workouts" on public.profiles;

create or replace function public.get_shared_workout_profile_names(profile_ids uuid[])
returns table (
  id uuid,
  email text,
  display_name text
)
language sql
security definer
set search_path = public
stable
as $$
  select
    profile.id,
    profile.email,
    profile.display_name
  from public.profiles as profile
  where auth.uid() is not null
    and profile.id = any(profile_ids)
    and exists (
      select 1
      from public.workout_templates as template
      where template.shared_by = profile.id
        and template.visibility = 'shared'
    );
$$;

revoke all on function public.get_shared_workout_profile_names(uuid[]) from public;
grant execute on function public.get_shared_workout_profile_names(uuid[]) to authenticated;

-- Diagnostics:
-- select * from public.get_shared_workout_profile_names(array['PROFILE_ID_HERE']::uuid[]);
-- explain analyze
-- select id, name, visibility, shared_by
-- from public.workout_templates
-- where is_builtin = true or visibility in ('shared', 'builtin')
-- order by name;
