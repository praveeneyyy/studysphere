from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.rag.chat_engine import query_documents

router = APIRouter()

class ChatRequest(BaseModel):
    query: str

@router.post("/message")
async def chat_message(request: ChatRequest):
    if not request.query:
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    
    result = query_documents(request.query)
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
        
    return {"reply": result["response"]}
