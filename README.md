# StudySphere AI 🌐

StudySphere AI is an AI-powered, collaborative study portal designed to optimize and personalize the learning experience. By combining **Retrieval-Augmented Generation (RAG)**, **Multi-Agent Workflows**, **Spaced Repetition (SRS)**, and interactive study tools, StudySphere transforms flat study materials (PDFs, DOCX, PPTX, XLSX) into an interactive, high-fidelity learning playground.

The application leverages a modern microservices architecture with a **Next.js 16 & React 19** frontend, a **FastAPI** backend, and is powered by **LlamaIndex**, **LangGraph**, and the **Google Gemini API**.

---

## 🚀 Key Features

### 📂 Multi-Format Document Library
* **Smart Parsing:** Upload textbooks, research papers, slides, or spreadsheet datasets (`.pdf`, `.docx`, `.pptx`, `.xlsx`).
* **Vector Embeddings:** Automatically chunks and vectorizes documents using `models/embedding-001` and indexes them into **ChromaDB** for semantic search.

### 💬 Conversational AI Tutor (RAG)
* **Contextual Q&A:** A conversational chat interface tied directly to your active document.
* **Instant Definitions:** Ask for quick explanations, key summaries, or concept clarifications.

### 📝 Notion-Style Study Notes
* **Rich block-based editor** to format study guides, write takeaways, and organize knowledge.
* **AI-assisted writing** featuring text expansion, summaries, and instant highlights.

### 🧠 Spaced Repetition Flashcards (SRS)
* **SM-2 Algorithm:** Leverages the **SuperMemo-2 (SM-2)** algorithm to schedule cards.
* **Leitner Box System:** Cards are organized into five boxes; correct answers promote them to longer review intervals, while mistakes demote them for immediate re-learning.

### 📝 Smart Quizzes & Assessments
* **Custom Questions:** Generates multiple-choice, true/false, and short-answer questions tailored to document topics.
* **Explanations:** Grading is accompanied by step-by-step correct answer explanations to facilitate active learning.

### 🎧 Educational Audio / Podcast Script Generator
* **Two-Speaker Dialogue:** Converts document contents into a lively script featuring **Host A** (the inquisitive listener) and **Host B** (the expert analyst).
* Perfect for auditory learners or reviewing topics on-the-go.

### 📈 Multi-Agent Roadmaps & Performance Analytics
* **LangGraph Planner-Reviewer Graph:** Orchestrates a two-stage agent workflow:
  1. **Planner:** Analyzes document structures to outline sequential learning steps.
  2. **Reviewer:** cross-references the student's actual quiz attempts and performance logs to insert personalized feedback and focus areas directly onto their roadmap.

### 📝 Shared Collaborative Notes (Y.js + Hocuspocus)
* **Real-time Synchronization:** Write and edit room study notes simultaneously with classmates using the Tiptap collaborative rich-text editor.
* **Caret Tracking:** Cursors show other active users' typing positions and Clerk profiles colored dynamically.
* **Database Sync:** Auto-saves HTML representations to MongoDB for querying and AI tutor inputs.

### 🧠 AI Quiz & Flashcard Generators
* **SRS Flashcards:** Instantly generates 10 study flashcards using OpenAI/Gemini models directly from the shared notes content.
* **MCQ Quizzes:** Automatically creates a 10-question multiple choice interactive practice test from notes.

### 📊 Study Analytics Workspace
* **Automated Heartbeats:** Auto-tracks study durations through client pings while users study inside a room.
* **Distribution Graphs:** Displays time breakdown progress bars per subject, quiz averages, message volumes, and activity logs.

### 🏆 Leaderboard & Gamification
* **XP Rewards:** Earn XP for active chat participation (+2 XP), saving note updates (+10 XP), and taking room quizzes (+50 XP base, +10 XP/correct).
* **Standings Board:** Features a podium spotlight for the top 3 scholars and lists all classmates sorted by level and XP.

---

## 🛠️ Technology Stack

### Frontend
* **Core:** Next.js 16 (App Router), React 19, TypeScript
* **Styling:** Tailwind CSS v4, Framer Motion (micro-animations), Lucide Icons
* **State Management:** Zustand
* **Authentication:** Clerk Auth
* **UI Components:** Shadcn UI, Base UI

### Backend
* **Core:** FastAPI, Uvicorn, Python 3.10+
* **Orchestration & RAG:** LlamaIndex (Core, Gemini LLM, Gemini Embedding, Chroma Vector Store)
* **Agent Workflows:** LangGraph (StateGraph orchestration)
* **Database:** SQLite (local development) / PostgreSQL (production-ready via SQLAlchemy & Alembic)
* **Vector Store:** ChromaDB (persistent vector index)

---

## 📁 Repository Structure

```text
studysphere/
├── backend/
│   ├── app/
│   │   ├── api/v1/         # FastAPI Routers (Chat, Notes, Quizzes, Flashcards, Agents, Audio)
│   │   ├── db/             # SQLAlchemy Session & Base configuration
│   │   ├── models/         # Database models (Note, Quiz, Question, Flashcard, SRS Progress)
│   │   ├── services/       # Core business logic (LangGraph workflow, note, and flashcard management)
│   │   │   └── document/   # SimpleDirectoryReader parser & Chroma vector database uploads
│   │   │   └── rag/        # LlamaIndex query engine execution
│   │   └── main.py         # App initialization & FastAPI startup configuration
│   ├── chroma_db/          # Persistent ChromaDB store (created dynamically)
│   ├── requirements.txt    # Python dependencies
│   └── studysphere.db      # SQLite relational database (created dynamically)
├── frontend/
│   ├── src/
│   │   ├── app/            # Next.js App Router Pages (Globals, layout, sidebar routing)
│   │   ├── components/     # React Workspaces (Chat, Notes, Flashcards, Quizzes, Analytics)
│   │   └── lib/            # Axios API connections & utility functions
│   ├── package.json        # Frontend scripts and node libraries
│   └── tsconfig.json       # TypeScript options
├── docker-compose.yml      # Services setup (PostgreSQL and ChromaDB containers)
└── LICENSE                 # Repository license
```

---

## ⚙️ Local Development Setup

Follow these steps to run StudySphere AI on your machine:

### Prerequisites
* Python 3.10 or higher
* Node.js v18 or higher
* npm or yarn
* [Google Gemini API Key](https://aistudio.google.com/)
* [Clerk API Credentials](https://clerk.com/)

---

### Step 1: Run Infrastructure Services (Optional)
If you wish to run PostgreSQL and ChromaDB in Docker containers, run:
```bash
docker compose up -d
```
*Otherwise, by default, the backend will auto-initialize a local SQLite database (`studysphere.db`) and a local persistent Chroma DB folder (`chroma_db`).*

---

### Step 2: Configure & Start Backend

1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   # On Windows
   python -m venv venv
   .\venv\Scripts\activate

   # On macOS/Linux
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Set your environment variables:
   Create a `.env` file or export variables:
   ```env
   # Required for LlamaIndex & LangGraph to run
   GOOGLE_API_KEY="your-gemini-api-key-here"

   # Optional (falls back to local sqlite)
   # DATABASE_URL="postgresql://studysphere_user:studysphere_password@localhost:5432/studysphere_db"
   ```
5. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload
   ```
   *The API will be available at [http://127.0.0.1:8000](http://127.0.0.1:8000). You can browse the Swagger docs at `/docs`.*

---

### Step 3: Configure & Start Frontend

1. Navigate to the frontend folder:
   ```bash
   cd ../frontend
   ```
2. Create a `.env.local` file in the frontend root:
   ```env
   NEXT_PUBLIC_API_BASE_URL="http://127.0.0.1:8000"

   # Clerk Auth credentials
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
   CLERK_SECRET_KEY="sk_test_..."
   ```
3. Install node packages:
   ```bash
   npm install
   ```
4. Start the Next.js development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## 📈 System Architecture & Multi-Agent Flow

```mermaid
graph TD
    User([User]) -->|Uploads Document| FE[Next.js Frontend]
    FE -->|API Post Request| BE[FastAPI Backend]
    
    subgraph FastAPI Processing
        BE -->|SimpleDirectoryReader| Llama[LlamaIndex RAG Engine]
        Llama -->|Chunk & Embed| VecDb[(ChromaDB)]
    end
    
    User -->|Attempts Quiz| Quiz[Quiz Engine]
    Quiz -->|Persists Score| RDB[(Relational DB)]
    
    subgraph Multi-Agent Roadmap Generator [LangGraph]
        direction TB
        Init[Start State] --> Planner[Planner Agent Node]
        Planner -->|Extracts Structure from ChromaDB| Reviewer[Reviewer Agent Node]
        Reviewer -->|Pulls Quiz Metrics from DB| Analyze[Combine & Adjust Steps]
        Analyze --> End[Generate Tailored Roadmap + Recommendations]
    end
    
    RDB -->|Quiz Scores| Reviewer
    VecDb -->|Docs Context| Planner
    End -->|JSON Response| FE
```

---

## 📝 License

Distributed under the MIT License. See `LICENSE` for more details.
