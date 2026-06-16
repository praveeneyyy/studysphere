from llama_index.core import VectorStoreIndex, StorageContext
from llama_index.vector_stores.chroma import ChromaVectorStore
import chromadb

# Initialize local chroma db
db = chromadb.PersistentClient(path="./chroma_db")
chroma_collection = db.get_or_create_collection("studysphere_documents")
vector_store = ChromaVectorStore(chroma_collection=chroma_collection)
storage_context = StorageContext.from_defaults(vector_store=vector_store)

def query_documents(query_str: str):
    """
    Query the documents stored in ChromaDB using Gemini.
    """
    try:
        # Load index from the vector store
        index = VectorStoreIndex.from_vector_store(
            vector_store, storage_context=storage_context
        )
        query_engine = index.as_query_engine()
        response = query_engine.query(query_str)
        return {"response": str(response)}
    except Exception as e:
        print(f"Error querying: {e}")
        return {"error": str(e)}
