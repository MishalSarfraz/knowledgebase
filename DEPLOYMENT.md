# Deployment Guide

This guide covers setting up and deploying the Internal Knowledge Base to Vercel with PostgreSQL (Neon), Google OAuth, and Cloudflare R2 for file storage.

---

## Prerequisites

- A [GitHub](https://github.com) account
- A [Vercel](https://vercel.com) account (free tier works)
- A [Google Cloud](https://console.cloud.google.com) account
- A [Cloudflare](https://cloudflare.com) account (free tier with R2)
- A [Neon](https://neon.tech) account (free tier PostgreSQL)

---

## 1. PostgreSQL Database (Neon)

Neon provides a free serverless PostgreSQL database.

### Steps

1. Go to [neon.tech](https://neon.tech) and sign up (or log in with GitHub)
2. Create a new project:
   - Click **"Create a project"**
   - Give it a name (e.g., `knowledgebase`)
   - Select the region closest to your team
   - Click **"Create project"**
3. After creation, you'll see a connection string:


4. Copy this string — you'll use it as `DATABASE_URL`

> **Note**: For the free tier, the database will auto-pause after 5 minutes of inactivity. This is fine for development but for production you may want to upgrade.

---

## 2. Google OAuth Credentials

Google OAuth lets team members sign in with their Google accounts.

### Steps
 
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or select an existing one):
   - Click the project dropdown at the top
   - Click **"New Project"**
   - Name it (e.g., `Internal Knowledge Base`)
   - Click **"Create"**
3. Go to **"APIs & Services"** → **"Credentials"**
4. Click **"Create Credentials"** → **"OAuth 2.0 Client ID"**
5. Configure the OAuth consent screen:
   - **User Type**: External
   - Fill in the required fields (app name, support email, etc.)
   - Add your email as a test user (for development)
    - Click **"Save and Continue"** through all screens
6. Back in **Credentials**, click **"Create Credentials"** → **"OAuth 2.0 Client ID"**
7. Set **Application type**: Web application
8. Under **"Authorized redirect URIs"**, add these URLs:

   ```
   http://localhost:3000/api/auth/callback/google
   https://your-app-name.vercel.app/api/auth/callback/google
   ```

   (Replace `your-app-name` with your actual Vercel project name)

9. Click **"Create"**
10. You'll see a modal with:
    - **Client ID** → copy as `AUTH_GOOGLE_ID`
    - **Client Secret** → copy as `AUTH_GOOGLE_SECRET`

---

## 3. Cloudflare R2 (File Storage)

R2 is S3-compatible object storage. Uploaded files (documents, images, etc.) are stored here instead of on the server's disk.

### Steps

1. Go to [cloudflare.com](https://cloudflare.com) and sign in
2. In the dashboard, go to **R2** (under "Storage" in the left menu)
3. Create a bucket:
   - Click **"Create bucket"**
   - Give it a name (e.g., `knowledgebase-uploads`)
   - Select the region
   - Click **"Create"**
4. Generate an API token:
   - Go to **R2** → **"Manage API Tokens"**
   - Click **"Create API token"**
   - Give it a name (e.g., `knowledgebase-deploy`)
   - Set **Permissions**: **Object Read & Write**
   - Click **"Create"**
5. Copy the credentials shown:

   ```
   Access Key ID:     <long string>  → R2_ACCESS_KEY_ID
   Secret Access Key: <long string>  → R2_SECRET_ACCESS_KEY
   ```

6. Get your endpoint URL:
   - Go to **R2** → **"Buckets"**
   - Click on your bucket name
   - Under **"Properties"** you'll find the endpoint like:
     ```
     https://<account-id>.r2.cloudflarestorage.com
     ```
   - This is your `R2_ENDPOINT`

   Alternatively, the endpoint format is:
   ```
   https://<your-account-id>.r2.cloudflarestorage.com
   ```
   Your account ID is displayed in the R2 dashboard.

---

## 4. Generate NEXTAUTH_SECRET

This is a random string used to encrypt session cookies.

### Steps

Run this command in your terminal:

```bash
openssl rand -base64 32
```

Copy the output — that's your `NEXTAUTH_SECRET`.

---

## 5. Environment Variables Summary

Create a `.env` file in the project root (or set these in Vercel dashboard).

### `.env` (local development)

```
# Database
DATABASE_URL="postgresql://user:password@ep-xxxx.us-east-2.aws.neon.tech/knowledgebase?sslmode=require"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-openssl-generated-secret"
AUTH_GOOGLE_ID="your-google-client-id"
AUTH_GOOGLE_SECRET="your-google-client-secret"

# Cloudflare R2
R2_ENDPOINT="https://<account-id>.r2.cloudflarestorage.com"
R2_ACCESS_KEY_ID="your-r2-access-key"
R2_SECRET_ACCESS_KEY="your-r2-secret-key"
R2_BUCKET_NAME="knowledgebase-uploads"
```

---

## 6. Deploy to Vercel

### Steps

1. Push your code to GitHub:

   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/knowledgebase.git
   git push -u origin main
   ```

2. Go to [vercel.com](https://vercel.com) and sign in with GitHub
3. Click **"Add New"** → **"Project"**
4. Import your GitHub repository
5. In the **"Configure Project"** step:
   - **Framework Preset**: Next.js (auto-detected)
   - **Build Command**: Keep default (it will use the `build` script from package.json)
6. Click **"Environment Variables"** and add all variables from the table below:

| Variable | Where to get it |
|---|---|
| `DATABASE_URL` | Neon project dashboard → connection string |
| `NEXTAUTH_URL` | Your Vercel deployment URL (e.g., `https://knowledgebase.vercel.app`) |
| `NEXTAUTH_SECRET` | Run `openssl rand -base64 32` in your terminal |
| `AUTH_GOOGLE_ID` | Google Cloud Console → Credentials → OAuth client ID |
| `AUTH_GOOGLE_SECRET` | Google Cloud Console → Credentials → OAuth client secret |
| `R2_ENDPOINT` | Cloudflare R2 dashboard → bucket endpoint |
| `R2_ACCESS_KEY_ID` | Cloudflare R2 → API Tokens |
| `R2_SECRET_ACCESS_KEY` | Cloudflare R2 → API Tokens |
| `R2_BUCKET_NAME` | Your R2 bucket name (e.g., `knowledgebase-uploads`) |

7. Click **"Deploy"**
8. Wait for the build to complete (1-2 minutes)
9. Once deployed, Vercel gives you a URL like `https://knowledgebase-xxx.vercel.app`
10. **Important**: Go back to Google Cloud Console and update the authorized redirect URI to match your actual Vercel URL:
    ```
    https://knowledgebase-xxx.vercel.app/api/auth/callback/google
    ```

### Create the initial Prisma migration

After the first deploy, you need to create the initial migration file. Run this locally with your `DATABASE_URL` set:

```bash
npx prisma migrate dev --name init
```

Then commit and push the generated migration folder:

```bash
git add prisma/migrations
git commit -m "Add initial Prisma migration"
git push
```

On the next Vercel deployment, `prisma migrate deploy` will run automatically.

---

## 7. Custom Domain (Optional)

In Vercel dashboard:
1. Go to your project → **"Settings"** → **"Domains"**
2. Add your custom domain
3. Follow Vercel's DNS configuration instructions

Then update:
- `NEXTAUTH_URL` env var to your custom domain
- Google OAuth redirect URI to `https://yourdomain.com/api/auth/callback/google`

---

## 8. Local Development

Steps to run locally after setting up the `.env` file:

```bash
npm install
npx prisma generate
npx prisma db push      # or: npx prisma migrate dev
npm run dev
```

The app will be at `http://localhost:3000`.

---

## Quick Reference: Where to Get Each Key

| Key | Where to Find It |
|---|---|
| `DATABASE_URL` | [Neon](https://neon.tech) → Project dashboard → Connection details |
| `AUTH_GOOGLE_ID` | [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials |
| `AUTH_GOOGLE_SECRET` | Same page as above |
| `NEXTAUTH_SECRET` | Run `openssl rand -base64 32` in terminal |
| `NEXTAUTH_URL` | Your Vercel deployment URL |
| `R2_ENDPOINT` | [Cloudflare R2](https://dash.cloudflare.com) → R2 → Bucket → Properties → Endpoint |
| `R2_ACCESS_KEY_ID` | Cloudflare R2 → Manage API Tokens |
| `R2_SECRET_ACCESS_KEY` | Cloudflare R2 → Manage API Tokens |
| `R2_BUCKET_NAME` | Your chosen bucket name (e.g., `knowledgebase-uploads`) |
