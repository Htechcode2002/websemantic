from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
# Force reload for new ttl data
from pydantic import BaseModel
from typing import List
import rdflib

app = FastAPI(title="Semantic Course Recommendation API")

# Allow CORS for Next.js Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"], # For development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load knowledge graph
print("Loading Knowledge Graph...")
g = rdflib.Graph()
import os
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ttl_path = os.path.join(base_dir, "university.ttl")
g.parse(ttl_path, format="turtle")
print(f"Loaded {len(g)} triples.")

class RecommendRequest(BaseModel):
    interests: List[str]
    completed_courses: List[str] = []

@app.get("/api/topics")
async def get_topics():
    # Query all available topics from the ontology
    query = """
    PREFIX ex: <http://example.org/university#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    SELECT DISTINCT ?topicName WHERE {
        ?topic a ex:Topic ;
               rdfs:label ?topicName .
    }
    """
    try:
        results = g.query(query)
        topics = [str(row.topicName) for row in results]
        return {"topics": topics}
    except Exception as e:
        import traceback
        return {"error": str(e), "traceback": traceback.format_exc()}

@app.get("/api/courses")
async def get_courses():
    # Query all available courses from the ontology
    query = """
    PREFIX ex: <http://example.org/university#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    SELECT DISTINCT ?courseName WHERE {
        ?course a ex:Course ;
               rdfs:label ?courseName .
    }
    """
    results = g.query(query)
    courses = sorted([str(row.courseName) for row in results])
    return {"courses": courses}

@app.post("/api/recommend")
async def recommend_courses(req: RecommendRequest):
    if not req.interests:
        return {"recommendations": []}

    # Format interests for SPARQL IN clause: e.g., "Machine Learning", "Data Science"
    interests_str = ", ".join([f'"{i}"' for i in req.interests])
    
    # Dynamic SPARQL Query: Find courses that cover the requested topics
    query = f"""
    PREFIX ex: <http://example.org/university#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

    SELECT DISTINCT ?courseName ?topicName
    WHERE {{
        ?course a ex:Course ;
                rdfs:label ?courseName ;
                ex:coversTopic ?topic .
        ?topic rdfs:label ?topicName .
        FILTER(?topicName IN ({interests_str}))
    }}
    """
    
    results = g.query(query)
    recommendations = []
    
    # Filter out completed courses manually since the user might not be in the RDF graph
    completed_lower = [c.lower() for c in req.completed_courses]
    
    for row in results:
        course_name = str(row.courseName)
        topic_name = str(row.topicName)
        
        if course_name.lower() not in completed_lower:
            recommendations.append({
                "course": course_name,
                "reason": f"Matches your interest in '{topic_name}'"
            })
            
    return {"recommendations": recommendations}

if __name__ == "__main__":
    import uvicorn
    # uvicorn backend.main:app --reload
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
