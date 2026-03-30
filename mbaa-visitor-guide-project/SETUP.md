# MBAA Visitor Guide App - Setup Instructions

This guide walks you through deploying the app from scratch. No prior development experience is assumed.

---

## What You Need Before Starting

1. A computer with internet access
2. A free GitHub account (github.com)
3. A free Supabase account (supabase.com)
4. A free Vercel account (vercel.com)

That's it. All three services have free tiers that will cover this project.

---

## Step 1: Set Up Supabase (Your Database)

1. Go to **supabase.com** and create a free account
2. Click **New Project**
3. Name it `mbaa-visitor-guide`
4. Choose a strong database password (save this somewhere safe)
5. Select the region closest to you (West US is fine)
6. Click **Create new project** and wait for it to finish (takes about 2 minutes)

### Create the database tables

1. In your Supabase dashboard, click **SQL Editor** in the left sidebar
2. Click **New query**
3. Open the file `sql/schema.sql` from the project files
4. Copy the entire contents and paste it into the SQL editor
5. Click **Run**
6. You should see "Success. No rows returned" - this is correct

### Get your credentials

1. In the Supabase dashboard, go to **Settings** (gear icon) > **API**
2. Copy the **Project URL** - it looks like `https://abcdefgh.supabase.co`
3. Copy the **anon public** key under "Project API keys"
4. Save both of these - you'll need them in Step 3

---

## Step 2: Put the Code on GitHub

### If you're comfortable with Git:

1. Create a new repository on GitHub named `mbaa-visitor-guide`
2. Push the project files to it

### If you've never used Git:

1. Go to **github.com** and sign in
2. Click the **+** icon in the top right, then **New repository**
3. Name it `mbaa-visitor-guide`
4. Leave it set to **Public** (Vercel free tier requires this)
5. Click **Create repository**
6. On the next page, click **uploading an existing file**
7. Drag and drop ALL project files and folders into the upload area
8. Click **Commit changes**

Make sure the folder structure looks like this in your repo:

```
mbaa-visitor-guide/
  app/
    page.jsx
    layout.jsx
    globals.css
    admin/
      page.jsx
  lib/
    supabase.js
  sql/
    schema.sql
  package.json
  next.config.js
```

---

## Step 3: Deploy on Vercel

1. Go to **vercel.com** and sign in with your GitHub account
2. Click **Add New** > **Project**
3. Find your `mbaa-visitor-guide` repository and click **Import**
4. Under **Environment Variables**, add these two:

   | Name | Value |
   |------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project URL from Step 1 |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon public key from Step 1 |

5. Click **Deploy**
6. Wait 1-2 minutes for the build to finish

When it's done, Vercel gives you a URL like `mbaa-visitor-guide.vercel.app`. That's your live app.

---

## Step 4: Verify It Works

1. Visit your Vercel URL - you should see the public submission form
2. Visit `your-url/admin` - you should see the admin dashboard (empty)
3. Submit a test entry through the form
4. Go to the admin dashboard and verify the entry appears
5. Try editing the status, payment status and volunteer fields
6. Try the CSV export button

---

## How to Use the App

### Public Form (yoursite.com)
- Share this URL with businesses or embed it in outreach emails
- Businesses fill it out, submit, and the data goes straight to Supabase
- File uploads (logos, images) are stored in Supabase Storage

### Admin Dashboard (yoursite.com/admin)
- View all submissions in a filterable table
- Click any row to open the detail panel on the right
- Edit status, payment status, volunteer assignment and notes directly
- Use filters to narrow by participation type, status, category or placement
- Export filtered data as CSV anytime

---

## Customizing

### Change the submission deadline
In `app/page.jsx`, search for `[INSERT DATE]` and replace it with your actual deadline.

### Change the site URL
If you want a custom domain (like `guide.morrobayart.org`), go to your Vercel project settings > Domains and add it there. You'll need to update your DNS records.

### Add password protection to the admin page
For basic protection, you can add Vercel's built-in password protection:
1. In the Vercel dashboard, go to your project settings
2. Under **Deployment Protection**, enable password protection
3. Or restrict just the `/admin` path

---

## Troubleshooting

**Form submissions aren't appearing in the admin dashboard**
- Check the browser console (right-click > Inspect > Console) for errors
- Verify your Supabase credentials are correct in Vercel environment variables
- Make sure you ran the SQL schema in Step 1

**File uploads fail**
- Confirm the storage bucket was created (check Supabase dashboard > Storage)
- Make sure the storage policies from the schema SQL were applied

**Admin page is blank**
- Check if the Supabase URL and key are set correctly
- Try clicking "Refresh" on the admin page

**CSV export isn't working**
- Make sure pop-ups aren't blocked for the site
- Try a different browser if needed

---

## Costs

All three services (Supabase, Vercel, GitHub) have free tiers. For MBAA's expected volume (dozens to a few hundred submissions), you'll stay well within free limits.

- **Supabase Free Tier**: 500 MB database, 1 GB file storage, 50,000 monthly requests
- **Vercel Free Tier**: 100 GB bandwidth, unlimited deployments
- **GitHub Free Tier**: Unlimited public repositories

---

## Support

If something breaks or you need changes, the codebase is straightforward:
- `app/page.jsx` - the public submission form
- `app/admin/page.jsx` - the admin dashboard
- `lib/supabase.js` - database connection config
- `sql/schema.sql` - database structure

All business logic lives in those four files.
