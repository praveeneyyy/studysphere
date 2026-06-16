import json
import uuid
from llama_index.core import VectorStoreIndex, StorageContext
from llama_index.vector_stores.chroma import ChromaVectorStore
import chromadb
from llama_index.core import Settings
from app.schemas import NoteBlock

# Initialize ChromaDB persistent client
db = chromadb.PersistentClient(path="./chroma_db")
chroma_collection = db.get_or_create_collection("studysphere_documents")
vector_store = ChromaVectorStore(chroma_collection=chroma_collection)
storage_context = StorageContext.from_defaults(vector_store=vector_store)

def generate_notes_from_doc(document_id: str = None) -> dict:
    """
    Retrieves key information from indexed documents and structures them into notes (Notion-style blocks).
    """
    try:
        index = VectorStoreIndex.from_vector_store(
            vector_store, storage_context=storage_context
        )
        
        # Query for a summary and key concepts
        query_engine = index.as_query_engine(similarity_top_k=8)
        query_str = (
            "Summarize the main topics, key concepts, formulas, and critical details of the document. "
            "Provide comprehensive notes."
        )
        response = query_engine.query(query_str)
        context = str(response)

        # Build note generation prompt for LLM
        prompt = f"""
You are an expert study assistant. Based on the following document context, generate structured study notes.
The study notes must be formatted EXACTLY as a JSON object with 'title' and 'blocks' fields.

Context:
{context}

JSON Structure:
{{
  "title": "A concise, descriptive title for the notes",
  "blocks": [
    {{
      "id": "string (unique block ID)",
      "type": "heading_1" | "heading_2" | "paragraph" | "bulleted_list_item" | "code" | "callout" | "todo_item",
      "content": "string (the markdown or text content of the block)",
      "checked": null (boolean only for todo_item type, otherwise null or omit)
    }}
  ]
}}

Generate at least 8 to 15 blocks to make the notes comprehensive and valuable. Do not wrap the JSON output in markdown tags (like ```json). Return ONLY the raw JSON string.
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
        
        # Ensure block IDs are set and unique
        blocks = []
        for block in data.get("blocks", []):
            blocks.append(
                NoteBlock(
                    id=block.get("id") or str(uuid.uuid4())[:8],
                    type=block.get("type", "paragraph"),
                    content=block.get("content", ""),
                    checked=block.get("checked") if block.get("type") == "todo_item" else None
                )
            )
            
        return {
            "title": data.get("title", "Study Notes"),
            "content": [b.dict() for b in blocks]
        }
    except Exception as e:
        print(f"Error in generate_notes_from_doc: {e}")
        # Return fallback content in case of parsing/API errors
        return {
            "title": "Study Notes (Generation Failed)",
            "content": [
                {
                    "id": "error-block",
                    "type": "callout",
                    "content": f"Failed to generate notes automatically: {str(e)}. Please try again."
                }
            ]
        }
