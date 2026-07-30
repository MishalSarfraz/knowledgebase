# Internal Knowledge Base

A lightweight, self-hosted web application for a small team of **35 users** to organize internal projects, Q&A, and shared documents.

This application is built with simplicity, trust, and speed as core principles. It is a shared place where the team stores files and asks/answers questions.

---

## 🚀 Core Principles
* **Simplicity First**: Fast loading, lightweight design, and no unnecessary features.
* **Trusted Model**: No logins, roles, permissions, or approval workflows. Anyone can create, edit, or delete anything.
* **Zero Bloat**: No notifications, comments on answers, votes, likes, or AI integrations.

---

## 🛠️ Technology Stack
* **Frontend**: Next.js 15 (App Router), React 19, TypeScript, TailwindCSS v4.
* **Backend**: Next.js App Router Route Handlers (RESTful JSON endpoints).
* **Database**: SQLite with Prisma Client ORM (v6).
* **Storage**: Local filesystem storage inside the `/uploads` directory at the project root.

---

## 📂 Project Directory Structure

```
/internal-knowledge-base
├── prisma/
│   ├── schema.prisma        # Database schema (SQLite)
│   └── dev.db               # SQLite database file (auto-generated)
├── uploads/                 # Local uploaded files (auto-created on first upload)
├── src/
│   ├── app/
│   │   ├── layout.tsx       # Global layout containing the sidebar
│   │   ├── page.tsx         # Dashboard landing / Global Search results
│   │   ├── projects/
│   │   │   └── [projectId]/
│   │   │       ├── page.tsx # Projects page (Questions & Files tabs)
│   │   │       └── questions/
│   │   │           └── [questionId]/
│   │   │               └── page.tsx # Question detail and Answers feed
│   │   └── api/             # Next.js Route Handlers
│   ├── components/
│   │   ├── Modal.tsx        # Reusable modal based on native HTML5 <dialog>
│   │   └── Sidebar.tsx      # Sidebar navigation & project creator
│   └── lib/
│       ├── db.ts            # Prisma Client singleton configuration
│       └── utils.ts         # Utility helpers
```

---

## 🚀 Getting Started (1-Click Run)

To run the application instantly without entering commands manually:
* **Windows**: Double-click the **[run.bat](file:///C:/Users/Mishal%20Sarfraz/internal-knowledge-base/run.bat)** file.
* **macOS / Linux**: Run **`./run.sh`** from your terminal (ensure it has execute permissions: `chmod +x run.sh`).

These scripts will automatically check for Node.js, install dependencies if missing, sync the SQLite database, compile the production build, and launch the server. The application will be accessible at **http://localhost:3000**.

---

## 🛠️ Manual Installation (Alternative)

If you prefer to run the application manually from your command line:

### 1. Install Dependencies
```bash
npm install
```

### 2. Initialize the SQLite Database
```bash
npx prisma db push
```

### 3. Run in Development Mode
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build & Run in Production Mode
```bash
npm run build
npm run start
```

---

## 💾 Database Schema (Prisma Models)

The SQLite database consists of four straightforward models:

- **Project**: Represents a category or subject (e.g. Gumroad Products, SEO, Marketing). Contains associated Questions and Files.
- **Question**: A question posed under a Project. Features a title, a plain text/markdown description, and automatic timestamp tracking.
- **Answer**: Multiple answers linked to a single Question. Ordered chronologically.
- **File**: Metadata for files uploaded under a Project. Stores the generated unique name on disk, original name, mime-type, and size.

---

## 📁 File Uploads Configuration
Files uploaded by users are stored on-disk in the local `/uploads` directory. To prevent directory traversal and name collisions, filenames are generated dynamically using `crypto.randomUUID()`. Downloads are handled via a dedicated secure Route Handler (`GET /api/files/download/[fileId]`) which sets the correct MIME headers and original filename attachment headers.
