from datetime import datetime, date, timedelta
from fastapi import APIRouter, Depends, Header
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models import Note, Quiz, QuizResult, FlashcardProgress

router = APIRouter()

@router.get("/overview")
def get_analytics_overview(
    db: Session = Depends(get_db),
    x_user_id: str = Header(default="anonymous", alias="X-User-Id")
):
    # 1. Total counts
    total_notes = db.query(Note).filter(Note.user_id == x_user_id).count()
    total_quizzes = db.query(Quiz).filter(Quiz.user_id == x_user_id).count()
    quiz_attempts = db.query(QuizResult).filter(QuizResult.user_id == x_user_id).all()
    total_attempts = len(quiz_attempts)

    # 2. Average Quiz Accuracy
    avg_score = 0.0
    if total_attempts > 0:
        pct_scores = []
        for att in quiz_attempts:
            if att.total_questions > 0:
                pct_scores.append(att.score / att.total_questions)
        if pct_scores:
            avg_score = sum(pct_scores) / len(pct_scores) * 100

    # 3. Flashcard Box Distribution
    flashcards_prog = db.query(FlashcardProgress).filter(FlashcardProgress.user_id == x_user_id).all()
    boxes = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    for fp in flashcards_prog:
        if fp.box in boxes:
            boxes[fp.box] += 1
            
    mastered = boxes[5]
    learning = sum(boxes.values()) - mastered

    # 4. Streak Calculation
    # Fetch all dates user submitted a quiz
    attempt_dates = db.query(func.date(QuizResult.taken_at)).filter(
        QuizResult.user_id == x_user_id
    ).distinct().all()
    
    unique_dates = {d[0] for d in attempt_dates if d[0] is not None}
    
    # Also fetch all dates user created/updated notes
    note_dates = db.query(func.date(Note.created_at)).filter(
        Note.user_id == x_user_id
    ).distinct().all()
    
    for nd in note_dates:
        if nd[0] is not None:
            unique_dates.add(nd[0])
            
    # Calculate streak
    streak = 0
    today = date.today()
    
    # Check if user studied today or yesterday to continue streak
    if today in unique_dates or (today - timedelta(days=1)) in unique_dates:
        # Start counting back
        check_date = today if today in unique_dates else (today - timedelta(days=1))
        while check_date in unique_dates:
            streak += 1
            check_date -= timedelta(days=1)
            
    return {
        "notes_count": total_notes,
        "quizzes_count": total_quizzes,
        "attempts_count": total_attempts,
        "average_accuracy": round(avg_score, 1),
        "streak": streak,
        "boxes": boxes,
        "cards_mastered": mastered,
        "cards_learning": learning
    }
