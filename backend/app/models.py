from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Float, JSON
from sqlalchemy.orm import relationship
from app.db.session import Base

class Note(Base):
    __tablename__ = "notes"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    content = Column(JSON, nullable=False)  # List of Notion-style blocks
    document_id = Column(String, nullable=True)  # Associated doc filename/ID
    user_id = Column(String, index=True, default="anonymous")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    document_id = Column(String, nullable=True)
    user_id = Column(String, index=True, default="anonymous")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    questions = relationship("Question", back_populates="quiz", cascade="all, delete-orphan")
    results = relationship("QuizResult", back_populates="quiz", cascade="all, delete-orphan")


class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False)
    question_text = Column(Text, nullable=False)
    question_type = Column(String, nullable=False)  # "mcq", "boolean", "short_answer"
    options = Column(JSON, nullable=True)  # List of strings (for MCQ/boolean)
    correct_answer = Column(String, nullable=False)  # Correct answer text or index
    explanation = Column(Text, nullable=True)

    quiz = relationship("Quiz", back_populates="questions")


class QuizResult(Base):
    __tablename__ = "quiz_results"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String, index=True, default="anonymous")
    score = Column(Integer, nullable=False)
    total_questions = Column(Integer, nullable=False)
    answers = Column(JSON, nullable=False)  # User's answers key-value mapping
    taken_at = Column(DateTime, default=datetime.utcnow)

    quiz = relationship("Quiz", back_populates="results")


class FlashcardDeck(Base):
    __tablename__ = "flashcard_decks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    document_id = Column(String, nullable=True)
    user_id = Column(String, index=True, default="anonymous")
    created_at = Column(DateTime, default=datetime.utcnow)

    cards = relationship("Flashcard", back_populates="deck", cascade="all, delete-orphan")


class Flashcard(Base):
    __tablename__ = "flashcards"

    id = Column(Integer, primary_key=True, index=True)
    deck_id = Column(Integer, ForeignKey("flashcard_decks.id", ondelete="CASCADE"), nullable=False)
    front = Column(Text, nullable=False)  # Question or Term
    back = Column(Text, nullable=False)  # Answer or Definition
    created_at = Column(DateTime, default=datetime.utcnow)

    deck = relationship("FlashcardDeck", back_populates="cards")
    progress = relationship("FlashcardProgress", uselist=False, back_populates="flashcard", cascade="all, delete-orphan")


class FlashcardProgress(Base):
    __tablename__ = "flashcard_progress"

    id = Column(Integer, primary_key=True, index=True)
    flashcard_id = Column(Integer, ForeignKey("flashcards.id", ondelete="CASCADE"), unique=True, nullable=False)
    user_id = Column(String, index=True, default="anonymous")
    box = Column(Integer, default=1)  # Leitner Box (1 to 5)
    next_review = Column(DateTime, default=datetime.utcnow)
    ease_factor = Column(Float, default=2.5)  # SM-2 difficulty ease factor
    interval = Column(Integer, default=1)  # Interval in days

    flashcard = relationship("Flashcard", back_populates="progress")
