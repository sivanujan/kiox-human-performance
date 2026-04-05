# Supabase Redirect Configuration Guide

To ensure your custom domain `http://sivanujan.online:3000/` works correctly with authentication (Sign Up, Magic Links, Password Reset), you must configure the following in your Supabase Dashboard.

---

### Step 1: Update Site URL
1.  Go to your [Supabase Projects](https://supabase.com/dashboard/projects).
2.  Navigate to **Authentication** > **Settings**.
3.  Under **Site URL**, change the value from `http://localhost:3000` to:
    -   `http://sivanujan.online:3000`

### Step 2: Add Redirect URLs
1.  In the same **Authentication** > **Settings** page, scroll down to **Redirect URLs**.
2.  Click **Add URL** and add the following entry:
    -   `http://sivanujan.online:3000/**`
    -   *(The `/**` wildcard allows all sub-paths like `/api/auth/callback` to be authorized automatically).*

### Step 3: Local Development (Optional)
If you still want to test on your local machine simultaneously, ensure `http://localhost:3000/**` remains in the **Redirect URLs** list.

---

### Why this is necessary:
Supabase blocks authentication redirects to domains that aren't on its "Allow List" to prevent attackers from tricking users into sending their authentication tokens to a malicious site. By adding your domain, you are telling Supabase that `sivanujan.online` is a safe destination for your users.

### Troubleshooting:
If you see an "Invalid Redirect URL" error when signing up or logging in:
-   Double-check that the URL in your dashboard exactly matches `http://sivanujan.online:3000`.
-   Ensure there are no leading/trailing spaces in the URL field.
