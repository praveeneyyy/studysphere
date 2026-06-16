from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Header, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models import FlashcardDeck, Flashcard, FlashcardProgress
from app.schemas import FlashcardDeckOut, FlashcardReview, FlashcardProgressOut
from app.services.flashcard_service import generate_flashcards_from_doc, calculate_spaced_repetition

router = APIRouter()

@router.post("/generate", response_model=FlashcardDeckOut)
def generate_deck(
    document_id: Optional[str] = None,
    num_cards: int = Query(default=10, ge=1, le=20),
    db: Session = Depends(get_db),
    x_user_id: str = Header(default="anonymous", alias="X-User-Id")
):
    # Call service to extract flashcards from document context
    generated = generate_flashcards_from_doc(document_id=document_id, num_cards=num_cards)
    
    # Save FlashcardDeck
    db_deck = FlashcardDeck(
        title=generated["title"],
        document_id=document_id,
        user_id=x_user_id
    )
    db.add(db_deck)
    db.commit()
    db.refresh(db_deck)
    
    # Save individual Flashcards and initialize their review progress
    for card in generated["cards"]:
        db_card = Flashcard(
            deck_id=db_deck.id,
            front=card["front"],
            back=card["back"]
        )
        db.add(db_card)
        db.commit()
        db.refresh(db_card)
        
        # Initialize spaced repetition progress
        db_prog = FlashcardProgress(
            flashcard_id=db_card.id,
            user_id=x_user_id,
            box=1
        )
        db.add(db_prog)
        
    db.commit()
    db.refresh(db_deck)
    return db_deck

@router.get("/", response_model=List[FlashcardDeckOut])
def list_decks(
    db: Session = Depends(get_db),
    x_user_id: str = Header(default="anonymous", alias="X-User-Id")
):
    decks = db.query(FlashcardDeck).filter(FlashcardDeck.user_id == x_user_id).order_by(FlashcardDeck.created_at.desc()).all()
    return decks

@router.get("/{deck_id}", response_model=FlashcardDeckOut)
def get_deck(
    deck_id: int,
    db: Session = Depends(get_db),
    x_user_id: str = Header(default="anonymous", alias="X-User-Id")
):
    deck = db.query(FlashcardDeck).filter(FlashcardDeck.id == deck_id, FlashcardDeck.user_id == x_user_id).first()
    if not deck:
        raise HTTPException(status_code=404, detail="Flashcard deck not found")
    return deck

@router.post("/cards/{card_id}/review", response_model=FlashcardProgressOut)
def review_card(
    card_id: int,
    review: FlashcardReview,
    db: Session = Depends(get_db),
    x_user_id: str = Header(default="anonymous", alias="X-User-Id")
):
    # Fetch progress
    progress = db.query(FlashcardProgress).filter(
        FlashcardProgress.flashcard_id == card_id, 
        FlashcardProgress.user_id == x_user_id
    ).first()
    
    if not progress:
        # If it doesn't exist, check card exists and create one
        card = db.query(Flashcard).filter(Flashcard.id == card_id).first()
        if not card:
            raise HTTPException(status_code=404, detail="Flashcard not found")
            
        progress = FlashcardProgress(
            flashcard_id=card_id,
            user_id=x_user_id,
            box=1
        )
        db.add(progress)
        db.commit()
        db.refresh(progress)
        
    # Calculate next spaced repetition schedule
    new_box, interval, next_review = calculate_spaced_repetition(
        box=progress.box,
        is_correct=review.is_correct
    )
    
    progress.box = new_box
    progress.interval = interval
    progress.next_review = next_review
    
    db.commit()
    db.refresh(progress)
    return progress
