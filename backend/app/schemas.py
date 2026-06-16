from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel

# ==================== NOTE SCHEMAS ====================

class NoteBlock(BaseModel):
    id: str
    type: str  # "heading_1", "heading_2", "paragraph", "bulleted_list_item", "numbered_list_item", "code", "callout", "todo_item"
    content: str
    checked: Optional[bool] = None

class NoteCreate(BaseModel):
    title: str
    content: List[NoteBlock]
    document_id: Optional[str] = None

class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[List[NoteBlock]] = None

class NoteOut(BaseModel):
    id: int
    title: str
    content: List[NoteBlock]
    document_id: Optional[str] = None
    user_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# ==================== QUIZ SCHEMAS ====================

class QuestionCreate(BaseModel):
    question_text: str
    question_type: str  # "mcq", "boolean", "short_answer"
    options: Optional[List[str]] = None
    correct_answer: str
    explanation: Optional[str] = None

class QuestionOut(BaseModel):
    id: int
    question_text: str
    question_type: str
    options: Optional[List[str]] = None
    correct_answer: str
    explanation: Optional[str] = None

    class Config:
        from_attributes = True

class QuizCreate(BaseModel):
    title: str
    document_id: Optional[str] = None

class QuizOut(BaseModel):
    id: int
    title: str
    document_id: Optional[str] = None
    created_at: datetime
    questions: List[QuestionOut]

    class Config:
        from_attributes = True

class QuizResultCreate(BaseModel):
    score: int
    total_questions: int
    answers: Dict[str, str]  # Question ID mapped to User's Answer

class QuizResultOut(BaseModel):
    id: int
    quiz_id: int
    user_id: str
    score: int
    total_questions: int
    answers: Dict[str, str]
    taken_at: datetime

    class Config:
        from_attributes = True

# ==================== FLASHCARD SCHEMAS ====================

class FlashcardCreate(BaseModel):
    front: str
    back: str

class FlashcardProgressOut(BaseModel):
    box: int
    next_review: datetime
    interval: int

    class Config:
        from_attributes = True

class FlashcardOut(BaseModel):
    id: int
    deck_id: int
    front: str
    back: str
    progress: Optional[FlashcardProgressOut] = None

    class Config:
        from_attributes = True

class FlashcardDeckCreate(BaseModel):
    title: str
    document_id: Optional[str] = None

class FlashcardDeckOut(BaseModel):
    id: int
    title: str
    document_id: Optional[str] = None
    created_at: datetime
    cards: List[FlashcardOut]

    class Config:
        from_attributes = True

class FlashcardReview(BaseModel):
    is_correct: bool  # Leitner: True shifts card box up, False resets card to box 1
