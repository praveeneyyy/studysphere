from fastapi import APIRouter, UploadFile, File, HTTPException
import shutil
import os
from app.services.document.parser import process_document

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")
    
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        # Process and embed the document
        result = process_document(file_path)
        return {"filename": file.filename, "status": "success", "details": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/")
def list_documents():
    """
    Returns list of files uploaded to the server UPLOAD_DIR.
    """
    try:
        if not os.path.exists(UPLOAD_DIR):
            return []
        files = [f for f in os.listdir(UPLOAD_DIR) if os.path.isfile(os.path.join(UPLOAD_DIR, f))]
        return files
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
