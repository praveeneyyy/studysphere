from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models import Quiz, QuizResult
from app.services.agent_service import run_study_agent_workflow

router = APIRouter()

@router.get("/roadmap")
def get_study_roadmap(
    document_id: str,
    db: Session = Depends(get_db),
    x_user_id: str = Header(default="anonymous", alias="X-User-Id")
):
    """
    Runs the Planner-Reviewer agent graph using document information and real user quiz scores.
    """
    try:
        # Fetch user quiz results matching this document (or general history)
        quizzes = db.query(Quiz).filter(
            Quiz.document_id == document_id, 
            Quiz.user_id == x_user_id
        ).all()
        
        quiz_ids = [q.id for q in quizzes]
        
        quiz_attempts = []
        if quiz_ids:
            results = db.query(QuizResult).filter(
                QuizResult.quiz_id.in_(quiz_ids), 
                QuizResult.user_id == x_user_id
            ).all()
            
            for r in results:
                quiz_attempts.append({
                    "score": r.score,
                    "total_questions": r.total_questions,
                    "taken_at": r.taken_at.strftime("%Y-%m-%d %H:%M:%S")
                })
        
        # Run graph
        result = run_study_agent_workflow(
            document_id=document_id,
            quiz_attempts=quiz_attempts
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
