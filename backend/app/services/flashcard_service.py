import json
from datetime import datetime, timedelta
from llama_index.core import VectorStoreIndex, StorageContext
from llama_index.vector_stores.chroma import ChromaVectorStore
import chromadb
from llama_index.core import Settings
from app.schemas import FlashcardCreate

db = chromadb.PersistentClient(path="./chroma_db")
chroma_collection = db.get_or_create_collection("studysphere_documents")
vector_store = ChromaVectorStore(chroma_collection=chroma_collection)
storage_context = StorageContext.from_defaults(vector_store=vector_store)

def generate_flashcards_from_doc(document_id: str = None, num_cards: int = 10) -> dict:
    """
    Queries document chunks and uses Gemini to extract key terms, formulas, and Q&As into flashcards.
    """
    try:
        index = VectorStoreIndex.from_vector_store(
            vector_store, storage_context=storage_context
        )
        
        query_engine = index.as_query_engine(similarity_top_k=8)
        query_str = (
            f"Identify the top {num_cards} core terms, definitions, key formulas, or Q&A concepts "
            f"in this document suitable for flashcards."
        )
        response = query_engine.query(query_str)
        context = str(response)

        prompt = f"""
You are an expert tutor. Based on the document context below, extract exactly {num_cards} key terms or Q&A pairs to make a flashcard deck.

Context:
{context}

Format the output as a single JSON object with 'title' and 'cards' fields:
{{
  "title": "A title for the deck (e.g. 'Flashcards - [Topic]')",
  "cards": [
    {{
      "front": "The term, question, or formula (front of the card)",
      "back": "The short definition, answer, or explanation (back of the card)"
    }}
  ]
}}

Generate exactly {num_cards} cards. Keep fronts and backs relatively brief and punchy. Return ONLY the raw JSON string. Do not wrap the JSON output in markdown tags.
"""
        
        llm = Settings.llm
        llm_response = llm.complete(prompt)
        text_response = str(llm_response).strip()

        # Clean markdown wrappers if LLM still outputs them
        if text_response.startswith("```"):
            lines = text_response.splitlines()
            if lines[0].startswith("```json") or lines[0].startswith("```"):
                text_response = "\n".join(lines[1:-1])

        data = json.loads(text_response)
        
        cards = []
        for c in data.get("cards", []):
            cards.append(
                FlashcardCreate(
                    front=c.get("front", ""),
                    back=c.get("back", "")
                )
            )
            
        return {
            "title": data.get("title", "Study Deck"),
            "cards": [c.dict() for c in cards]
        }
    except Exception as e:
        print(f"Error in generate_flashcards_from_doc: {e}")
        return {
            "title": "Study Deck (Failed to Generate)",
            "cards": [
                {
                    "front": "Failed to generate card front",
                    "back": f"Error: {str(e)}"
                }
            ]
        }

def calculate_spaced_repetition(box: int, is_correct: bool) -> tuple[int, int, datetime]:
    """
    Leitner System Spaced Repetition Scheduling:
    Box 1: review in 1 day
    Box 2: review in 3 days
    Box 3: review in 7 days
    Box 4: review in 14 days
    Box 5: review in 30 days
    
    If incorrect, card drops back to Box 1.
    If correct, card increases Box level up to 5.
    Returns: (new_box, interval_days, next_review_datetime)
    """
    if not is_correct:
        # Drops back to Box 1
        new_box = 1
        interval = 1
    else:
        # Advances box level (max 5)
        new_box = min(box + 1, 5)
        
        # Determine review interval
        if new_box == 1:
            interval = 1
        elif new_box == 2:
            interval = 3
        elif new_box == 3:
            interval = 7
        elif new_box == 4:
            interval = 14
        else: # Box 5
            interval = 30
            
    next_review = datetime.utcnow() + timedelta(days=interval)
    return new_box, interval, next_review
