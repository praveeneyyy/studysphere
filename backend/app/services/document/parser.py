import os
from llama_index.core import SimpleDirectoryReader, VectorStoreIndex, StorageContext
from llama_index.vector_stores.chroma import ChromaVectorStore
import chromadb
from llama_index.embeddings.gemini import GeminiEmbedding
from llama_index.llms.gemini import Gemini
from llama_index.core import Settings

# Initialize Gemini models
# NOTE: Requires GOOGLE_API_KEY environment variable to be set
Settings.llm = Gemini(model="models/gemini-1.5-flash")
Settings.embed_model = GeminiEmbedding(model_name="models/embedding-001")

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
        documents = SimpleDirectoryReader(input_files=[file_path]).load_data()
        index = VectorStoreIndex.from_documents(
            documents, storage_context=storage_context
        )
        return {"message": "Document indexed successfully", "nodes": len(documents)}
    except Exception as e:
        print(f"Error processing document: {e}")
        raise e
