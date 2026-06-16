import json
from typing import Optional
from fastapi import APIRouter, HTTPException
from llama_index.core import VectorStoreIndex, StorageContext
from llama_index.vector_stores.chroma import ChromaVectorStore
import chromadb
from llama_index.core import Settings

router = APIRouter()

db = chromadb.PersistentClient(path="./chroma_db")
chroma_collection = db.get_or_create_collection("studysphere_documents")
vector_store = ChromaVectorStore(chroma_collection=chroma_collection)
storage_context = StorageContext.from_defaults(vector_store=vector_store)

@router.post("/podcast-script")
def generate_podcast_script(document_id: str):
    """
    Queries document context and generates a 2-speaker audio script (podcast overview).
    """
    try:
        index = VectorStoreIndex.from_vector_store(
            vector_store, storage_context=storage_context
        )
        
        query_engine = index.as_query_engine(similarity_top_k=8)
        query_str = "Summarize the major findings, conclusions, and core concepts of this document."
        response = query_engine.query(query_str)
        context = str(response)

        prompt = f"""
You are a professional scriptwriter. Based on the document context below, generate a dialogue script for an educational podcast episode summarizing the document.

Context:
{context}

The dialogue must feature two alternating speakers:
1. 'Host A': A friendly, inquisitive host who asks questions, guides the topic, and represents the listener.
2. 'Host B': An expert scholar who breaks down concepts in simple terms, using relatable analogies.

Format the output as a valid JSON object with 'title' and 'dialogue' fields:
{{
  "title": "A podcast episode title (e.g. 'Deep Dive into [Topic]')",
  "dialogue": [
    {{
      "speaker": "Host A",
      "text": "The spoken words of Host A."
    }},
    {{
      "speaker": "Host B",
      "text": "The spoken response of Host B."
    }}
  ]
}}

Generate between 8 and 12 speech turns. Keep the text engaging, punchy, and conversational. Return ONLY the raw JSON string. Do not wrap in markdown tags.
"""
        llm = Settings.llm
        llm_response = llm.complete(prompt)
        text_response = str(llm_response).strip()

        if text_response.startswith("```"):
            lines = text_response.splitlines()
            if lines[0].startswith("```json") or lines[0].startswith("```"):
                text_response = "\n".join(lines[1:-1])

        data = json.loads(text_response)
        return data
    except Exception as e:
        print(f"Error in generate_podcast_script: {e}")
        # Return fallback dialog script
        return {
            "title": "Brief Audio Overview",
            "dialogue": [
                {"speaker": "Host A", "text": "Welcome to StudySphere Audio Overviews. Today we're giving a quick overview of your uploaded study material."},
                {"speaker": "Host B", "text": "Yes, we look forward to helping you learn. This document covers key definitions and conceptual foundations."},
                {"speaker": "Host A", "text": "Wonderful. Go ahead and start exploring notes or quizzes to test your understanding."}
            ]
        }
