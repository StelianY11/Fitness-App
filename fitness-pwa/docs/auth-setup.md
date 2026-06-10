# Auth Setup Notes

Supabase Auth is responsible for authentication. The Angular app should call Supabase Auth for sign in, sign up, sign out, and session checks.

Row Level Security protects user data. The frontend can improve UX by hiding screens or redirecting users, but it is not a security boundary.

Allowlist access must be enforced in Supabase, not only in Angular. Use `supabase/schema.sql` to create the `allowed_users` table and auth trigger that rejects signups for non-allowlisted emails.

## Environment Config

Set these values in `src/environments/environment.ts` and `src/environments/environment.development.ts` before testing real auth:

```ts
supabaseUrl: 'https://your-project-ref.supabase.co',
supabaseAnonKey: 'your-public-anon-key',
```

The app logs a development-only console warning when placeholders are still configured. The anon key is safe for browser use when RLS and database policies are correct. Never put a service-role key in Angular.

## Supabase Setup Steps

1. Run `supabase/schema.sql` in the Supabase SQL Editor.
2. Add approved lowercase emails to `public.allowed_users`.
3. Confirm RLS is enabled on `public.profiles` and `public.allowed_users`.
4. Replace the placeholder `supabaseUrl` and `supabaseAnonKey` in Angular environment files or deployment environment configuration.

To run the SQL:

1. Open your Supabase project.
2. Go to SQL Editor.
3. Paste the contents of `supabase/schema.sql`.
4. Review the comments and SQL.
5. Run the query.

To allow a user to register:

```sql
insert into public.allowed_users (email, note)
values ('athlete@example.com', 'Initial beta user')
on conflict (email) do nothing;
```

Use lowercase emails. The database check expects `allowed_users.email` to be lowercase.

## Manual Auth Test

1. Start the app with `npm.cmd start`.
2. Open `/register`.
3. Try submitting empty fields and mismatched passwords. The form should show validation messages.
4. Register with an email that exists in `public.allowed_users`.
5. If email confirmation is enabled in Supabase, confirm the email before logging in.
6. Log in at `/login`.
7. Confirm successful login redirects to `/dashboard`.
8. Refresh `/dashboard`; the session should persist.
9. Open `/login` while logged in; the guest guard should redirect to `/dashboard`.
10. Click logout; Supabase should clear the session and the app should redirect to `/login`.
11. Open `/dashboard` while logged out; the auth guard should redirect to `/login`.

## Common Errors

- `Supabase environment placeholders are still configured`: replace the placeholder URL and anon key in the Angular environment files.
- `Invalid login credentials`: the email/password pair is wrong, the user does not exist, or email confirmation is still required.
- `Email is not allowlisted for this application`: add the lowercase email to `public.allowed_users`, then try registration again.
- Registration succeeds but login fails: check whether email confirmation is enabled in Supabase Auth settings.
- Data is visible across users: review RLS policies before adding more tables. Frontend route guards do not protect database rows.
