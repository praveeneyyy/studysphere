from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Header, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models import Quiz, Question, QuizResult
from app.schemas import QuizCreate, QuizOut, QuizResultCreate, QuizResultOut
from app.services.quiz_service import generate_quiz_from_doc

router = APIRouter()

@router.post("/generate", response_model=QuizOut)
def generate_quiz(
    document_id: Optional[str] = None,
    num_questions: int = Query(default=5, ge=1, le=15),
    db: Session = Depends(get_db),
    x_user_id: str = Header(default="anonymous", alias="X-User-Id")
):
    # Call service to generate quiz title and questions from document
    generated = generate_quiz_from_doc(document_id=document_id, num_questions=num_questions)
    
    # Save Quiz
    db_quiz = Quiz(
        title=generated["title"],
        document_id=document_id,
        user_id=x_user_id
    )
    db.add(db_quiz)
    db.commit()
    db.refresh(db_quiz)
    
    # Save individual Questions
    for q in generated["questions"]:
        db_q = Question(
            quiz_id=db_quiz.id,
            question_text=q["question_text"],
            question_type=q["question_type"],
            options=q["options"],
            correct_answer=q["correct_answer"],
            explanation=q["explanation"]
        )
        db.add(db_q)
        
    db.commit()
    db.refresh(db_quiz)
    return db_quiz

@router.get("/", response_model=List[QuizOut])
def list_quizzes(
    db: Session = Depends(get_db),
    x_user_id: str = Header(default="anonymous", alias="X-User-Id")
):
    quizzes = db.query(Quiz).filter(Quiz.user_id == x_user_id).order_by(Quiz.created_at.desc()).all()
    return quizzes

@router.get("/{quiz_id}", response_model=QuizOut)
def get_quiz(
    quiz_id: int,
    db: Session = Depends(get_db),
    x_user_id: str = Header(default="anonymous", alias="X-User-Id")
):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id, Quiz.user_id == x_user_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    return quiz

@router.post("/{quiz_id}/submit", response_model=QuizResultOut)
def submit_quiz(
    quiz_id: int,
    attempt: QuizResultCreate,
    db: Session = Depends(get_db),
    x_user_id: str = Header(default="anonymous", alias="X-User-Id")
):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id, Quiz.user_id == x_user_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
        
    # Double check/re-evaluate score based on questions
    questions = {str(q.id): q for q in quiz.questions}
    score = 0
    total = len(quiz.questions)
    
    for q_id_str, user_ans in attempt.answers.items():
        if q_id_str in questions:
            q = questions[q_id_str]
            # correct_answer represents index or text string
            if str(q.correct_answer).strip().lower() == str(user_ans).strip().lower():
                score += 1
                
    # Create the result
    db_result = QuizResult(
        quiz_id=quiz_id,
        user_id=x_user_id,
        score=score,
        total_questions=total if total > 0 else attempt.total_questions,
        answers=attempt.answers
    )
    db.add(db_result)
    db.commit()
    db.refresh(db_result)
    return db_result

@router.get("/{quiz_id}/results", response_model=List[QuizResultOut])
def get_quiz_results(
    quiz_id: int,
    db: Session = Depends(get_db),
    x_user_id: str = Header(default="anonymous", alias="X-User-Id")
):
    results = db.query(QuizResult).filter(
        QuizResult.quiz_id == quiz_id, 
        QuizResult.user_id == x_user_id
    ).order_by(QuizResult.taken_at.desc()).all()
    return results
