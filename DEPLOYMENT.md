# Deployment Guide

Setting up and deploying the Internal Knowledge Base to Vercel with PostgreSQL (Neon), Google OAuth, and Uploadthing for file storage.

---

## Prerequisites

- A [GitHub](https://github.com) account
- A [Vercel](https://vercel.com) account (free tier)
- A [Google Cloud](https://console.cloud.google.com) account
- A [Neon](https://neon.tech) account (free PostgreSQL)
- An [Uploadthing](https://uploadthing.com) account (free tier, no credit card)

---

## 1. PostgreSQL Database (Neon)

1. Go to [neon.tech](https://neon.tech) and sign up
2. Click **"Create a project"**
   - Name: `knowledgebase`
   - Region: closest to your team
3. After creation, copy the connection string:

   ```
   postgresql://user:password@ep-xxxx.us-east-2.aws.neon.tech/knowledgebase?sslmode=require
   ```

   This is your `DATABASE_URL`.

---

## 2. Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project → name it (e.g., `Internal Knowledge Base`)
3. Go to **"APIs & Services"** → **"Credentials"**
4. Click **"Create Credentials"** → **"OAuth 2.0 Client ID"**
5. Configure the consent screen:
   - **User Type**: External
   - **Publishing status**: **In production** (Testing mode blocks non-test users)
   - Fill required fields (app name, support email)
6. Back in **Credentials**, create **OAuth 2.0 Client ID** (Web application)
7. Under **"Authorized redirect URIs"**, add the **exact full callback URLs** (no trailing slash):

   ```
   http://localhost:3000/api/auth/callback/google
   https://your-app-name.vercel.app/api/auth/callback/google
   ```

   ⚠️ Google requires an **exact match**. A redirect URI like `https://your-app.vercel.app/` (with only a trailing slash) will NOT work and causes `access blocked: this app request is invalid`.

8. Click **"Create"** and copy:
   - **Client ID** → `AUTH_GOOGLE_ID`
   - **Client Secret** → `AUTH_GOOGLE_SECRET`

### ⚠️ Access blocked / Google sign-in fails?

Check, in order:

1. **Redirect URI exact match** — the URI in Google Console must equal your URL + `/api/auth/callback/google`, with no trailing slash.
2. **App publishing status** — must be **In production** (not Testing), otherwise only your test users can sign in.
3. **`NEXTAUTH_URL`** — must match your Vercel URL exactly, **no trailing slash**.
4. **All env vars set** — `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `DATABASE_URL`.

---

## 3. Uploadthing (File Storage)

1. Go to [uploadthing.com](https://uploadthing.com) and sign in with GitHub
2. Click **"Create a new app"**
   - Name: `knowledgebase`
3. Go to **"API Keys"** tab
4. Copy the keys:
   - **Secret** → `UPLOADTHING_SECRET`
   - **App ID** → `UPLOADTHING_APP_ID`

---

## 4. Generate NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

---

## 5. Environment Variables

Set these in your `.env` file (local) or Vercel dashboard: 

| Variable | Where to get it |
|---|---|
| `DATABASE_URL` | Neon → project dashboard → connection string |
| `NEXTAUTH_URL` | `http://localhost:3000` (local) or `https://your-app.vercel.app` |
| `NEXTAUTH_SECRET` | Run `openssl rand -base64 32` |
| `AUTH_GOOGLE_ID` | Google Cloud Console → Credentials |
| `AUTH_GOOGLE_SECRET` | Google Cloud Console → Credentials |
| `UPLOADTHING_SECRET` | Uploadthing → API Keys |
| `UPLOADTHING_APP_ID` | Uploadthing → API Keys |

### Local `.env` file

```
DATABASE_URL="postgresql://user:password@ep-xxxx.us-east-2.aws.neon.tech/knowledgebase?sslmode=require"

NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-openssl-generated-secret"
AUTH_GOOGLE_ID="your-google-client-id"
AUTH_GOOGLE_SECRET="your-google-client-secret"

UPLOADTHING_SECRET="your-uploadthing-secret"
UPLOADTHING_APP_ID="your-uploadthing-app-id"
```

---

## 6. Deploy to Vercel

1. Push to GitHub:

   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/knowledgebase.git
   git push -u origin main
   ```

2. Go to [vercel.com](https://vercel.com) → **"Add New"** → **"Project"**
3. Import your GitHub repo
4. Click **"Environment Variables"** and add all 7 variables from the table above
5. Click **"Deploy"**
6. After deploy, copy your Vercel URL (e.g., `https://knowledgebase-xxx.vercel.app`)
7. Update `NEXTAUTH_URL` in Vercel dashboard to that URL
8. Update Google OAuth redirect URI in Google Cloud Console to `https://knowledgebase-xxx.vercel.app/api/auth/callback/google`

### Create initial Prisma migration

After first deploy, run locally:

```bash
npx prisma migrate dev --name init
```

Commit and push the generated `prisma/migrations` folder:

```bash
git add prisma/migrations
git commit -m "Add initial Prisma migration"
git push
```

On subsequent deploys, Vercel runs `prisma migrate deploy` automatically.

---

## 7. Local Development

```bash
npm install
npx prisma generate
npx prisma db push
npm run dev
```

The app is at `http://localhost:3000`.
