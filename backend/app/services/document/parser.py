import os
from llama_index.core import SimpleDirectoryReader, VectorStoreIndex, StorageContext
from llama_index.vector_stores.chroma import ChromaVectorStore
import chromadb
from llama_index.embeddings.google_genai import GoogleGenAIEmbedding
from llama_index.llms.google_genai import GoogleGenAI
from llama_index.core import Settings

_settings_initialized = False

def init_settings():
    global _settings_initialized
    if not _settings_initialized:
        # Load environment variables from .env if present
        try:
            from dotenv import load_dotenv
            load_dotenv()
        except ImportError:
            pass
        Settings.llm = GoogleGenAI(model="gemini-3.5-flash")
        Settings.embed_model = GoogleGenAIEmbedding(model_name="text-embedding-004")
        _settings_initialized = True

# Initialize ChromaDB locally for MVP
db = chromadb.PersistentClient(path="./chroma_db")
chroma_collection = db.get_or_create_collection("studysphere_documents")
vector_store = ChromaVectorStore(chroma_collection=chroma_collection)
storage_context = StorageContext.from_defaults(vector_store=vector_store)

def process_document(file_path: str):
    """
    Parses a document (PDF, DOCX, PPTX, XLSX) and stores its embeddings in ChromaDB.
    """
    try:
        init_settings()
        documents = SimpleDirectoryReader(input_files=[file_path]).load_data()
        index = VectorStoreIndex.from_documents(
            documents, storage_context=storage_context
        )
        return {"message": "Document indexed successfully", "nodes": len(documents)}
    except Exception as e:
        print(f"Error processing document: {e}")
        raise e
