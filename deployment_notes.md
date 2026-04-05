# Deployment Notes - sivanujan.online:3000

If you are running the application on your custom server, please follow these deployment notes.

---

### 1. Port Configuration
The application is currently configured to listen on port `3000`. If you change this port, ensure you also update your Supabase Dashboard's Redirect URLs to match the new port.

### 2. Base URL
The application is built to be dynamic, but ensuring your `.env.local` or environment variables on the server reflect the final URL is highly recommended.

**Production Values:**
- `NEXT_PUBLIC_SITE_URL=http://sivanujan.online:3000`

### 3. Build & Start Commands
If you are running in production mode, use the following commands on your server:
```bash
# Build the optimized production bundle
npm run build

# Start the application in production mode
npm start
```

### 4. Running with PM2 (Optional)
If you'd like the application to stay active even if the terminal closes, use **PM2**:
```bash
pm2 start npm --name "kiox-portal" -- start
```

---

### Important Reminder:
For security, please ensure you use **HTTPS** if you plan to move beyond testing. This will require an SSL certificate (e.g., from Let's Encrypt) and updating the URLs in the Supabase Dashboard from `http` to `https`.
