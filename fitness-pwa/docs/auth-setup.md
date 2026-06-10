# Auth Setup Notes

Supabase Auth is responsible for authentication. The Angular app should call Supabase Auth for sign in, sign up, sign out, and session checks.

Row Level Security protects user data. The frontend can improve UX by hiding screens or redirecting users, but it is not a security boundary.

Allowlist access must be enforced in Supabase, not only in Angular. Use `supabase/schema.sql` to create the `allowed_users` table and auth trigger that rejects signups for non-allowlisted emails.

Before enabling real users:

1. Run `supabase/schema.sql` in the Supabase SQL Editor.
2. Add approved lowercase emails to `public.allowed_users`.
3. Confirm RLS is enabled on `public.profiles` and `public.allowed_users`.
4. Replace the placeholder `supabaseUrl` and `supabaseAnonKey` in Angular environment files or deployment environment configuration.

The anon key is safe for browser use when RLS and database policies are correct. Never put service-role keys in the Angular app.
