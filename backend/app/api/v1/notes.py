from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models import Note
from app.schemas import NoteCreate, NoteOut, NoteUpdate
from app.services.note_service import generate_notes_from_doc

router = APIRouter()

@router.post("/generate", response_model=NoteOut)
def generate_note(
    document_id: Optional[str] = None,
    db: Session = Depends(get_db),
    x_user_id: str = Header(default="anonymous", alias="X-User-Id")
):
    # Call service to generate the title and blocks from the document
    generated = generate_notes_from_doc(document_id=document_id)
    
    # Save to Database
    db_note = Note(
        title=generated["title"],
        content=generated["content"],
        document_id=document_id,
        user_id=x_user_id
    )
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    return db_note

@router.get("/", response_model=List[NoteOut])
def list_notes(
    db: Session = Depends(get_db),
    x_user_id: str = Header(default="anonymous", alias="X-User-Id")
):
    notes = db.query(Note).filter(Note.user_id == x_user_id).order_by(Note.created_at.desc()).all()
    return notes

@router.get("/{note_id}", response_model=NoteOut)
def get_note(
    note_id: int,
    db: Session = Depends(get_db),
    x_user_id: str = Header(default="anonymous", alias="X-User-Id")
):
    note = db.query(Note).filter(Note.id == note_id, Note.user_id == x_user_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return note

@router.put("/{note_id}", response_model=NoteOut)
def update_note(
    note_id: int,
    note_update: NoteUpdate,
    db: Session = Depends(get_db),
    x_user_id: str = Header(default="anonymous", alias="X-User-Id")
):
    db_note = db.query(Note).filter(Note.id == note_id, Note.user_id == x_user_id).first()
    if not db_note:
        raise HTTPException(status_code=404, detail="Note not found")
        
    if note_update.title is not None:
        db_note.title = note_update.title
    if note_update.content is not None:
        # Convert Pydantic note blocks back to dictionary list
        db_note.content = [block.dict() for block in note_update.content]
        
    db.commit()
    db.refresh(db_note)
    return db_note

@router.delete("/{note_id}")
def delete_note(
    note_id: int,
    db: Session = Depends(get_db),
    x_user_id: str = Header(default="anonymous", alias="X-User-Id")
):
    db_note = db.query(Note).filter(Note.id == note_id, Note.user_id == x_user_id).first()
    if not db_note:
        raise HTTPException(status_code=404, detail="Note not found")
        
    db.delete(db_note)
    db.commit()
    return {"status": "success", "message": "Note deleted successfully"}
