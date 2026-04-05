# Fix: Supabase Verification Emails Not Sending

If users are not receiving verification emails, it is almost certainly due to Supabase's default email provider being rate-limited. This guide provides the permanent fix for production.

---

## 1. The Permanent Fix (Custom SMTP)

Supabase recommends using a dedicated SMTP provider (Resend, SendGrid, Postmark) for reliable email delivery.

### Gmail SMTP Setup (Special Requirements):
If you are using **thanarasansivanujan@gmail.com**, you must follow these steps or Gmail will block Supabase:

1.  **Enable 2-Step Verification** in your [Google Account Security Settings](https://myaccount.google.com/security).
2.  Search for **"App Passwords"** in your Google Account.
3.  Generate a new app password (select "Other" and name it "Supabase").
4.  Copy the **16-character code** (e.g., `abcd efgh ijkl mnop`).
5.  In the [Supabase Dashboard](https://supabase.com/dashboard):
    - **Host**: `smtp.gmail.com`
    - **Port**: `587`
    - **User**: `thanarasansivanujan@gmail.com`
    - **Pass**: Your **16-character App Password** (NOT your regular password).
    - **Sender Email**: Must be `thanarasansivanujan@gmail.com`.

---

## 2. The Development Workaround (Disable Confirmation)

If you are just testing locally and don't want to deal with emails yet, you can disable the confirmation requirement.

1.  In the [Supabase Dashboard](https://supabase.com/dashboard):
    -   Go to **Authentication** > **Auth Settings**.
    -   Under **Email Auth**, toggle **Confirm Email** to **OFF**.
2.  Users will now be able to log in immediately after registration without needing a link.

---

## 3. The Administrative Override (Force Verify)

I have added a **"Verify Email"** button to the **KIO-X Admin User Inventory**.

1.  Log in as a **Super Admin**.
2.  Go to **User Inventory**.
3.  Locate the user who didn't receive their email.
4.  Click **"Verify Email"**.
5.  The system will manually mark that user as verified in the database, allowing them to proceed.

---

> [!TIP]
> For production, **always** use a custom SMTP provider. The default Supabase "explorer" emails are only intended for initial setup and have very strict daily limits.
