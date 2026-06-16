import json
from typing import TypedDict, List, Dict, Any, Optional
from langgraph.graph import StateGraph, START, END
from llama_index.core import VectorStoreIndex, StorageContext
from llama_index.vector_stores.chroma import ChromaVectorStore
import chromadb
from llama_index.core import Settings

# Initialize local ChromaDB references
db = chromadb.PersistentClient(path="./chroma_db")
chroma_collection = db.get_or_create_collection("studysphere_documents")
vector_store = ChromaVectorStore(chroma_collection=chroma_collection)
storage_context = StorageContext.from_defaults(vector_store=vector_store)

# 1. State Definition
class RoadmapState(TypedDict):
    document_id: str
    roadmap: List[Dict[str, Any]]
    quiz_scores: List[Dict[str, Any]]
    reviews: List[str]

# 2. Nodes Implementation

def planner_node(state: RoadmapState) -> Dict[str, Any]:
    """
    Analyzes document context and generates a structured study roadmap.
    """
    document_id = state.get("document_id")
    try:
        index = VectorStoreIndex.from_vector_store(
            vector_store, storage_context=storage_context
        )
        query_engine = index.as_query_engine(similarity_top_k=8)
        
        # Pull main structural points of the document
        query_str = "Outline the sequential learning structure, core sub-topics, and chapters of this document."
        response = query_engine.query(query_str)
        context = str(response)

        prompt = f"""
You are an expert curriculum developer. Based on the document context below, generate a sequential study roadmap for a student.
Format the output as a valid JSON list of topics.

Context:
{context}

JSON Structure:
[
  {{
    "id": "t1",
    "topic": "Title of Topic 1",
    "description": "Short summary of what is covered in this topic"
  }}
]

Generate between 4 and 8 chronological study steps/topics. Return ONLY the raw JSON string. Do not wrap the JSON output in markdown tags.
"""
        llm = Settings.llm
        llm_response = llm.complete(prompt)
        text_response = str(llm_response).strip()

        if text_response.startswith("```"):
            lines = text_response.splitlines()
            if lines[0].startswith("```json") or lines[0].startswith("```"):
                text_response = "\n".join(lines[1:-1])

        roadmap = json.loads(text_response)
        
        # Ensure status field is initialized
        for idx, topic in enumerate(roadmap):
            topic["status"] = "pending"
            if "id" not in topic:
                topic["id"] = f"t{idx+1}"
                
        return {"roadmap": roadmap}
    except Exception as e:
        print(f"Error in planner_node: {e}")
        # Return fallback roadmap
        return {
            "roadmap": [
                {"id": "t1", "topic": "Introduction & Fundamentals", "description": "Review introductory sections.", "status": "pending"},
                {"id": "t2", "topic": "Core Concepts", "description": "Study main body content.", "status": "pending"},
                {"id": "t3", "topic": "Advanced Applications", "description": "Review formulas and final summaries.", "status": "pending"}
            ]
        }

def reviewer_node(state: RoadmapState) -> Dict[str, Any]:
    """
    Evaluates quiz performance to add review suggestions and highlight weak areas.
    """
    roadmap = state.get("roadmap", [])
    quiz_scores = state.get("quiz_scores", [])
    
    if not quiz_scores:
        return {"reviews": ["No quiz attempts recorded yet. Take a quiz to receive personalized reviewer feedback."]}

    try:
        # Format quiz results for the LLM
        history_str = ""
        for idx, score in enumerate(quiz_scores):
            history_str += f"- Quiz {idx+1}: Score {score.get('score')}/{score.get('total_questions')} taken on {score.get('taken_at')}\n"

        prompt = f"""
You are an expert tutor reviewing a student's performance logs.
Analyze their quiz history and suggest 2-3 specific study recommendations (e.g. which topics they are weak in, what they should revise).

Quiz History:
{history_str}

Study Roadmap Topics:
{json.dumps(roadmap, indent=2)}

Format the output as a valid JSON list of strings (recommendations).
Return ONLY the raw JSON list, no markdown wrappers.
"""
        llm = Settings.llm
        llm_response = llm.complete(prompt)
        text_response = str(llm_response).strip()

        if text_response.startswith("```"):
            lines = text_response.splitlines()
            if lines[0].startswith("```json") or lines[0].startswith("```"):
                text_response = "\n".join(lines[1:-1])

        reviews = json.loads(text_response)
        return {"reviews": reviews}
    except Exception as e:
        print(f"Error in reviewer_node: {e}")
        return {"reviews": ["Review failed to generate. Focus on topics where your quiz scores fell below 70%."]}

# 3. Graph Construction
builder = StateGraph(RoadmapState)
builder.add_node("planner", planner_node)
builder.add_node("reviewer", reviewer_node)

builder.set_entry_point("planner")
builder.add_edge("planner", "reviewer")
builder.add_edge("reviewer", END)

# Compile the multi-agent graph
graph = builder.compile()

def run_study_agent_workflow(document_id: str, quiz_attempts: List[Dict[str, Any]]) -> dict:
    """
    Compiles and runs the planner-reviewer agent graph.
    """
    initial_state = {
        "document_id": document_id,
        "roadmap": [],
        "quiz_scores": quiz_attempts,
        "reviews": []
    }
    
    # Run the graph synchronously
    result = graph.invoke(initial_state)
    return {
        "roadmap": result.get("roadmap", []),
        "reviews": result.get("reviews", [])
    }
