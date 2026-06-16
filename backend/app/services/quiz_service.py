import json
from llama_index.core import VectorStoreIndex, StorageContext
from llama_index.vector_stores.chroma import ChromaVectorStore
import chromadb
from llama_index.core import Settings
from app.schemas import QuestionCreate

db = chromadb.PersistentClient(path="./chroma_db")
chroma_collection = db.get_or_create_collection("studysphere_documents")
vector_store = ChromaVectorStore(chroma_collection=chroma_collection)
storage_context = StorageContext.from_defaults(vector_store=vector_store)

def generate_quiz_from_doc(document_id: str = None, num_questions: int = 5) -> dict:
    """
    Queries document chunks and uses Gemini to generate a quiz with answers and explanations.
    """
    try:
        index = VectorStoreIndex.from_vector_store(
            vector_store, storage_context=storage_context
        )
        
        query_engine = index.as_query_engine(similarity_top_k=8)
        query_str = (
            f"Extract the most important facts, definitions, rules, and logic in the document "
            f"suitable for making a {num_questions}-question quiz."
        )
        response = query_engine.query(query_str)
        context = str(response)

        prompt = f"""
You are an expert examiner. Based on the document context below, generate a {num_questions}-question quiz.
The quiz must contain a combination of multiple choice questions (MCQ) and True/False (boolean) questions.

Context:
{context}

Format the output as a single JSON object with 'title' and 'questions' fields:
{{
  "title": "A title for the quiz (e.g. 'Concept Quiz - [Topic]')",
  "questions": [
    {{
      "question_text": "The text of the question?",
      "question_type": "mcq" | "boolean",
      "options": ["Option A", "Option B", "Option C", "Option D"],  // For boolean, use ["True", "False"]
      "correct_answer": "The index of the correct option (e.g. '0' or '1' or '2')",
      "explanation": "Brief explanation of why this answer is correct."
    }}
  ]
}}

Generate exactly {num_questions} questions. Return ONLY the raw JSON string. Do not wrap the JSON output in markdown tags.
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
        
        # Validate questions
        questions = []
        for q in data.get("questions", []):
            questions.append(
                QuestionCreate(
                    question_text=q.get("question_text", "Question?"),
                    question_type=q.get("question_type", "mcq"),
                    options=q.get("options", []),
                    correct_answer=str(q.get("correct_answer", "0")),
                    explanation=q.get("explanation", "")
                )
            )
            
        return {
            "title": data.get("title", "Document Assessment"),
            "questions": [q.dict() for q in questions]
        }
    except Exception as e:
        print(f"Error in generate_quiz_from_doc: {e}")
        # Return fallback quiz
        return {
            "title": "Assessment (Failed to Generate)",
            "questions": [
                {
                    "question_text": "Sorry, we failed to generate the quiz. Check your API configuration?",
                    "question_type": "boolean",
                    "options": ["True", "False"],
                    "correct_answer": "0",
                    "explanation": "Fallback question due to API or parsing error."
                }
            ]
        }
