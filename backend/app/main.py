from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import documents, chat, notes, quizzes, flashcards, agents, analytics, audio
from app.db.session import engine, Base

# Auto-create database tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(title="StudySphere AI API", version="1.0.0")

@app.on_event("startup")
def startup_event():
    from app.services.document.parser import init_settings
    try:
        init_settings()
    except Exception as e:
        print(f"Warning: Gemini models were not initialized at startup (GOOGLE_API_KEY may be missing). Details: {e}")

# Setup CORS for the Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(documents.router, prefix="/api/v1/documents", tags=["Documents"])
app.include_router(chat.router, prefix="/api/v1/chat", tags=["Chat"])
app.include_router(notes.router, prefix="/api/v1/notes", tags=["Notes"])
app.include_router(quizzes.router, prefix="/api/v1/quizzes", tags=["Quizzes"])
app.include_router(flashcards.router, prefix="/api/v1/flashcards", tags=["Flashcards"])
app.include_router(agents.router, prefix="/api/v1/agents", tags=["Agents"])
app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["Analytics"])
app.include_router(audio.router, prefix="/api/v1/audio", tags=["Audio"])

@app.get("/")
def read_root():
    return {"message": "Welcome to StudySphere AI API"}

