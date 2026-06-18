# 🩺 Skinova — AI-Powered Dermatology Assistant

Skinova is a full-stack AI dermatology web app that lets patients upload a photo of a skin condition, get an AI-assisted diagnosis with a confidence score, check drug interactions, track medical history, find nearby clinics, watch awareness videos, and chat with an in-app assistant — all backed by Supabase and Firebase.

---

## ✨ Features

- 🔐 **Authentication** — Email/password sign up & login via Supabase Auth
- 📤 **AI Skin Diagnosis** — Upload a photo and get disease prediction + confidence score
- 💊 **Drug Interaction Checker** — Flags conflicts between suggested treatment and chronic medications
- 📋 **Medical History** — Stores and displays past diagnoses
- 🗺️ **Clinics & Pharmacies Map** — Find nearby dermatologists
- 🎥 **Awareness Videos** — Curated YouTube content (English & Arabic) for 35+ skin conditions
- 👥 **Community** — Patient discussion space powered by Firebase Firestore
- 🤖 **ChatBot** — In-app AI assistant
- 🌗 **Dark Mode**, profile avatar upload, notifications, and a gamified progress tracker
- 🔔 **Medication Reminders** — Background notifications via Service Worker (PWA-style)

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript, Vite, Tailwind CSS, shadcn/ui |
| Auth & DB | Supabase (Postgres + Realtime) |
| Community Chat | Firebase Firestore |
| AI Backend | Python + FastAPI + PyTorch |
| Background Notifications | Service Worker |

---

## 📦 Prerequisites

- **Node.js** v18+ and npm
- **Python** 3.10+
- A [Supabase](https://supabase.com/) account and project
- A [Firebase](https://firebase.google.com/) project (for community chat)

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/skinova.git
cd skinova
```

---

### 2. Frontend Setup

Install dependencies:

```bash
npm install
```

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

> ⚠️ Never commit your `.env` file. Make sure it's listed in `.gitignore`.

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

Build for production:

```bash
npm run build
npm run preview
```

---

### 3. AI Backend Setup (Python)

Create and activate a virtual environment:

```bash
python -m venv venv
```

```bash
# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate
```

Install dependencies:

```bash
pip install fastapi uvicorn torch torchvision pillow numpy python-multipart
```

> After installing, generate a requirements file for others:
> ```bash
> pip freeze > requirements.txt
> ```

Start the AI diagnosis server:

```bash
python -m uvicorn api_server:app --host 0.0.0.0 --port 8000 --reload
```

The server will be available at `http://localhost:8000`

> The frontend will show **"⚠️ Cannot connect to AI server"** on the Upload & Diagnose page if this server isn't running.

---

## 🗄️ Supabase Setup

Make sure your Supabase project has:

- **Auth:** Email/password sign-up enabled
- **Table:** `profiles` — stores `full_name`, `gender`, `birth_date`, `avatar_url`, linked to `auth.users` by `id`
- **Table:** `diagnosis_history` — stores diagnosis records per user
- **Storage bucket:** `avatars` — public bucket for profile picture uploads
- **RLS policies** configured so users can only read/write their own data

---

## 📁 Project Structure

```
myAPP/
├── public/
│   ├── sw.js                  # Medication reminder service worker (interval-based)
│   └── reminder-sw.js         # Medication reminder service worker (message-based)
├── src/
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   ├── figma/             # Logo / image components
│   │   ├── Awareness.tsx
│   │   ├── ChatBot.tsx
│   │   ├── ClinicsMap.tsx
│   │   ├── Community.tsx
│   │   ├── Dashboard.tsx
│   │   ├── diseaseData.ts
│   │   ├── diseaseVideos.ts
│   │   ├── DrugInteraction.tsx
│   │   ├── LoginPage.tsx
│   │   ├── MedicalHistory.tsx
│   │   ├── Navbar.tsx
│   │   ├── Sidebar.tsx
│   │   └── UploadDiagnosis.tsx
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css
│   ├── firebase.ts
│   ├── supabaseClient.ts
│   ├── diagnosisHistory.ts
│   └── useNotifications.ts
├── api_server.py              # Python AI backend
├── best_model2.pth            # Trained PyTorch model weights (~337 MB)
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── .gitignore
```

---

## 🔑 Environment Variables

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase public/anon key |
| `VITE_FIREBASE_API_KEY` | Firebase API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase app ID |

---

## 🧪 Commands Reference

| Command | Description |
|---|---|
| `git clone <url>` | Clone the repository |
| `npm install` | Install frontend dependencies |
| `npm run dev` | Start frontend dev server (port 5173) |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `python -m venv venv` | Create Python virtual environment |
| `pip install fastapi uvicorn torch torchvision pillow numpy python-multipart` | Install backend dependencies |
| `python -m uvicorn api_server:app --host 0.0.0.0 --port 8000 --reload` | Start AI diagnosis server (port 8000) |

---

## 📖 How to Install & Run Skinova

> Follow these steps in order. You'll need two terminal windows open at the same time.

---

### 🔽 Step 1 — Download the Project

```bash
git clone https://github.com/<your-username>/skinova.git
cd skinova
```

---

### ⚙️ Step 2 — Install Frontend Dependencies

```bash
npm install
```

---

### 🔐 Step 3 — Set Up Your Environment Variables

Create a `.env` file in the project root and fill in your Supabase and Firebase credentials:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

---

### 🤖 Step 4 — Set Up the AI Backend

Open a **second terminal** and run:

```bash
# Create virtual environment
python -m venv venv

# Activate it (Windows)
venv\Scripts\activate

# Activate it (macOS / Linux)
source venv/bin/activate

# Install dependencies
pip install fastapi uvicorn torch torchvision pillow numpy python-multipart

# Start the AI server
python -m uvicorn api_server:app --host 0.0.0.0 --port 8000 --reload
```

---

### 🚀 Step 5 — Launch the App

Back in your **first terminal**, run:

```bash
npm run dev
```

---

### ✅ You're All Set!

| Service | URL |
|---|---|
| 🌐 Frontend (App) | http://localhost:5173 |
| 🤖 AI Backend | http://localhost:8000 |

> Both must be running at the same time for the full app to work.

---

## ▶️ Full Run Guide (Step by Step)

### Terminal 1 — Frontend

```bash
# 1. Clone the project
git clone https://github.com/<your-username>/skinova.git
cd skinova

# 2. Install dependencies
npm install

# 3. Create your .env file and fill in the values
cp .env.example .env

# 4. Start the frontend dev server
npm run dev
```

---

### Terminal 2 — AI Backend

```bash
# 1. Go to the project folder (if not already there)
cd skinova

# 2. Create a virtual environment
python -m venv venv

# 3. Activate it
# Windows:
venv\Scripts\activate
# macOS / Linux:
source venv/bin/activate

# 4. Install backend dependencies
pip install fastapi uvicorn torch torchvision pillow numpy python-multipart

# 5. Start the AI server
python -m uvicorn api_server:app --host 0.0.0.0 --port 8000 --reload
```

> ✅ Both servers must be running at the same time for the app to work fully.
>
> - Frontend → `http://localhost:5173`
> - AI Backend → `http://localhost:8000`

---

## ⚠️ Before Pushing to GitHub

- **Model file size:** `best_model2.pth` is ~337 MB — GitHub blocks files over 100 MB. Use [Git LFS](https://git-lfs.com/) or host the model externally (Hugging Face Hub, Google Drive, S3).
- Make sure `.env` is in `.gitignore` and not tracked.
- Move any hardcoded Supabase credentials in `supabaseClient.ts` to `.env`.

---

## ⚠️ Disclaimer

Skinova is built for educational/informational purposes. AI-generated diagnoses are **not** a substitute for professional medical advice. Always consult a licensed dermatologist for actual diagnosis and treatment.

---

## 📄 License

MIT License — free to use, modify, and distribute with attribution.

---

## 🙏 Credits

Built with [shadcn/ui](https://ui.shadcn.com), [Radix UI](https://radix-ui.com), [Tailwind CSS](https://tailwindcss.com), [Supabase](https://supabase.com), and [Firebase](https://firebase.google.com).
